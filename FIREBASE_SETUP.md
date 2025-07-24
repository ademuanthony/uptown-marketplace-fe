# Firebase Setup Guide for Uptown Marketplace

## 🚀 Quick Start (Development Mode)

The application is currently running in **development mode** with mock authentication. You can test all authentication features without setting up Firebase.

**Test Credentials (Development Mode):**
- **Email**: Any valid email format (e.g., `test@example.com`)
- **Password**: Any password (minimum 6 characters)

## 🔧 Production Firebase Setup

To use real Firebase authentication, follow these steps:

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `uptown-marketplace` (or your preferred name)
4. Enable/disable Google Analytics as needed
5. Click "Create project"

### 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Enable the following providers:
   - **Email/Password**: Click and toggle "Enable"
   - **Google**: Click, toggle "Enable", and add your project's support email
   - **Facebook**: Click, toggle "Enable", and add your Facebook App ID and App Secret

### 3. Get Firebase Configuration

1. Go to **Project Settings** (gear icon in sidebar)
2. Scroll down to "Your apps" section
3. Click on "Web" icon (`</>`)
4. Register your app with nickname: `uptown-marketplace-frontend`
5. Copy the configuration object

### 4. Update Environment Variables

Replace the demo values in `.env.local` with your actual Firebase configuration:

```env
# Firebase Configuration (Replace with your actual values)
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id

# Set to false to use real Firebase
NEXT_PUBLIC_DEV_MODE=false
```

### 5. Configure Authentication Settings

#### Email/Password Settings:
1. In Firebase Console → Authentication → Settings
2. Configure **Authorized domains** to include your domain(s):
   - `localhost` (for development)
   - `your-production-domain.com` (for production)

#### Password Policy:
1. Go to Authentication → Settings → Password policy
2. Configure minimum requirements as needed

### 6. Set up Social Login (Optional)

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to APIs & Services → Credentials
4. Configure OAuth consent screen
5. Add authorized domains

#### Facebook OAuth:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing
3. Add Facebook Login product
4. Configure Valid OAuth Redirect URIs:
   - `https://your-project-id.firebaseapp.com/__/auth/handler`
5. Get App ID and App Secret for Firebase

### 7. Backend Integration

Update your Go backend to handle Firebase token validation:

```go
// Example: Verify Firebase token in your Go backend
func verifyFirebaseToken(tokenString string) (*auth.Token, error) {
    client, err := firebase.NewApp(context.Background(), &firebase.Config{
        ProjectID: "your-project-id",
    })
    if err != nil {
        return nil, err
    }
    
    authClient, err := client.Auth(context.Background())
    if err != nil {
        return nil, err
    }
    
    token, err := authClient.VerifyIDToken(context.Background(), tokenString)
    if err != nil {
        return nil, err
    }
    
    return token, nil
}
```

### 8. Required Backend Endpoints

Implement these endpoints in your Go backend:

```
POST /api/v1/auth/login
POST /api/v1/auth/register  
POST /api/v1/auth/social-login
GET  /api/v1/auth/me
```

## 🔍 Testing Authentication

### Development Mode Testing:
- Use any email/password combination
- All authentication features work with mock data
- No actual Firebase calls are made

### Production Mode Testing:
1. Register a new account with email/password
2. Verify email (if email verification is enabled)
3. Test login with registered credentials
4. Test password reset functionality
5. Test social login (Google/Facebook)

## 🛠️ Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/api-key-not-valid)"**
   - Check that your API key is correct in `.env.local`
   - Ensure the API key has proper restrictions in Google Cloud Console

2. **"Firebase: Error (auth/domain-not-authorized)"**
   - Add your domain to Authorized domains in Firebase Console
   - Include both `localhost` and your production domain

3. **Social login not working:**
   - Check OAuth configuration in respective platforms
   - Verify redirect URIs are correctly configured
   - Ensure client IDs and secrets are correct

4. **Backend integration issues:**
   - Verify Firebase Admin SDK is properly configured
   - Check that backend endpoints are implemented
   - Ensure proper CORS configuration

### Development Mode Issues:

1. **Authentication not persisting:**
   - Check browser's localStorage for auth data
   - Ensure `NEXT_PUBLIC_DEV_MODE=true` in `.env.local`

2. **Mock auth not working:**
   - Clear browser cache and localStorage
   - Restart the development server
   - Check console for any JavaScript errors

## 📚 Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Web Setup Guide](https://firebase.google.com/docs/web/setup)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Google OAuth Setup](https://developers.google.com/identity/oauth2/web/guides/overview)
- [Facebook Login Setup](https://developers.facebook.com/docs/facebook-login/)

## 🔐 Security Best Practices

1. **Environment Variables:**
   - Never commit real Firebase config to version control
   - Use different projects for development/staging/production
   - Rotate API keys regularly

2. **Authentication Rules:**
   - Implement proper email verification
   - Set up strong password policies
   - Monitor for suspicious activity

3. **Backend Security:**
   - Always verify Firebase tokens on the backend
   - Implement rate limiting
   - Use HTTPS in production
   - Validate all user inputs

---

**Need Help?** Check the console for detailed error messages and refer to the Firebase documentation for specific configuration issues.