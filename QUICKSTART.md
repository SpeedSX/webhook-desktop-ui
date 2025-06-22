# WebHook UI Desktop - Quick Start

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the app:**
   ```bash
   npm start          # Production mode
   npm run dev        # Development mode (with DevTools)
   ```

3. **Alternative: Use the batch file (Windows):**
   ```
   Double-click start.bat
   ```

## What the App Does

- **Integrated Server**: Automatically starts a proxy server on port 3001
- **UI Interface**: Opens a desktop window with the webhook testing interface
- **No Manual Setup**: Everything is bundled together - no need to start separate servers

## First Use

1. App opens automatically
2. Click "Generate New Token" 
3. Copy the webhook URL provided
4. Use that URL in your webhook integrations
5. Watch requests appear in real-time!

## Building for Distribution

```bash
npm run build          # Build for current platform
npm run build:win      # Windows installer
npm run build:mac      # macOS DMG
npm run build:linux    # Linux AppImage
```

## Troubleshooting

If the app doesn't start:
1. Make sure Node.js is installed
2. Run `npm install` first
3. Check that no other app is using port 3001

## Features

✅ **All-in-One**: UI + Proxy server integrated  
✅ **Cross-Platform**: Windows, macOS, Linux  
✅ **Real-time**: Live webhook monitoring  
✅ **Request Details**: Full inspection of headers/body  
✅ **Search & Filter**: Find specific requests easily  
✅ **Auto-refresh**: Automatic updates every 3 seconds  
✅ **Token Management**: Generate or use custom tokens  

Enjoy webhook testing! 🚀
