# Deployment Guide for Word Crossroads

This guide covers deploying your Word Crossroads game to various platforms.

## 🌐 Platform Options

### 1. **Vercel** (Recommended for Next.js-style apps)
### 2. **Railway** (Great for Node.js apps with databases)
### 3. **Render** (Free tier available)
### 4. **Heroku** (Classic choice)
### 5. **DigitalOcean App Platform**

---

## 🚀 Option 1: Railway (Recommended)

Railway is excellent for Node.js apps and provides easy database integration.

### Steps:

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize project**:
   ```bash
   railway init
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

### Environment Variables:
Set these in Railway dashboard:
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- `NODE_ENV=production`

---

## 🚀 Option 2: Render

### Steps:

1. **Push code to GitHub** (if not already done)
2. **Connect Render to your GitHub repo**
3. **Configure build settings**:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Set environment variables** in Render dashboard

---

## 🚀 Option 3: Vercel

While primarily for frontend, can work with API routes.

### Steps:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

---

## 🚀 Option 4: DigitalOcean App Platform

### Steps:

1. **Create new app** in DigitalOcean
2. **Connect GitHub repository**
3. **Configure app spec**
4. **Set environment variables**

---

## 🔧 Pre-Deployment Checklist

### Required Environment Variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID  
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `SESSION_SECRET` - Random string for session encryption
- `NODE_ENV=production`
- `PORT` - Usually set automatically by platform

### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Update OAuth redirect URIs to include your production domain:
   - `https://your-app-name.railway.app/auth/google/callback`
   - `https://your-app-name.render.com/auth/google/callback`

### Database Considerations:
Currently using in-memory storage. For production, consider:
- PostgreSQL (Railway provides free tier)
- MongoDB Atlas
- SQLite for simple deployments

---

## 📱 Mobile Optimization

The app is already responsive, but for better mobile experience:
- Consider PWA features
- Add touch gestures for canvas interaction
- Optimize for mobile performance

---

## 🔐 Security Considerations

- Ensure HTTPS in production
- Set secure cookie options
- Use strong session secrets
- Validate all user inputs
- Rate limit API endpoints

---

## 📊 Monitoring & Analytics

Consider adding:
- Error tracking (Sentry)
- Analytics (Google Analytics)
- Performance monitoring
- User feedback collection
