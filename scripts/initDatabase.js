require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initSchema, getDb } = require('../database/db');

const initializeDatabase = async () => {
  console.log('Initializing database with sample data...');

  try {
    // Initialize schema first
    await initSchema();
    const db = getDb();
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const userStmt = db.prepare(`
      INSERT OR IGNORE INTO users (username, password, role, full_name, email)
      VALUES (?, ?, ?, ?, ?)
    `);

    userStmt.run('admin', hashedPassword, 'admin', 'System Administrator', 'admin@retailstore.com');
    userStmt.run('cashier1', await bcrypt.hash('cashier123', 10), 'cashier', 'John Doe', 'john@retailstore.com');
    userStmt.run('manager1', await bcrypt.hash('manager123', 10), 'manager', 'Jane Smith', 'jane@retailstore.com');

    console.log('✓ Users created');

    // Create sample products
    const productStmt = db.prepare(`
      INSERT OR IGNORE INTO products (barcode, name, description, price, cost, category, stock_quantity, min_stock_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleProducts = [
      ['8901234567890', 'Coca Cola 500ml', 'Refreshing cola drink', 1.99, 1.20, 'Beverages', 100, 20],
      ['8901234567891', 'Lays Chips Classic', 'Crispy potato chips', 2.49, 1.50, 'Snacks', 80, 15],
      ['8901234567892', 'Milk 1L', 'Fresh whole milk', 3.99, 2.50, 'Dairy', 50, 10],
      ['8901234567893', 'White Bread', 'Soft white bread loaf', 2.99, 1.80, 'Bakery', 40, 10],
      ['8901234567894', 'Eggs 12 pack', 'Farm fresh eggs', 4.99, 3.00, 'Dairy', 60, 15],
      ['8901234567895', 'Orange Juice 1L', 'Pure orange juice', 5.49, 3.50, 'Beverages', 45, 10],
      ['8901234567896', 'Chocolate Bar', 'Milk chocolate bar', 1.49, 0.80, 'Snacks', 120, 25],
      ['8901234567897', 'Bananas 1kg', 'Fresh bananas', 2.99, 1.50, 'Produce', 70, 15],
      ['8901234567898', 'Apples 1kg', 'Red delicious apples', 3.99, 2.20, 'Produce', 55, 12],
      ['8901234567899', 'Butter 250g', 'Salted butter', 4.49, 2.80, 'Dairy', 35, 8],
      ['8901234567900', 'Coffee 200g', 'Ground coffee beans', 8.99, 5.50, 'Beverages', 30, 8],
      ['8901234567901', 'Tea Bags 100pk', 'Black tea bags', 6.99, 4.00, 'Beverages', 40, 10],
      ['8901234567902', 'Sugar 1kg', 'White sugar', 2.49, 1.30, 'Groceries', 90, 20],
      ['8901234567903', 'Rice 2kg', 'Long grain white rice', 7.99, 5.00, 'Groceries', 65, 15],
      ['8901234567904', 'Pasta 500g', 'Spaghetti pasta', 2.99, 1.70, 'Groceries', 75, 18],
      ['8901234567905', 'Tomato Sauce', 'Pasta tomato sauce', 3.49, 2.00, 'Groceries', 55, 12],
      ['8901234567906', 'Olive Oil 500ml', 'Extra virgin olive oil', 9.99, 6.50, 'Groceries', 25, 8],
      ['8901234567907', 'Cereal 400g', 'Corn flakes cereal', 4.99, 3.00, 'Breakfast', 48, 12],
      ['8901234567908', 'Yogurt 500g', 'Plain yogurt', 3.99, 2.30, 'Dairy', 42, 10],
      ['8901234567909', 'Cheese 200g', 'Cheddar cheese block', 5.99, 3.80, 'Dairy', 38, 10]
    ];

    sampleProducts.forEach(product => {
      productStmt.run(...product);
    });

    console.log('✓ Sample products created');

    console.log('\n✓ Database initialized successfully!');
    console.log('\nDefault credentials:');
    console.log('  Admin    - username: admin     password: admin123');
    console.log('  Manager  - username: manager1  password: manager123');
    console.log('  Cashier  - username: cashier1  password: cashier123');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initializeDatabase();
