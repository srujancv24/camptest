# 🚀 CampScout Deployment Guide

Your beautiful CampScout app with the new colorful UI is ready for production! 

## 🎨 What's New in This Version
- ✨ Centered, clickable logo with animations
- 🌈 Beautiful gradient color scheme (emerald, teal, cyan)
- 🎯 Enhanced tab buttons with hover effects and gradients
- 📱 Fully responsive design
- 🎪 Colorful stats cards with gradients
- 🎭 Smooth animations and transitions

## Prerequisites
- GitHub account
- Choose one: Vercel/Netlify (frontend) + Railway/Render (backend)

## Step 1: Deploy Backend to Railway

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Choose your CampScout repository
   - Select the `backend` folder as the root directory
   - Railway will automatically detect it's a Python app

3. **Set Environment Variables in Railway**:
   ```
   SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_HOURS=24
   JWT_REFRESH_TOKEN_EXPIRE_DAYS=30
   CORS_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:5173
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Get your Railway backend URL** (something like `https://your-app.railway.app`)

## Step 2: Deploy Frontend to Vercel

1. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set the root directory to `frontend`
   - Vercel will auto-detect it's a Vite React app

2. **Set Environment Variables in Vercel**:
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app
   ```

3. **Deploy!** - Vercel will build and deploy automatically

## Step 3: Update CORS Settings

After getting your Vercel frontend URL, update the `CORS_ORIGINS` environment variable in Railway:
```
CORS_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:5173
```

## 🎉 Your app will be live!

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`

## Alternative: One-Click Deploy

Use the deploy buttons below for instant deployment:

### Deploy Backend to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template)

### Deploy Frontend to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/your-repo&project-name=campscout-frontend&repository-name=campscout-frontend&root-directory=frontend)

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Make sure CORS_ORIGINS includes your Vercel domain
2. **API Not Found**: Verify VITE_API_URL is set correctly in Vercel
3. **Build Failures**: Check that all dependencies are in package.json

### Health Checks:
- Backend: `https://your-railway-app.railway.app/health`
- Frontend: Should load the beautiful CampScout interface!