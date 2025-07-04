# Production Deployment Fix Guide

## Problem
Your frontend is getting a 404 error because it's trying to call `http://localhost:8000` in production, but the backend is deployed on Render.

## Solution Steps

### 1. Get Your Render Backend URL
1. Go to your Render dashboard
2. Find your backend service
3. Copy the domain URL (should look like `https://your-app-name.onrender.com`)

### 2. Configure Frontend Environment Variables

#### For Netlify:
1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-render-app.onrender.com` (replace with your actual Render URL)
5. Redeploy your site

#### For Vercel:
1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-render-app.onrender.com` (replace with your actual Render URL)
5. Redeploy your project

### 3. Configure Backend CORS in Render
1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add/Update these variables:
   - **Key**: `CORS_ORIGINS`
   - **Value**: `https://your-netlify-app.netlify.app,https://your-vercel-app.vercel.app` (replace with your actual frontend URLs)
   - **Key**: `ENVIRONMENT`
   - **Value**: `production`

### 4. Verify the Fix
1. After both deployments are complete, check your Render logs for:
   ```
   Environment: production
   CORS allowed origins configured as: ['https://your-frontend-domain.com']
   ```
2. Test your frontend - the 404 errors should be resolved

## Common Issues

### Issue: Still getting CORS errors
**Solution**: Make sure your frontend domain is exactly correct in the `CORS_ORIGINS` variable (including https://)

### Issue: Backend not responding
**Solution**: Check Render logs to ensure the backend is starting properly

### Issue: Environment variables not updating
**Solution**: Redeploy both frontend and backend after changing environment variables

## Testing
1. Open your production frontend URL
2. Open browser developer tools (F12)
3. Check the Network tab - API calls should now go to your Render backend URL
4. Check for any remaining 404 or CORS errors

## Debugging
If you're still having issues, check:
1. Render logs for CORS configuration messages
2. Browser developer tools Network tab for actual API call URLs
3. Ensure both frontend and backend are redeployed after environment variable changes