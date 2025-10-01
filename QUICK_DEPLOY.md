# 🚀 Quick Deploy to Render.com

Follow these simple steps to deploy your backend in **under 10 minutes**!

## ✅ Prerequisites Checklist

- [ ] GitHub account (create at https://github.com if you don't have one)
- [ ] Git installed on your computer
- [ ] Your code is working locally

---

## 📋 Step-by-Step Deployment

### **Step 1: Push Code to GitHub (5 minutes)**

Open PowerShell in your project folder and run:

```powershell
# Navigate to project
cd C:\Users\gh\CascadeProjects\retail-pos

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Retail POS Backend"
```

Now go to GitHub:
1. Visit https://github.com/new
2. Repository name: `retail-pos`
3. Make it **Public** (required for Render free tier)
4. **Don't** initialize with README
5. Click **"Create repository"**

Copy the commands shown and run them:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/retail-pos.git
git branch -M main
git push -u origin main
```

✅ **Your code is now on GitHub!**

---

### **Step 2: Deploy to Render (3 minutes)**

1. **Go to Render**: https://render.com
2. **Sign up** with your GitHub account
3. **Click "New +"** → **"Web Service"**
4. **Connect GitHub** → Select `retail-pos` repository
5. **Fill in the form**:

```
Name: retail-pos-api
Region: (Choose closest to you)
Branch: main
Root Directory: (leave empty)
Runtime: Node
Build Command: npm install && npm run init-db
Start Command: npm start
Instance Type: Free
```

6. **Add Environment Variables** (click "Advanced"):

```
NODE_ENV = production
JWT_SECRET = MySecretKey123!ChangeThis
PORT = 3000
DATABASE_PATH = ./database/pos.db
```

7. **Click "Create Web Service"**

⏳ **Wait 2-3 minutes** for deployment...

✅ **Done! Your backend is live!**

---

### **Step 3: Get Your API URL**

After deployment completes, you'll see:

```
Your service is live at https://retail-pos-api.onrender.com
```

**Test it**: Open this URL in your browser:
```
https://retail-pos-api.onrender.com/api/health
```

You should see:
```json
{"status":"ok","timestamp":"2025-10-01T05:47:00.000Z"}
```

✅ **Backend is working!**

---

### **Step 4: Update Mobile App (2 minutes)**

1. **Open this file**: `mobile-app/src/services/api.js`

2. **Find line 6** and change:
```javascript
// FROM:
const API_BASE_URL = 'http://localhost:3000/api';

// TO (use YOUR URL):
const API_BASE_URL = 'https://retail-pos-api.onrender.com/api';
```

3. **Save the file**

4. **Restart Expo**:
```powershell
cd mobile-app
npm start
```

5. **Reload app** on your phone

✅ **Your app now works without your laptop!**

---

## 🎉 Success Checklist

Test these to confirm everything works:

- [ ] Backend health check: `https://your-app.onrender.com/api/health`
- [ ] Login to mobile app (username: `cashier1`, password: `cashier123`)
- [ ] Scan a product or use manual entry
- [ ] Add items to cart
- [ ] Complete a sale
- [ ] View analytics (login as `manager1` / `manager123`)

---

## ⚠️ Important Notes

### **Free Tier Behavior:**

Your app will **"sleep"** after 15 minutes of no activity:
- ✅ First request wakes it up (takes 30-60 seconds)
- ✅ Subsequent requests are fast
- ✅ Perfect for testing/development
- 💡 For production, upgrade to paid tier ($7/month)

### **Keep It Awake (Optional):**

To prevent sleeping:
1. Go to https://cron-job.org
2. Create free account
3. Add new cron job:
   - URL: `https://your-app.onrender.com/api/health`
   - Every 10 minutes
4. This pings your app to keep it awake

---

## 🔧 Troubleshooting

### **"Build Failed" Error:**

1. Check Render logs (Dashboard → Logs)
2. Common issues:
   - Missing `better-sqlite3` in package.json ✅ (already fixed)
   - Database initialization failed → Check logs

### **Mobile App Can't Connect:**

1. ✅ Verify backend is running: Visit health check URL
2. ✅ Check API_BASE_URL in `mobile-app/src/services/api.js`
3. ✅ Make sure you're using `https://` (not `http://`)
4. ✅ Restart Expo after changing API URL

### **Login Not Working:**

1. Database might not be initialized
2. Go to Render Dashboard → Shell
3. Run: `npm run init-db`
4. Try logging in again

---

## 📱 Using the App

Now you can:
- ✅ Close your laptop
- ✅ Turn off PowerShell
- ✅ Use the app anywhere with internet
- ✅ Share with others (they just scan the QR code)

**Default Login Credentials:**
- Cashier: `cashier1` / `cashier123`
- Manager: `manager1` / `manager123`
- Admin: `admin` / `admin123`

---

## 🚀 Next Steps

### **For Testing:**
- Use the free tier
- Test all features
- Share with team members

### **For Production:**
- Upgrade to paid tier ($7/month) for:
  - No sleep time
  - Persistent disk storage
  - Better performance
- Change all default passwords
- Set up automated backups
- Consider PostgreSQL instead of SQLite

---

## 💡 Pro Tips

1. **Bookmark your API URL** for easy access
2. **Save your Render dashboard** link
3. **Monitor logs** in Render dashboard
4. **Set up alerts** for downtime (use UptimeRobot)
5. **Keep your GitHub repo** updated

---

## 📞 Need Help?

If something doesn't work:

1. **Check Render Logs**: Dashboard → Your Service → Logs
2. **Test API**: Visit `https://your-app.onrender.com/api/health`
3. **Check Mobile App**: Look for errors in Expo console
4. **Verify Environment Variables**: Dashboard → Environment

---

## 🎯 Summary

You've successfully:
- ✅ Deployed backend to cloud
- ✅ Got a public API URL
- ✅ Updated mobile app
- ✅ App works independently

**Total time: ~10 minutes**  
**Cost: FREE**  
**Result: Production-ready POS system! 🎉**

---

**Questions? Check the full DEPLOYMENT_GUIDE.md for detailed troubleshooting!**
