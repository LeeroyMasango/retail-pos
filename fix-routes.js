const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = ['settings.js', 'sync.js', 'inventory.js', 'analytics.js', 'sales.js'];

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add const db = getDb(); after each try { that doesn't already have it
  content = content.replace(/(\n\s+try\s*\{\s*\n)(\s+)((?!const db = getDb))/g, '$1$2const db = getDb();\n$2$3');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${file}`);
});

console.log('All route files fixed!');
