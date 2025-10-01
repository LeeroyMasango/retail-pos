# Building Standalone Retail POS App

## ✅ New Features Added

### 1. Add Product Screen
- **Barcode scanning** for new products
- **Manual barcode entry**
- Complete product form with all fields
- Accessible from Inventory screen via FAB button

### 2. Inventory Management
- **"Add Product" button** in Inventory screen (bottom right)
- Scan barcodes when adding products
- All fields: barcode, name, description, price, cost, category, stock, min level

---

## 📱 Building Standalone App for iPhone

### Prerequisites
1. **Apple Developer Account** (required for iOS)
   - Free account: Can install on your own device
   - Paid account ($99/year): Can distribute to others

2. **EAS CLI** (already installed)

### Step 1: Login to Expo
```powershell
cd C:\Users\gh\CascadeProjects\retail-pos\mobile-app
eas login
```
Create a free Expo account if you don't have one.

### Step 2: Configure the Project
```powershell
eas build:configure
```
This creates/updates the `eas.json` file (already done).

### Step 3: Build for iOS

#### Option A: Development Build (Install on your device via cable)
```powershell
eas build --profile development --platform ios
```

#### Option B: Preview Build (Install via link - no cable needed)
```powershell
eas build --profile preview --platform ios
```

#### Option C: Production Build (For App Store)
```powershell
eas build --profile production --platform ios
```

### Step 4: Install on Your iPhone

After the build completes (15-30 minutes):

1. **You'll get a download link** in the terminal
2. **Open the link on your iPhone**
3. **Download and install** the `.ipa` file
4. **Trust the developer certificate**:
   - Settings → General → VPN & Device Management
   - Tap your Apple ID
   - Tap "Trust"

---

## 🚀 Quick Start (Recommended)

For the easiest installation on your iPhone:

```powershell
cd C:\Users\gh\CascadeProjects\retail-pos\mobile-app
eas login
eas build --profile preview --platform ios
```

Then:
1. Wait for build to complete (~20 mins)
2. Open the link on your iPhone
3. Install the app
4. Trust the certificate in Settings

---

## 📝 Important Notes

### Backend Server
The app still needs to connect to your backend server:
- **Current setup**: Uses `http://192.168.1.167:3000/api`
- **For production**: You'll need to:
  1. Deploy backend to a cloud server (Heroku, AWS, DigitalOcean, etc.)
  2. Update `mobile-app/src/services/api.js` with the production URL
  3. Rebuild the app

### Alternative: TestFlight (Recommended for Multiple Devices)
1. Build with production profile
2. Submit to App Store Connect
3. Add testers via TestFlight
4. They can install via TestFlight app (no cable needed)

---

## 🔧 Troubleshooting

### Build Fails
- Make sure you're logged in: `eas whoami`
- Check your Apple ID is configured: `eas credentials`

### Can't Install on iPhone
- Make sure you're using the same Apple ID
- Trust the certificate in Settings
- For free account: Max 3 devices, expires after 7 days

### App Won't Connect to Backend
- Backend must be accessible from your phone's network
- Consider deploying backend to cloud for production use

---

## 📦 What's Included in the App

✅ **Barcode Scanning** - Scan products for checkout
✅ **Cart Management** - Add, remove, adjust quantities
✅ **Checkout** - Process sales with multiple payment methods
✅ **Inventory Management** - View stock levels, restock products
✅ **Add Products** - Add new products with barcode scanning
✅ **Analytics Dashboard** - Sales reports and insights (Manager/Admin)
✅ **Offline Mode** - Queue operations when offline
✅ **Settings** - Configure app preferences

---

## 🎯 Next Steps

1. **Build the app** using EAS
2. **Deploy backend** to a cloud server for production
3. **Update API URL** in the app
4. **Rebuild** with production URL
5. **Distribute** via TestFlight or direct install

**Need help? Check the Expo documentation: https://docs.expo.dev/build/setup/**
