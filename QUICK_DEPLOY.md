# 🚀 Quick Deploy to Railway (Recommended)

Railway is the easiest way to deploy your Word Crossroads game.

## Step 1: Prepare Your Code

1. Make sure your code is pushed to GitHub
2. Ensure all environment variables are documented

## Step 2: Deploy to Railway

### Option A: One-Click Deploy
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-url)

### Option B: Manual Deploy

1. **Create Railway Account**: Go to [railway.app](https://railway.app)

2. **Create New Project**: Click "New Project" → "Deploy from GitHub repo"

3. **Connect Repository**: Select your `crossroads-ai-hackathon` repo

4. **Set Environment Variables**:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   SESSION_SECRET=your_random_secret_here
   NODE_ENV=production
   ```

5. **Deploy**: Railway will automatically build and deploy your app

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
