#!/bin/bash

# Create assets directory
mkdir -p assets

# Create a simple placeholder using ImageMagick if available
if command -v convert &> /dev/null; then
  echo "Creating placeholder assets with ImageMagick..."

  # App Icon (192x192)
  convert -size 192x192 xc:'#16a34a' -gravity center -pointsize 80 -fill white -annotate 0 '🏥' assets/icon.png
  echo "✓ Created icon.png (192x192)"

  # Adaptive Icon (108x108)
  convert -size 108x108 xc:'#16a34a' -gravity center -pointsize 50 -fill white -annotate 0 '🏥' assets/adaptive-icon.png
  echo "✓ Created adaptive-icon.png (108x108)"

  # Splash Screen (1080x1920)
  convert -size 1080x1920 xc:'#ffffff' -gravity center -pointsize 100 -fill '#16a34a' -annotate 0 'MedGuardian' assets/splash.png
  echo "✓ Created splash.png (1080x1920)"

  # Notification Icon (48x48)
  convert -size 48x48 xc:'#16a34a' -gravity center -pointsize 30 -fill white -annotate 0 '🔔' assets/notification-icon.png
  echo "✓ Created notification-icon.png (48x48)"

else
  echo "ImageMagick not found. Please install it:"
  echo "  macOS: brew install imagemagick"
  echo "  Ubuntu: sudo apt-get install imagemagick"
  echo "  Windows: choco install imagemagick"
  echo ""
  echo "Or manually create these images:"
  echo "  • assets/icon.png (192x192)"
  echo "  • assets/adaptive-icon.png (108x108)"
  echo "  • assets/splash.png (1080x1920)"
  echo "  • assets/notification-icon.png (48x48)"
fi
