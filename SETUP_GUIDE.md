# Retail POS - Complete Setup Guide

This guide will walk you through setting up the Retail POS system from scratch.

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Backend Setup](#backend-setup)
3. [Mobile App Setup](#mobile-app-setup)
4. [Network Configuration](#network-configuration)
5. [Testing the System](#testing-the-system)
6. [Common Issues](#common-issues)

## System Requirements

### Development Machine
- **Operating System**: Windows 10/11, macOS, or Linux
- **Node.js**: Version 16.x or higher
- **npm**: Version 7.x or higher (comes with Node.js)
- **Git**: For version control (optional)
- **Code Editor**: VS Code recommended

### Mobile Device
- **Android**: Version 8.0 (Oreo) or higher
- **iOS**: Version 13.0 or higher
- **Expo Go App**: Install from Play Store or App Store

### Network
- Both development machine and mobile device must be on the same WiFi network
- Firewall should allow connections on port 3000

## Backend Setup

### Step 1: Install Node.js

1. Download Node.js from https://nodejs.org/
2. Install the LTS (Long Term Support) version
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Set Up Backend

1. **Open Terminal/Command Prompt** and navigate to the project:
   ```bash
   cd C:\Users\gh\CascadeProjects\retail-pos
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```
   
   This will install:
   - express (web framework)
   - better-sqlite3 (database)
   - bcryptjs (password hashing)
   - jsonwebtoken (authentication)
   - pdfkit (receipt generation)
   - And other dependencies

3. **Create Environment File**:
   ```bash
   # Windows
   copy .env.example .env
   
   # macOS/Linux
   cp .env.example .env
   ```

4. **Edit `.env` file**:
   Open `.env` in a text editor and update:
   ```env
   PORT=3000
   JWT_SECRET=your-super-secret-key-change-this-now
   NODE_ENV=development
   DATABASE_PATH=./database/pos.db
   ```
   
   **Important**: Change `JWT_SECRET` to a random string for security!

5. **Initialize Database**:
   ```bash
   npm run init-db
   ```
   
   You should see:
   ```
   ✓ Users created
   ✓ Sample products created
   ✓ Database initialized successfully!
   ```

6. **Start the Server**:
   ```bash
   npm start
   ```
   
   You should see:
   ```
   POS Server running on port 3000
   Environment: development
   ```

### Step 3: Test Backend

Open a browser and visit:
- http://localhost:3000/api/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-09-30T17:55:20.000Z"
}
```

## Mobile App Setup

### Step 1: Install Expo CLI

```bash
npm install -g expo-cli
```

### Step 2: Install Expo Go on Mobile Device

- **Android**: https://play.google.com/store/apps/details?id=host.exp.exponent
- **iOS**: https://apps.apple.com/app/expo-go/id982107779

### Step 3: Set Up Mobile App

1. **Open a NEW Terminal** (keep backend running in the first one)

2. **Navigate to mobile app directory**:
   ```bash
   cd C:\Users\gh\CascadeProjects\retail-pos\mobile-app
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```
   
   This may take 5-10 minutes.

### Step 4: Configure API Connection

1. **Find Your Computer's IP Address**:

   **Windows**:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" under your WiFi adapter (e.g., 192.168.1.100)

   **macOS/Linux**:
   ```bash
   ifconfig
   ```
   Look for "inet" under your WiFi interface (e.g., 192.168.1.100)

2. **Update API URL**:
   
   Open `mobile-app/src/services/api.js` and change line 6:
   ```javascript
   // Change this:
   const API_BASE_URL = 'http://localhost:3000/api';
   
   // To this (use YOUR IP address):
   const API_BASE_URL = 'http://192.168.1.100:3000/api';
   ```

### Step 5: Start Mobile App

```bash
npm start
```

You'll see a QR code in the terminal and a browser window will open.

### Step 6: Run on Device

1. **Ensure your mobile device is on the same WiFi network**
2. **Open Expo Go app** on your device
3. **Scan the QR code**:
   - **Android**: Use Expo Go app to scan
   - **iOS**: Use Camera app to scan

The app will download and launch on your device.

## Network Configuration

### Windows Firewall

If you can't connect from mobile device:

1. Open **Windows Defender Firewall**
2. Click **Advanced settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → Next
5. Select **TCP** and enter port **3000** → Next
6. Select **Allow the connection** → Next
7. Check all profiles → Next
8. Name it "Retail POS" → Finish

### Router Configuration

Ensure your router allows local network communication:
- Disable "AP Isolation" or "Client Isolation"
- Both devices should be on the same subnet

## Testing the System

### Test 1: Login

1. Open the app on your mobile device
2. Login with:
   - Username: `cashier1`
   - Password: `cashier123`
3. You should see the main app interface

### Test 2: Scan Products

1. Tap **"Start Scanning"**
2. Grant camera permissions
3. Try manual entry instead:
   - Tap **"Manual Entry"**
   - Enter barcode: `8901234567890`
   - Tap **"Lookup"**
4. Product should be added to cart

### Test 3: Complete a Sale

1. Go to **Cart** tab
2. Review items
3. Tap **"Proceed to Checkout"**
4. Select payment method
5. Tap **"Complete Sale"**
6. View receipt

### Test 4: View Analytics (Manager/Admin)

1. Logout and login as:
   - Username: `manager1`
   - Password: `manager123`
2. Go to **Analytics** tab
3. View dashboard with sales data

### Test 5: Manage Inventory (Manager/Admin)

1. Go to **Inventory** tab
2. View product list
3. Tap **"Restock"** on any product
4. Enter quantity and confirm

## Common Issues

### Issue: "Cannot connect to server"

**Solution**:
1. Verify backend is running (check terminal)
2. Check API_BASE_URL uses correct IP address
3. Ensure both devices on same WiFi
4. Check firewall settings
5. Try accessing http://YOUR_IP:3000/api/health in mobile browser

### Issue: "Network request failed"

**Solution**:
1. Backend might not be running - restart it
2. IP address might have changed - check and update
3. Port 3000 might be blocked - check firewall

### Issue: "Camera not working"

**Solution**:
1. Grant camera permissions in device settings
2. Restart the app
3. Use manual barcode entry as alternative

### Issue: "Database locked"

**Solution**:
1. Stop all running instances of the server
2. Delete `database/pos.db-wal` and `database/pos.db-shm` files
3. Restart the server

### Issue: "Module not found"

**Solution**:
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again

### Issue: Expo app won't load

**Solution**:
1. Ensure Expo Go is updated
2. Clear Expo cache: `expo start -c`
3. Restart the Expo server
4. Check device is on same network

## Development Tips

### Running Backend in Development Mode

Use nodemon for auto-restart on file changes:
```bash
npm run dev
```

### Viewing Backend Logs

All console.log statements will appear in the terminal where you started the server.

### Debugging Mobile App

1. Shake device to open developer menu
2. Enable "Debug Remote JS"
3. Open browser console for logs

### Resetting Database

To start fresh:
```bash
# Stop the server
# Delete the database
rm database/pos.db  # macOS/Linux
del database\pos.db  # Windows

# Reinitialize
npm run init-db
```

### Adding Sample Products

Products are created during `npm run init-db`. To add more:

1. Use the API:
   ```bash
   curl -X POST http://localhost:3000/api/products \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "barcode": "1234567890",
       "name": "New Product",
       "price": 9.99,
       "stock_quantity": 50
     }'
   ```

2. Or edit `scripts/initDatabase.js` and add to `sampleProducts` array

## Next Steps

Once everything is working:

1. **Customize Settings**: Update tax rate, currency, receipt header/footer
2. **Add Real Products**: Replace sample products with your inventory
3. **Create Users**: Add cashier and manager accounts
4. **Test Offline Mode**: Turn off WiFi and test queuing
5. **Backup Database**: Copy `database/pos.db` regularly
6. **Review Security**: Change default passwords and JWT secret

## Getting Help

If you encounter issues:

1. Check this guide's Common Issues section
2. Review backend terminal for error messages
3. Check mobile app console for errors
4. Verify all prerequisites are installed
5. Ensure network connectivity

## Production Deployment

For production use:

1. Use a production database (PostgreSQL/MySQL)
2. Set up HTTPS with SSL certificates
3. Use environment variables for secrets
4. Set up proper backup procedures
5. Use a process manager (PM2)
6. Configure proper logging
7. Set up monitoring and alerts

---

**You're all set! Start building your retail business with Retail POS! 🚀**
