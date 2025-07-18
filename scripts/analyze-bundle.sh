#!/bin/bash

# Build optimization script
# Analyzes bundle size and provides optimization recommendations

set -e

echo "📊 Analyzing bundle size and performance..."

# Build the project
echo "🏗️  Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Display bundle sizes
echo ""
echo "📦 Bundle Analysis:"
echo "=================="

# Find and display JS bundle sizes
echo "JavaScript bundles:"
find build/static/js -name "*.js" -exec ls -lh {} \; | awk '{print $9 " - " $5}'

echo ""
echo "CSS bundles:"
find build/static/css -name "*.css" -exec ls -lh {} \; | awk '{print $9 " - " $5}'

# Total build size
echo ""
echo "📊 Total build size:"
du -sh build/

# Recommendations
echo ""
echo "💡 Optimization Recommendations:"
echo "================================"
echo "1. Use 'npm run bundle-analyzer' to analyze bundle composition"
echo "2. Consider lazy loading for large components"
echo "3. Check for duplicate dependencies"
echo "4. Optimize images and assets"
echo "5. Use tree shaking for unused code"

# Check for large files
echo ""
echo "⚠️  Large files (>100KB):"
find build -size +100k -type f -exec ls -lh {} \; | awk '{print $9 " - " $5}'
