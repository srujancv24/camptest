# Google OAuth Setup Guide for CampScout

This guide will help you set up Google Sign-in functionality for the CampScout application.

## 🚀 Quick Setup Steps

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `CampScout` (or your preferred name)
4. Click "Create"

### Step 2: Enable Google Sign-In API

1. In your Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on "Google+ API" and click "Enable"
4. Also enable "Google Identity Services API"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" for testing
   - Fill in required fields:
     - App name: `CampScout`
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (your email addresses)

4. Create OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: `CampScout Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `http://localhost:3000` (alternative dev port)
   - Authorized redirect URIs:
     - `http://localhost:5173` (for development)

5. Click "Create" and copy the Client ID and Client Secret

### Step 4: Update Backend Configuration

1. Open `backend/.env` file
2. Replace the Google OAuth placeholders:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-client-id-from-step-3
GOOGLE_CLIENT_SECRET=your-actual-client-secret-from-step-3
```

### Step 5: Update Frontend Configuration

1. Open `frontend/src/components/LoginForm.jsx`
2. Find line 17 and replace the client ID:

```javascript
// Replace this line:
client_id: "your-google-client-id-here",

// With your actual client ID:
client_id: "your-actual-client-id-from-step-3",
```

### Step 6: Test the Setup

1. Start the backend:
```bash
cd backend
python3 -m uvicorn main:app --reload
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Go to `http://localhost:5173/auth`
4. Click "Continue with Google"
5. Complete the Google sign-in flow

## 🔧 Troubleshooting

### Issue: "Google Sign-In is not available"
**Solution**: Make sure you have internet connection and the Google Sign-In script is loaded.

### Issue: "Invalid client ID"
**Solution**: 
1. Double-check your client ID in both backend `.env` and frontend `LoginForm.jsx`
2. Make sure the client ID matches exactly from Google Cloud Console

### Issue: "Unauthorized JavaScript origin"
**Solution**: 
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 client
3. Add `http://localhost:5173` to "Authorized JavaScript origins"

### Issue: "Google OAuth not configured"
**Solution**: Make sure your backend `.env` file has the correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Issue: "Invalid Google token"
**Solution**: This usually means the token verification failed. Check:
1. Client ID matches in frontend and backend
2. Client secret is correct in backend
3. Your Google Cloud project has the necessary APIs enabled

## 🧪 Testing Without Google OAuth

If you want to test the application without setting up Google OAuth, you can:

1. Use the regular email/password registration and login
2. The search persistence feature works independently of authentication
3. Comment out the Google button in `LoginForm.jsx` temporarily:

```javascript
// Temporarily disable Google Sign-in button
{/* <div className="mt-6">
    <button ... >
        Continue with Google
    </button>
</div> */}
```

## 📋 Environment Variables Summary

Your `backend/.env` should look like this:

```bash
# Security Configuration
SECRET_KEY=dev-secret-key-change-this-in-production-make-it-long-and-random
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_HOURS=24
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here

# Database Configuration
DATABASE_PATH=campscout.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173

# Development/Production
ENVIRONMENT=development
```

## ✅ Verification Checklist

- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Authorized origins configured (`http://localhost:5173`)
- [ ] Backend `.env` updated with real credentials
- [ ] Frontend `LoginForm.jsx` updated with real client ID
- [ ] Backend starts without errors
- [ ] Frontend loads Google Sign-In script
- [ ] Google Sign-In button is clickable
- [ ] Google authentication flow completes successfully

## 🔒 Security Notes

- **Never commit real credentials to version control**
- Use environment variables for all sensitive data
- For production, use HTTPS and update authorized origins
- Consider implementing additional security measures like CSRF protection

## 🎯 Expected Behavior

When properly configured:

1. ✅ **Search Persistence**: Works immediately without any setup
   - Search results survive page refreshes
   - Last search parameters are displayed
   - Manual clear functionality works

2. ✅ **Google Sign-In**: Works after OAuth setup
   - Google button opens authentication popup
   - User can sign in with Google account
   - New users are automatically created
   - Existing users are logged in
   - JWT tokens are issued for session management

The search persistence feature is already working and doesn't require any additional setup. The Google OAuth feature requires the setup steps above to function properly.