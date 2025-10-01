# ✅ After Deployment Checklist

Congratulations on deploying your backend! Here's what to do next.

---

## 🎯 Immediate Steps (Do This Now)

### **1. Update Mobile App API URL**

**File to edit:** `mobile-app/src/services/api.js`

**Line 6 - Change from:**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**To your deployed URL:**
```javascript
const API_BASE_URL = 'https://retail-pos-api.onrender.com/api';
```

Replace `retail-pos-api.onrender.com` with YOUR actual Render URL.

---

### **2. Test Backend is Working**

Open in browser:
```
https://YOUR-APP-NAME.onrender.com/api/health
```

✅ **Should see:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-01T05:47:00.000Z"
}
```

❌ **If you see error:**
- Check Render dashboard logs
- Verify deployment completed
- Wait 1-2 minutes and try again

---

### **3. Restart Mobile App**

```powershell
cd C:\Users\gh\CascadeProjects\retail-pos\mobile-app
npm start
```

Press `r` to reload or scan QR code again.

---

### **4. Test Login**

Open app and login with:
- Username: `cashier1`
- Password: `cashier123`

✅ **If login works:** You're all set!  
❌ **If login fails:** See troubleshooting below

---

## 🔒 Security Steps (Important!)

### **1. Change Default Passwords**

**Using the API or create an admin panel to:**

```bash
# Example: Update password via API
curl -X PUT https://your-app.onrender.com/api/auth/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "NewSecurePassword123!"}'
```

**Or manually in database:**
1. Go to Render Dashboard → Shell
2. Access database and update passwords

### **2. Update JWT Secret**

In Render Dashboard:
1. Go to Environment Variables
2. Change `JWT_SECRET` to a strong random string:
   ```
   JWT_SECRET = aB3$xY9#mK2@pL5!qR8^wT1&vN4*zC7
   ```
3. Save and redeploy

### **3. Review Environment Variables**

Ensure these are set:
- ✅ `NODE_ENV` = `production`
- ✅ `JWT_SECRET` = (strong random string)
- ✅ `PORT` = `3000`
- ✅ `DATABASE_PATH` = `./database/pos.db`

---

## 📱 Share with Your Team

Now that it's deployed, others can use it:

### **For Team Members:**

1. **Install Expo Go** on their phones
2. **Share the QR code** from your Expo terminal
3. **They scan and use** the app
4. **Create accounts** for each team member

### **Create New Users:**

Use the API to create accounts:

```bash
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_cashier",
    "password": "SecurePass123!",
    "role": "cashier",
    "full_name": "John Doe",
    "email": "john@yourstore.com"
  }'
```

---

## 🎨 Customize Your Store

### **1. Update Store Name**

In Render Dashboard → Environment or via API:

```bash
# Update receipt header
curl -X PUT https://your-app.onrender.com/api/settings/receipt_header \
  -H "Authorization: Bearer TOKEN" \
  -d '{"value": "Your Store Name"}'
```

### **2. Set Tax Rate**

```bash
# Set 15% tax
curl -X PUT https://your-app.onrender.com/api/settings/tax_rate \
  -H "Authorization: Bearer TOKEN" \
  -d '{"value": "0.15"}'
```

### **3. Change Currency**

```bash
# Set to EUR
curl -X PUT https://your-app.onrender.com/api/settings/currency \
  -H "Authorization: Bearer TOKEN" \
  -d '{"value": "EUR"}'

curl -X PUT https://your-app.onrender.com/api/settings/currency_symbol \
  -H "Authorization: Bearer TOKEN" \
  -d '{"value": "€"}'
```

---

## 📦 Add Your Products

### **Option 1: Via API**

```bash
curl -X POST https://your-app.onrender.com/api/products \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "1234567890123",
    "name": "Your Product",
    "description": "Product description",
    "price": 19.99,
    "cost": 12.00,
    "category": "Electronics",
    "stock_quantity": 100,
    "min_stock_level": 10
  }'
```

### **Option 2: Bulk Import**

Create a CSV file and use a script to import multiple products.

### **Option 3: Mobile App**

Build an admin screen in the mobile app to add products (future enhancement).

---

## 🔧 Monitoring & Maintenance

### **1. Set Up Uptime Monitoring**

**Free option - UptimeRobot:**
1. Go to https://uptimerobot.com
2. Create free account
3. Add monitor:
   - URL: `https://your-app.onrender.com/api/health`
   - Check every 5 minutes
4. Get alerts if app goes down

### **2. Keep App Awake (Free Tier)**

