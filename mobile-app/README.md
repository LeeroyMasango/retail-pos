# Retail POS Mobile App

React Native mobile application for the Retail POS system, built with Expo.

## Features

- 📷 **Barcode Scanning** - Use device camera to scan product barcodes
- 🛒 **Shopping Cart** - Add items, adjust quantities, apply discounts
- 💳 **Checkout** - Multiple payment methods, receipt generation
- 📦 **Inventory Management** - View stock, restock products, alerts
- 📊 **Analytics Dashboard** - Sales trends, top products, revenue reports
- ⚙️ **Settings** - Configure tax rates, currency, receipt format
- 📴 **Offline Mode** - Queue operations when offline, auto-sync when online
- 🔐 **Role-Based Access** - Different features for cashiers, managers, admins

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build toolchain
- **React Navigation** - Navigation library
- **React Native Paper** - Material Design components
- **Expo Barcode Scanner** - Barcode scanning
- **React Native Chart Kit** - Data visualization
- **Axios** - HTTP client
- **AsyncStorage** - Local data persistence

## Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device
- Backend server running

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure API endpoint**:
   
   Edit `src/services/api.js`:
   ```javascript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000/api';
   ```
   
   Replace `YOUR_IP_ADDRESS` with your computer's local IP address.

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on device**:
   - Scan QR code with Expo Go (Android) or Camera (iOS)
   - Ensure device is on same WiFi network as backend server

## Project Structure

```
mobile-app/
├── App.js                      # Main app component
├── app.json                    # Expo configuration
├── package.json               # Dependencies
└── src/
    ├── screens/               # App screens
    │   ├── LoginScreen.js     # User authentication
    │   ├── ScanScreen.js      # Barcode scanning
    │   ├── CartScreen.js      # Shopping cart
    │   ├── CheckoutScreen.js  # Checkout process
    │   ├── InventoryScreen.js # Inventory management
    │   ├── AnalyticsScreen.js # Analytics dashboard
    │   ├── SettingsScreen.js  # App settings
    │   ├── ProductDetailsScreen.js
    │   └── ReceiptScreen.js   # Receipt display
    ├── context/               # React contexts
    │   ├── AuthContext.js     # Authentication state
    │   ├── CartContext.js     # Shopping cart state
    │   └── OfflineContext.js  # Offline sync state
    └── services/
        └── api.js             # API service layer
```

## Screens

### Login Screen
- User authentication
- Role-based access control
- Secure token storage

### Scan Screen
- Camera barcode scanning
- Manual barcode entry
- Product lookup
- Add to cart

### Cart Screen
- View cart items
- Adjust quantities
- Apply discounts
- Calculate totals with tax
- Proceed to checkout

### Checkout Screen
- Order summary
- Payment method selection
- Add transaction notes
- Complete sale
- Generate receipt

### Inventory Screen (Manager/Admin)
- View all products
- Search and filter
- Low stock alerts
- Restock products
- Adjust inventory

### Analytics Screen (Manager/Admin)
- Dashboard overview
- Sales trends chart
- Category breakdown
- Top products
- Revenue metrics

### Settings Screen
- User information
- Network status
- Offline sync status
- System settings (Manager/Admin)
- Logout

## Context Providers

### AuthContext
Manages user authentication state:
```javascript
const { user, token, isAuthenticated, login, logout } = useAuth();
```

### CartContext
Manages shopping cart state:
```javascript
const {
  cartItems,
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  getSubtotal,
  getTotal,
  getTax
} = useCart();
```

### OfflineContext
Manages offline operations:
```javascript
const {
  isOnline,
  pendingOperations,
  queueOperation,
  syncPendingOperations
} = useOffline();
```

## API Service

The `api.js` service provides methods for all backend endpoints:

```javascript
import api from '../services/api';

// Products
const products = await api.getProducts();
const product = await api.getProductByBarcode(barcode);

// Sales
const sale = await api.createSale(saleData);
const receipt = await api.generateReceipt(saleId);

// Inventory
const alerts = await api.getInventoryAlerts();
await api.restockProduct(productId, quantity);

// Analytics
const dashboard = await api.getDashboard();
const topProducts = await api.getTopProducts();

// Settings
const settings = await api.getSettings();
await api.updateSetting(key, value);
```

## Offline Mode

The app supports offline operation:

1. **Network Detection**: Automatically detects online/offline status
2. **Operation Queuing**: Queues sales and changes when offline
3. **Auto-Sync**: Syncs automatically when connection restored
4. **Manual Sync**: Force sync from Settings screen
5. **Visual Indicators**: Shows offline banner and sync status

### How It Works

```javascript
// Queue operation when offline
await queueOperation('create', 'sale', null, saleData);

// Sync when back online
const result = await syncPendingOperations();
// Returns: { synced: 5, failed: 0 }
```

## Permissions

The app requires the following permissions:

- **Camera**: For barcode scanning
- **Internet**: For API communication
- **Network State**: For offline detection

Permissions are requested at runtime when needed.

## Building for Production

### Android

1. **Configure app.json**:
   ```json
   {
     "android": {
       "package": "com.yourcompany.retailpos",
       "versionCode": 1
     }
   }
   ```

2. **Build APK**:
   ```bash
   expo build:android
   ```

3. **Or use EAS Build**:
   ```bash
   eas build --platform android
   ```

### iOS

1. **Configure app.json**:
   ```json
   {
     "ios": {
       "bundleIdentifier": "com.yourcompany.retailpos",
       "buildNumber": "1.0.0"
     }
   }
   ```

2. **Build IPA**:
   ```bash
   expo build:ios
   ```

3. **Or use EAS Build**:
   ```bash
   eas build --platform ios
   ```

## Customization

### Theming

Edit colors in component styles or use React Native Paper theming:

```javascript
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac6',
  },
};

<PaperProvider theme={theme}>
  <App />
</PaperProvider>
```

### Adding Features

1. Create new screen in `src/screens/`
2. Add route in `App.js`
3. Create API methods in `src/services/api.js`
4. Add navigation in relevant screens

## Troubleshooting

### Cannot connect to backend
- Verify backend is running
- Check API_BASE_URL uses correct IP
- Ensure devices on same WiFi
- Check firewall settings

### Camera not working
- Grant camera permissions
- Restart app after granting
- Use manual entry as fallback

### Barcode not scanning
- Ensure good lighting
- Hold steady
- Try different angle
- Use manual entry

### App crashes on startup
- Clear Expo cache: `expo start -c`
- Reinstall dependencies
- Check for syntax errors

### Offline sync not working
- Check network detection
- View pending operations in Settings
- Try manual sync
- Check backend logs

## Development Tips

### Debugging

1. **Enable Remote Debugging**:
   - Shake device
   - Tap "Debug Remote JS"
   - Open browser console

2. **View Logs**:
   ```bash
   expo start
   # Press 'j' to open debugger
   ```

3. **React DevTools**:
   ```bash
   npm install -g react-devtools
   react-devtools
   ```

### Hot Reload

Expo supports hot reloading. Changes to code will automatically refresh the app.

### Testing on Multiple Devices

Run on multiple devices simultaneously by scanning the same QR code.

## Performance Optimization

- Images are lazy-loaded
- Lists use FlatList for virtualization
- API calls are debounced
- Offline data is cached locally
- Charts render efficiently

## Security

- JWT tokens stored securely in AsyncStorage
- Passwords never stored locally
- HTTPS recommended for production
- Token expiration handled automatically
- Role-based access enforced

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check troubleshooting section
- Review API documentation
- Check backend logs
- Verify network connectivity

---

**Happy Coding! 🚀**
