#!/bin/bash

echo "🏕️  CampScout Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "deploy.sh" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Frontend built successfully!"

# Check if git repo is initialized
if [ ! -d ".git" ]; then
    echo "🔧 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - CampScout deployment ready"
fi

echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy backend to Railway: https://railway.app"
echo "3. Deploy frontend to Vercel: https://vercel.com"
echo ""
echo "📖 See deploy.md for detailed instructions"
echo ""
echo "🎉 Your beautiful CampScout app will be live soon!"