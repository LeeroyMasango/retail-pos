# Deployment Guide - Deploy Backend to Cloud

This guide will help you deploy the Retail POS backend to a cloud server so your mobile app works independently.

## 🌐 Deployment Options

We'll cover three popular options:

1. **Render.com** (Recommended - Free tier, easy setup)
2. **Railway.app** (Alternative - Free tier)
3. **Heroku** (Alternative - Paid)

---

## Option 1: Deploy to Render.com (Recommended)

### **Why Render?**
- ✅ Free tier available
- ✅ Easy setup (no credit card required for free tier)
- ✅ Automatic HTTPS
- ✅ Auto-deploys from Git
- ✅ Persistent disk storage for SQLite

### **Step-by-Step Instructions:**

#### **1. Create a GitHub Repository**

First, push your code to GitHub:

```bash
# Navigate to your project
cd C:\Users\gh\CascadeProjects\retail-pos

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Retail POS Backend"

# Create a new repository on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/retail-pos.git
git branch -M main
git push -u origin main
```

#### **2. Sign Up for Render**

1. Go to https://render.com
2. Click **"Get Started"**
3. Sign up with GitHub (recommended) or email
4. Verify your email

#### **3. Create a New Web Service**

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the `retail-pos` repository
4. Configure the service:

   **Basic Settings:**
   - **Name**: `retail-pos-api` (or any name you prefer)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run init-db`
   - **Start Command**: `npm start`

   **Advanced Settings:**
   - **Instance Type**: `Free`
   - **Environment Variables**: Click "Add Environment Variable"
     - `NODE_ENV` = `production`
     - `JWT_SECRET` = `your-super-secret-random-string-change-this`
     - `PORT` = `3000`
     - `DATABASE_PATH` = `./database/pos.db`

5. Click **"Create Web Service"**

#### **4. Wait for Deployment**

- Render will build and deploy your app (takes 2-5 minutes)
- Watch the logs for any errors
- Once deployed, you'll see: **"Your service is live 🎉"**

#### **5. Get Your API URL**

Your backend will be available at:
```
https://retail-pos-api.onrender.com
```

(Replace `retail-pos-api` with your chosen name)

#### **6. Test Your Deployment**

Open in browser:
```
https://retail-pos-api.onrender.com/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-10-01T05:47:00.000Z"
}
```

---

## Option 2: Deploy to Railway.app

### **Step-by-Step:**

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your `retail-pos` repository
5. Railway auto-detects Node.js and deploys
6. Add environment variables:
   - Settings → Variables
   - Add: `NODE_ENV`, `JWT_SECRET`, `DATABASE_PATH`
7. Get your URL from Settings → Domains

---

## Option 3: Deploy to Heroku

### **Step-by-Step:**

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login:
   ```bash
   heroku login
   ```
3. Create app:
   ```bash
   cd C:\Users\gh\CascadeProjects\retail-pos
   heroku create retail-pos-api
   ```
4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   ```
5. Deploy:
   ```bash
   git push heroku main
   ```
6. Initialize database:
   ```bash
   heroku run npm run init-db
   ```

---

## 📱 Update Mobile App to Use Cloud Backend

Once your backend is deployed, update the mobile app:

### **1. Update API URL**

Edit `mobile-app/src/services/api.js`:

```javascript
// Change from:
const API_BASE_URL = 'http://192.168.1.100:3000/api';

// To your deployed URL:
const API_BASE_URL = 'https://retail-pos-api.onrender.com/api';
```

### **2. Test the Connection**

1. Save the file
2. Restart Expo: `npm start`
3. Reload app on your phone
4. Try logging in

**Now your app works without your laptop! 🎉**

---

## ⚠️ Important Notes

### **Free Tier Limitations:**

**Render.com:**
- ✅ Free tier available
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ First request after sleep takes 30-60 seconds
- ✅ Good for testing/development

**Railway.app:**
- ✅ $5 free credit per month
- ✅ No sleep time
- ⚠️ Credit expires monthly

**Heroku:**
- ❌ No free tier (starts at $7/month)
- ✅ No sleep time
- ✅ Very reliable

### **Database Persistence:**

For production use, consider:
- Using PostgreSQL instead of SQLite
- Setting up automated backups
- Using Render's persistent disk (paid feature)

---

## 🔧 Troubleshooting

### **Build Failed:**

Check logs for errors:
- Missing dependencies? Run `npm install` locally first
- Database initialization failed? Check `scripts/initDatabase.js`

### **App Can't Connect:**

1. Verify backend is running: Visit `https://your-app.onrender.com/api/health`
2. Check API_BASE_URL in mobile app
3. Ensure HTTPS (not HTTP)
4. Check CORS settings in `server.js`

### **Database Not Persisting:**

On Render free tier:
- Database resets on each deploy
- Upgrade to paid tier for persistent disk
- Or migrate to PostgreSQL

---

## 🚀 Next Steps After Deployment

1. **Test all features** in the mobile app
2. **Change default passwords** for security
3. **Set up monitoring** (Render provides basic monitoring)
4. **Configure custom domain** (optional)
5. **Set up automated backups**
6. **Consider upgrading** to paid tier for production use

---

## 💡 Pro Tips

### **Keep Backend Awake (Free Tier):**

Create a simple cron job to ping your API every 10 minutes:
- Use cron-job.org
- Ping: `https://your-app.onrender.com/api/health`
- Prevents cold starts

### **Monitor Your App:**

- Use Render's built-in logs
- Set up UptimeRobot for monitoring
- Check error logs regularly

### **Security:**

- Change JWT_SECRET to a strong random string
- Use environment variables for all secrets
- Enable HTTPS only (Render does this automatically)
- Regularly update dependencies

---

## 📞 Need Help?

If you encounter issues:
1. Check Render logs (Dashboard → Logs)
2. Test API endpoints with Postman
3. Verify environment variables are set
4. Check mobile app console for errors

---

**Congratulations! Your POS system is now cloud-deployed! 🎉**
