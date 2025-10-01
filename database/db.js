const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'pos.db');
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;
let SQL = null;

// Initialize sql.js
const initDb = async () => {
  if (db) return db; // Return existing instance
  
  SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  return db;
};

// Save database to file
const saveDb = () => {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }
};

// Wrapper for exec
const execWrapper = (sql) => {
  if (!db) throw new Error('Database not initialized');
  db.exec(sql);
  saveDb();
};

// Wrapper for prepare with better error handling
const prepareWrapper = (sql) => {
  return {
    run: (...params) => {
      if (!db) throw new Error('Database not initialized');
      try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();
        
        const lastIdStmt = db.prepare("SELECT last_insert_rowid() as id");
        lastIdStmt.step();
        const lastId = lastIdStmt.getAsObject().id;
        lastIdStmt.free();
        
        saveDb();
        return { lastInsertRowid: lastId, changes: 1 };
      } catch (error) {
        console.error('Error in run:', error);
        throw error;
      }
    },
    get: (...params) => {
      if (!db) throw new Error('Database not initialized');
      try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const result = stmt.step() ? stmt.getAsObject() : undefined;
        stmt.free();
        return result;
      } catch (error) {
        console.error('Error in get:', error);
        throw error;
      }
    },
    all: (...params) => {
      if (!db) throw new Error('Database not initialized');
      try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      } catch (error) {
        console.error('Error in all:', error);
        throw error;
      }
    }
  };
};

// Create db proxy object
const dbProxy = {
  exec: execWrapper,
  prepare: prepareWrapper,
  saveDb: saveDb
};

// Initialize database schema
const initSchema = async () => {
  await initDb();
  
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'cashier')),
      full_name TEXT,
      email TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      cost REAL,
      category TEXT,
      stock_quantity INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 10,
      image_url TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sales table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      tax_amount REAL NOT NULL,
      tax_rate REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT,
      status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'refunded', 'cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Sale items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      barcode TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Inventory transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('sale', 'restock', 'adjustment', 'return')),
      quantity_change INTEGER NOT NULL,
      quantity_before INTEGER NOT NULL,
      quantity_after INTEGER NOT NULL,
      reference_id INTEGER,
      user_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sync queue table (for offline mode)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      data TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'synced', 'failed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced_at DATETIME
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_sales_transaction_id ON sales(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
  `);

  // Insert default settings
  const defaultSettings = [
    ['tax_rate', '0.10'],
    ['currency', 'USD'],
    ['currency_symbol', '$'],
    ['receipt_header', 'Retail Store'],
    ['receipt_footer', 'Thank you for your business!'],
    ['low_stock_threshold', '10'],
    ['receipt_format', 'standard']
  ];

  defaultSettings.forEach(([key, value]) => {
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  });

  saveDb();
  console.log('Database schema initialized successfully');
  
  return dbProxy;
};

// Initialize on require (for compatibility with existing routes)
let initialized = false;
const ensureInitialized = async () => {
  if (!initialized) {
    await initSchema();
    initialized = true;
  }
  return dbProxy;
};

// For backward compatibility, export dbProxy directly
// Routes will use this synchronously after server initialization
module.exports = dbProxy;
module.exports.initSchema = initSchema;
module.exports.ensureInitialized = ensureInitialized;