**Free option - Cron-Job.org:**
1. Go to https://cron-job.org
2. Create free account
3. Add cron job:
   - URL: `https://your-app.onrender.com/api/health`
   - Every 10 minutes
4. Prevents cold starts

### **3. Monitor Logs**

Check Render Dashboard → Logs regularly for:
- Errors
- Failed logins
- API issues
- Database problems

### **4. Backup Database**

**Important for production!**

Download database regularly:
1. Render Dashboard → Shell
2. Run: `cat database/pos.db > backup.db`
3. Download backup file

Or upgrade to Render's persistent disk with automatic backups.

---

## 📊 Test All Features

Go through this checklist:

- [ ] Login with all user roles (admin, manager, cashier)
- [ ] Scan a product (or manual entry)
- [ ] Add items to cart
- [ ] Apply discount
- [ ] Complete a sale
- [ ] View receipt
- [ ] Check inventory (manager/admin)
- [ ] View analytics (manager/admin)
- [ ] Restock a product (manager/admin)
- [ ] Change settings (manager/admin)
- [ ] Test offline mode (turn off WiFi, make sale, turn on, sync)
- [ ] Export data (CSV)

---

## 🚀 Upgrade to Paid Tier (Recommended for Production)

### **Why Upgrade?**

**Free Tier:**
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ 30-60 sec cold start
- ⚠️ No persistent disk
- ⚠️ Limited resources

**Paid Tier ($7/month):**
- ✅ Always on (no sleep)
- ✅ Instant response
- ✅ Persistent disk storage
- ✅ Better performance
- ✅ More resources

### **How to Upgrade:**

1. Render Dashboard → Your Service
2. Click "Upgrade"
3. Select "Starter" plan ($7/month)
4. Add payment method
5. Confirm upgrade

---

## 📈 Next Steps for Growth

### **Short Term (This Week):**
- [ ] Change all default passwords
- [ ] Add your real products
- [ ] Customize store settings
- [ ] Train your team
- [ ] Test thoroughly

### **Medium Term (This Month):**
- [ ] Upgrade to paid tier
- [ ] Set up monitoring
- [ ] Configure automated backups
- [ ] Add more users
- [ ] Collect feedback

### **Long Term (Future):**
- [ ] Migrate to PostgreSQL (more robust)
- [ ] Add payment gateway integration
- [ ] Build loyalty program
- [ ] Add customer management
- [ ] Integrate with accounting software
- [ ] Build web dashboard
- [ ] Add reporting features
- [ ] Multi-store support

---

## 🐛 Troubleshooting

### **Mobile App Can't Connect**

1. ✅ Check API URL in `api.js` is correct
2. ✅ Verify backend is running (visit health endpoint)
3. ✅ Check you're using `https://` not `http://`
4. ✅ Restart Expo after changing API URL
5. ✅ Clear app cache and reload

### **Backend Sleeping (Free Tier)**

**Symptoms:**
- First request takes 30-60 seconds
- Subsequent requests are fast

**Solutions:**
- Set up cron job to keep awake (see above)
- Upgrade to paid tier
- Accept the cold start (fine for testing)

### **Database Reset After Deploy**

**On Render free tier:**
- Database resets on each deploy
- Solution: Upgrade to paid tier with persistent disk
- Or: Migrate to PostgreSQL

### **Login Not Working**

1. Check database was initialized: `npm run init-db`
2. Verify JWT_SECRET is set
3. Check backend logs for errors
4. Test with Postman/curl first

---

## 📞 Getting Help

### **Check These First:**
1. Render Dashboard → Logs
2. Mobile app console (shake device → Debug)
3. Browser console (for API testing)
4. Network tab (check API calls)

### **Common Issues:**
- API URL wrong → Update `api.js`
- Backend sleeping → Set up cron job
- Database empty → Run `npm run init-db`
- JWT errors → Check JWT_SECRET

---

## 🎉 You're All Set!

Your POS system is now:
- ✅ Deployed to cloud
- ✅ Accessible anywhere
- ✅ Ready for production
- ✅ Shareable with team

### **What You Can Do Now:**
- Use the app without your laptop
- Share with unlimited users
- Process sales anywhere
- Track inventory in real-time
- View analytics and reports
- Manage your retail business

---

## 📚 Additional Resources

- **API Documentation**: `API_DOCUMENTATION.md`
- **Full README**: `README.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Setup Guide**: `SETUP_GUIDE.md`

---

**Congratulations! Your retail business is now powered by a modern POS system! 🎊**

**Questions? Check the documentation or review the troubleshooting sections.**
