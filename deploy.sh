#!/bin/bash

# Word Crossroads Deployment Script
echo "🎮 Word Crossroads - Deployment Script"
echo "======================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔍 Checking environment variables..."
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not set"
fi

if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "⚠️  Warning: GOOGLE_CLIENT_ID not set (Google auth will be disabled)"
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  Warning: SESSION_SECRET not set"
fi

echo "🚀 Available deployment options:"
echo "1. Railway:           railway up"
echo "2. Vercel:            vercel"
echo "3. Render:            Connect GitHub repo in Render dashboard"
echo "4. DigitalOcean:      Connect GitHub repo in DO App Platform"

echo ""
echo "🔧 Don't forget to:"
echo "- Set environment variables in your platform dashboard"
echo "- Update Google OAuth redirect URIs for production domain"
echo "- Test the deployment thoroughly"

echo ""
echo "✅ Ready for deployment!"
