# Retail POS - Point of Sale Application

A comprehensive, full-featured Point of Sale (POS) system designed for retail stores with mobile support, inventory management, analytics, and offline capabilities.

## 🌟 Features

### Core Functionalities
- **Barcode Scanning**: Use mobile camera to scan product barcodes
- **Real-Time Inventory Updates**: Automatic stock level adjustments on sales
- **Cart System**: Add items with quantity controls and discount support
- **Pricing & Tax**: Configurable tax rates and automatic calculations
- **Receipt Generation**: Print or export receipts in PDF/Text format
- **Multi-User Support**: Role-based access (Admin, Manager, Cashier)

### Analytics Dashboard
- Daily sales summary (revenue, transactions)
- Inventory overview (stock levels, fast-moving items)
- Sales trends and patterns
- Category-wise sales breakdown
- Top-selling products
- Payment method analytics

### Inventory Management
- Low stock alerts
- Out-of-stock notifications
- Inventory transactions tracking
- Restock management
- Fast-moving items identification

### Advanced Features
- **Offline Mode**: Queue operations and sync when online
- **Settings Panel**: Configure tax rates, currency, receipt format, alerts
- **Data Export**: Export analytics to CSV
- **Secure Authentication**: JWT-based with role-based permissions
- **Mobile & Tablet Optimized**: Responsive design for all devices

## 📁 Project Structure

```
retail-pos/
├── server.js                 # Express server entry point
├── package.json             # Backend dependencies
├── .env.example             # Environment variables template
├── database/
│   └── db.js               # SQLite database setup
├── routes/
│   ├── auth.js             # Authentication endpoints
│   ├── products.js         # Product management
│   ├── sales.js            # Sales transactions
│   ├── inventory.js        # Inventory management
│   ├── analytics.js        # Analytics & reporting
│   ├── settings.js         # System settings
│   └── sync.js             # Offline sync
├── middleware/
│   └── auth.js             # JWT authentication middleware
├── utils/
│   └── receiptGenerator.js # Receipt PDF/text generation
├── scripts/
│   └── initDatabase.js     # Database initialization
└── mobile-app/
    ├── App.js              # React Native entry point
    ├── package.json        # Mobile app dependencies
    ├── app.json            # Expo configuration
    └── src/
        ├── screens/        # App screens
        ├── context/        # React contexts (Auth, Cart, Offline)
        └── services/       # API service layer
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI** (for mobile app)
- **Android Studio** or **Xcode** (for mobile development)

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd retail-pos
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file** with your configuration:
   ```env
   PORT=3000
   JWT_SECRET=your-secret-key-change-this-in-production
   NODE_ENV=development
   DATABASE_PATH=./database/pos.db
   ```

5. **Initialize the database with sample data**:
   ```bash
   npm run init-db
   ```

6. **Start the server**:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

The backend server will start on `http://localhost:3000`

### Mobile App Setup

1. **Navigate to the mobile app directory**:
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Update API URL** in `src/services/api.js`:
   ```javascript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000/api';
   ```
   Replace `YOUR_IP_ADDRESS` with your computer's local IP address.

4. **Start the Expo development server**:
   ```bash
   npm start
   ```

5. **Run on device**:
   - **Android**: Press `a` or scan QR code with Expo Go app
   - **iOS**: Press `i` or scan QR code with Camera app
   - **Web**: Press `w` (limited functionality)

## 👥 Default User Accounts

After initializing the database, you can login with these accounts:

| Role     | Username  | Password     |
|----------|-----------|--------------|
| Admin    | admin     | admin123     |
| Manager  | manager1  | manager123   |
| Cashier  | cashier1  | cashier123   |

## 📱 Mobile App Usage

### For Cashiers

1. **Login** with your credentials
2. **Scan Products**: Tap "Start Scanning" or use manual barcode entry
3. **Review Cart**: Check items, adjust quantities, add discounts
4. **Checkout**: Select payment method and complete sale
5. **Receipt**: Print or share receipt with customer

### For Managers/Admins

All cashier features plus:

