#!/bin/bash
set -e

echo "=== Building ClaudeUsageSystray ==="

# Check for xcodegen
if ! command -v xcodegen &> /dev/null; then
    echo "Installing xcodegen..."
    brew install xcodegen
fi

cd "$(dirname "$0")"

# Generate Xcode project
echo "Generating Xcode project..."
xcodegen generate

# Build
echo "Building..."
xcodebuild -project ClaudeUsageSystray.xcodeproj \
    -scheme ClaudeUsageSystray \
    -configuration Release \
    -derivedDataPath build \
    build

# Copy to /Applications
APP_PATH="build/Build/Products/Release/ClaudeUsageSystray.app"
if [ -d "$APP_PATH" ]; then
    echo "Installing to /Applications..."
    cp -rf "$APP_PATH" /Applications/ClaudeUsageSystray.app
    echo ""
    echo "=== Done! ==="
    echo "App installed to /Applications/ClaudeUsageSystray.app"
    echo ""
    echo "IMPORTANT: Make sure Claude Code is logged in first:"
    echo "  claude --login"
    echo ""
    echo "Then launch the app:"
    echo "  open /Applications/ClaudeUsageSystray.app"
else
    echo "ERROR: Build output not found at $APP_PATH"
    exit 1
fi
