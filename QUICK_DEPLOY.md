# 🚀 Quick Deploy to Railway (Recommended)

Railway is the easiest way to deploy your Word Crossroads game.

## ✅ Step 1: Code is Ready!

Your code has been committed and pushed to GitHub successfully!

## 🚀 Step 2: Deploy to Railway (Choose Option A or B)

### Option A: Manual Deploy via Dashboard (Recommended)

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up/login

2. **Create New Project**: 
   - Click "New Project" 
   - Select "Deploy from GitHub repo"
   - Choose your `crossroads-ai-hackathon` repository

3. **Configure Environment Variables** in Railway dashboard:
   ```
   SESSION_SECRET=your_random_secret_here_123456789
   NODE_ENV=production
   ```
   
   **Optional (for Google Sign-In):**
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```

4. **Deploy**: Railway will automatically build and deploy your app

### Option B: CLI Deploy
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## Step 3: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth credentials
3. Add your Railway URL to authorized redirect URIs:
   ```
   https://your-app-name.railway.app/auth/google/callback
   ```

## Step 4: Test Your Deployment

1. Visit your Railway app URL
2. Test Google sign-in
3. Play a game to verify streak tracking works

## 🎉 You're Live!

Your Word Crossroads game is now deployed and accessible worldwide!

## Monitoring

- Check Railway dashboard for logs and metrics
- Monitor usage and performance
- Set up alerts for errors

## Scaling

Railway automatically scales based on usage. For high traffic:
- Consider upgrading to Pro plan
- Add database for persistent storage
- Implement caching for better performance