- **Inventory Management**: View stock levels, restock products, adjust inventory
- **Analytics Dashboard**: View sales trends, top products, revenue reports
- **Settings**: Configure tax rates, currency, receipt format, alert thresholds
- **User Management**: Create and manage user accounts (via API)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List all products
- `GET /api/products/barcode/:barcode` - Get product by barcode
- `POST /api/products` - Create product (Manager/Admin)
- `PUT /api/products/:id` - Update product (Manager/Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Sales
- `POST /api/sales` - Create new sale
- `GET /api/sales` - List sales
- `GET /api/sales/:id` - Get sale details
- `GET /api/sales/:id/receipt` - Generate receipt
- `POST /api/sales/:id/refund` - Refund sale (Manager/Admin)

### Inventory
- `GET /api/inventory/overview` - Inventory statistics
- `GET /api/inventory/alerts` - Low stock alerts
- `POST /api/inventory/restock` - Restock product (Manager/Admin)
- `POST /api/inventory/adjust` - Adjust inventory (Manager/Admin)
- `GET /api/inventory/fast-moving` - Fast-moving items

### Analytics
- `GET /api/analytics/dashboard` - Dashboard overview
- `GET /api/analytics/daily-summary` - Daily sales summary
- `GET /api/analytics/sales-by-date` - Sales by date range
- `GET /api/analytics/top-products` - Top selling products
- `GET /api/analytics/export` - Export data to CSV

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update setting (Manager/Admin)
- `POST /api/settings/bulk-update` - Update multiple settings

### Sync (Offline Support)
- `POST /api/sync/queue` - Queue operation for sync
- `GET /api/sync/pending` - Get pending operations
- `PUT /api/sync/:id/synced` - Mark as synced

## 🔧 Configuration

### Tax Rate
Configure in Settings or via API:
```bash
PUT /api/settings/tax_rate
Body: { "value": "0.10" }  # 10% tax
```

### Currency
```bash
PUT /api/settings/currency
Body: { "value": "USD" }

PUT /api/settings/currency_symbol
Body: { "value": "$" }
```

### Low Stock Threshold
```bash
PUT /api/settings/low_stock_threshold
Body: { "value": "10" }  # Alert when stock <= 10
```

### Receipt Customization
```bash
PUT /api/settings/receipt_header
Body: { "value": "Your Store Name" }

PUT /api/settings/receipt_footer
Body: { "value": "Thank you for shopping!" }
```

## 📊 Database Schema

The application uses SQLite with the following main tables:

- **users**: User accounts with role-based access
- **products**: Product catalog with pricing and inventory
- **sales**: Transaction records
- **sale_items**: Line items for each sale
- **inventory_transactions**: Inventory movement history
- **settings**: System configuration
- **sync_queue**: Offline operation queue

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Token expiration (24 hours)
- Secure API endpoints
- Input validation

## 📴 Offline Mode

The app supports offline operation:

1. **Automatic Detection**: App detects network status
2. **Queue Operations**: Sales and changes are queued locally
3. **Auto-Sync**: Syncs automatically when connection restored
4. **Manual Sync**: Force sync from Settings screen
5. **Conflict Resolution**: Server validates queued operations

## 🎨 Customization

### Adding New Products
```javascript
POST /api/products
{
  "barcode": "1234567890",
  "name": "Product Name",
  "description": "Product description",
  "price": 19.99,
  "cost": 12.00,
  "category": "Electronics",
  "stock_quantity": 100,
  "min_stock_level": 10
}
```

### Creating Users
```javascript
POST /api/auth/register
{
  "username": "newuser",
  "password": "password123",
  "role": "cashier",
  "full_name": "John Doe",
  "email": "john@example.com"
}
```

## 🚀 Deployment

### Backend Deployment

1. **Set production environment**:
   ```env
   NODE_ENV=production
   JWT_SECRET=strong-random-secret
   ```

2. **Use a process manager** (PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name retail-pos
   pm2 save
   pm2 startup
   ```

3. **Setup reverse proxy** (nginx):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Mobile App Deployment

1. **Build for Android**:
   ```bash
   expo build:android
   ```

2. **Build for iOS**:
   ```bash
   expo build:ios
   ```

3. **Or use EAS Build**:
   ```bash
   npm install -g eas-cli
   eas build --platform android
   eas build --platform ios
   ```

## 🔮 Future Enhancements

The system is designed to be scalable and extensible:

- **Payment Gateway Integration**: Stripe, PayPal, Square
- **Loyalty Programs**: Customer rewards and points
- **Supplier Management**: Automated restocking APIs
- **Multi-Store Support**: Centralized management
- **Advanced Reporting**: Custom reports and dashboards
- **Email Receipts**: Automatic email delivery
- **Customer Management**: Customer database and history
- **Barcode Printing**: Generate and print product labels
- **Employee Time Tracking**: Clock in/out functionality
- **Promotions & Discounts**: Automated discount rules

## 🐛 Troubleshooting

### Backend Issues

**Database locked error**:
- Ensure only one instance of the server is running
- Check file permissions on database directory

**Port already in use**:
```bash
# Change port in .env file
PORT=3001
```

### Mobile App Issues

**Cannot connect to server**:
- Ensure backend is running
- Check API_BASE_URL in `src/services/api.js`
- Use your computer's IP address, not localhost
- Ensure devices are on same network

**Camera not working**:
- Grant camera permissions in device settings
- Restart the app after granting permissions

**Barcode scanner not detecting**:
- Ensure good lighting
- Hold camera steady
- Try manual barcode entry

## 📄 License

MIT License - feel free to use this project for commercial or personal use.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation
- Check server logs for errors
- Verify database integrity

## 🎯 Best Practices

1. **Regular Backups**: Backup the SQLite database regularly
2. **Security**: Change default passwords immediately
3. **Updates**: Keep dependencies updated
4. **Monitoring**: Monitor server logs and performance
5. **Testing**: Test offline mode and sync functionality
6. **Training**: Train staff on proper system usage

---

**Built with ❤️ for retail businesses**
