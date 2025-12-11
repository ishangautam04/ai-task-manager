# 🚀 Deployment Guide: Vercel + Cyclic

This guide will help you deploy your AI Task Manager application with:
- **Frontend** on Vercel (React app)
- **Backend** on Cyclic (Node.js API)

---

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Your code pushed to GitHub
- ✅ MongoDB Atlas connection string
- ✅ Gemini API key

---

## Part 1: Deploy Backend to Cyclic 🔧

### Step 1: Sign Up for Cyclic

1. Go to [cyclic.sh](https://cyclic.sh)
2. Click **"Login with GitHub"**
3. Authorize Cyclic to access your repositories

### Step 2: Deploy Backend

1. Click **"Link Your Own"** or **"Deploy"**
2. Select your repository: `ai-task-manager`
3. Click **"Connect"**
4. Cyclic will automatically detect your Node.js app

### Step 3: Configure Environment Variables

In Cyclic dashboard, go to **"Variables"** tab and add:

```
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/taskmanager?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
PORT=5000
```

**Important:** Use your REAL values from your local `.env` file!

### Step 4: Set Root Directory (if needed)

1. Go to **"Settings"** → **"General"**
2. Set **Root Directory** to: `backend`
3. Click **"Save"**

### Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for deployment to complete (1-2 minutes)
3. Copy your backend URL (looks like: `https://your-app-name.cyclic.app`)

✅ **Backend is now live!**

---

## Part 2: Deploy Frontend to Vercel 🎨

### Step 1: Update Frontend API URL

Before deploying, update your frontend to use the Cyclic backend URL:

1. Open `frontend/src/App.js`
2. Find this line near the top (around line 20):
```javascript
const API_BASE_URL = 'http://localhost:5000';
```

3. Replace with:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-app-name.cyclic.app';
```

4. Replace `your-app-name.cyclic.app` with your actual Cyclic URL
5. Commit and push to GitHub:
```bash
git add .
git commit -m "Update API URL for production"
git push origin main
```

### Step 2: Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

### Step 3: Import Project

1. Click **"Add New"** → **"Project"**
2. Import your `ai-task-manager` repository
3. Click **"Import"**

### Step 4: Configure Project Settings

1. **Framework Preset**: Vercel should auto-detect "Create React App"
2. **Root Directory**: Click **"Edit"** and set to `frontend`
3. **Build Settings**:
   - Build Command: `npm install && npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

### Step 5: Add Environment Variables (Optional)

Click **"Environment Variables"** and add:

```
REACT_APP_API_URL=https://your-app-name.cyclic.app
```

Replace with your actual Cyclic backend URL.

### Step 6: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Copy your Vercel URL (looks like: `https://your-app.vercel.app`)

✅ **Frontend is now live!**

---

## Part 3: Update Backend CORS 🔗

### Important: Allow Vercel Frontend

1. Go back to your Cyclic dashboard
2. Go to **"Variables"** tab
3. Add a new environment variable:
```
FRONTEND_URL=https://your-app.vercel.app
```

4. Replace with your actual Vercel URL
5. Click **"Save"**
6. Redeploy backend (Cyclic will auto-redeploy)

---

## 🧪 Test Your Deployment

1. Visit your Vercel frontend URL
2. Try to:
   - ✅ Login with demo mode
   - ✅ Create a task with AI
   - ✅ Create a note
   - ✅ Test voice recording

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** Backend not starting
- Check environment variables are set correctly
- Check MongoDB connection string is valid
- View logs in Cyclic dashboard

**Problem:** API calls failing
- Verify backend URL is correct in frontend
- Check CORS settings allow Vercel domain
- Check Cyclic app is awake

### Frontend Issues

**Problem:** "Failed to fetch" errors
- Check API_BASE_URL points to Cyclic backend
- Verify backend is deployed and running
- Check browser console for CORS errors

**Problem:** Build fails on Vercel
- Check `frontend/package.json` has all dependencies
- Verify Root Directory is set to `frontend`
- Check build command is correct

---

## 📱 Your Live URLs

After deployment, you'll have:

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-app-name.cyclic.app`

Share the frontend URL with anyone! 🎉

---

## 🔄 Future Updates

When you make code changes:

1. **Commit and push to GitHub:**
```bash
git add .
git commit -m "Your update message"
git push origin main
```

2. **Automatic deployment:**
   - ✅ Vercel will auto-deploy frontend
   - ✅ Cyclic will auto-deploy backend

No manual redeployment needed! 🚀

---

## 💰 Cost

- **Vercel**: FREE forever (unlimited bandwidth)
- **Cyclic**: FREE forever (no cold starts!)
- **MongoDB Atlas**: FREE (512MB)
- **Gemini API**: FREE (15 req/min)

**Total: $0/month** 🎉

---

## 📧 Need Help?

- Vercel Docs: https://vercel.com/docs
- Cyclic Docs: https://docs.cyclic.sh
- MongoDB Atlas: https://cloud.mongodb.com

---

**Congratulations! Your app is now live! 🎊**
