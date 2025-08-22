#!/bin/bash

# Jupyter AI Notebook - Deployment Script

set -e

echo "🚀 Deploying Jupyter AI Notebook..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_error "Git repository not initialized. Please run 'git init' first."
    exit 1
fi

print_status "Building web assets..."
npm run build || {
    print_error "Build failed"
    exit 1
}

print_success "Build completed successfully"

# Check if remote repository is configured
if ! git remote | grep -q origin; then
    print_warning "No remote repository configured."
    echo ""
    echo "To deploy with GitHub Actions:"
    echo "1. Create a new repository on GitHub"
    echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/jupyter-ai-notebook.git"
    echo "3. Run: git push -u origin main"
    echo ""
    exit 1
fi

# Get remote URL
REMOTE_URL=$(git remote get-url origin)
print_status "Remote repository: $REMOTE_URL"

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    print_warning "You have uncommitted changes."
    echo "Committing changes..."
    
    git add .
    git commit -m "Update deployment - $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Push to remote
print_status "Pushing to remote repository..."
git push origin main || {
    print_error "Failed to push to remote repository"
    exit 1
}

print_success "Successfully pushed to remote repository!"
echo ""
print_status "GitHub Actions will now automatically:"
echo "  ✓ Build the web application"
echo "  ✓ Generate Android APK"
echo "  ✓ Upload artifacts"
echo ""
echo "📱 To download the APK:"
echo "  1. Go to: ${REMOTE_URL//.git/}/actions"
echo "  2. Click on the latest workflow run"
echo "  3. Download 'jupyter-ai-notebook-apk' artifact"
echo ""
echo "🎉 Deployment initiated successfully!"