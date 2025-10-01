# 🚀 Cloud Deployment Summary

## What You Need to Do

### **Step 1: Push to GitHub** (First Time Only)

```powershell
cd C:\Users\gh\CascadeProjects\retail-pos
git init
git add .
git commit -m "Initial commit"
```

Then create repository on GitHub.com and:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/retail-pos.git
git push -u origin main
```

---

### **Step 2: Deploy to Render**

1. Go to https://render.com
2. Sign up with GitHub
3. New + → Web Service
4. Connect your `retail-pos` repository
5. Fill in:
   - **Build Command**: `npm install && npm run init-db`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV` = `production`
     - `JWT_SECRET` = `YourSecretKey123!`
     - `PORT` = `3000`

6. Click "Create Web Service"
7. Wait 2-3 minutes

---

### **Step 3: Update Mobile App**

Edit `mobile-app/src/services/api.js` line 6:

```javascript
const API_BASE_URL = 'https://YOUR-APP-NAME.onrender.com/api';
```

Save and restart Expo:
```powershell
cd mobile-app
npm start
```

---

## ✅ That's It!

Your app now works **without your laptop**!

- ✅ Close PowerShell
- ✅ Turn off laptop
- ✅ Use app anywhere
- ✅ Share with team

---

## 📱 Test It

1. Open app on phone
2. Login: `cashier1` / `cashier123`
3. Scan products
4. Complete a sale

**It works! 🎉**

---

## 📚 More Details

- **Quick Guide**: `QUICK_DEPLOY.md`
- **Full Guide**: `DEPLOYMENT_GUIDE.md`
- **After Deploy**: `AFTER_DEPLOYMENT.md`

---

## 💡 Free Tier Note

Render free tier sleeps after 15 min:
- First request takes 30-60 sec to wake up
- Then it's fast
- Upgrade to $7/month for always-on

---

**Questions? Check QUICK_DEPLOY.md for step-by-step instructions!**
