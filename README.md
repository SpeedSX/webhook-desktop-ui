# WebHook UI Desktop

A desktop application for webhook testing and inspection with integrated proxy server.

## Features

- **All-in-One Desktop App**: Combines the UI and proxy server in a single Electron application
- **Token Management**: Generate webhook tokens or use custom GUIDs
- **Real-time Request Monitoring**: View incoming webhook requests in real-time
- **Request Inspection**: Detailed view of headers, body, and metadata
- **Search & Filtering**: Filter requests by method, search content
- **Auto-refresh**: Automatic polling for new requests
- **Cross-platform**: Works on Windows, macOS, and Linux

## Installation

1. **Clone or download** this project
2. **Install dependencies:**
   ```bash
   npm install
   ```

## Usage

### Development Mode
```bash
npm run dev
```
This starts the app in development mode with DevTools enabled.

### Production Mode
```bash
npm start
```
This starts the app in production mode.

### Building the App

For the current platform:
```bash
npm run build
```

For specific platforms:
```bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## How It Works

1. **Start the App**: The Electron app automatically starts the integrated proxy server on port 3001
2. **Generate Token**: Click "Generate New Token" or enter a custom GUID
3. **Get Webhook URL**: Use the provided URL (`https://webhooktest.xxx.dev/{token}`) in your applications
4. **Monitor Requests**: All incoming webhook requests will appear in the app in real-time
5. **Inspect Details**: Click on any request to see headers, body, and full details

## Architecture

- **Main Process**: Electron main process that manages the app window and embedded proxy server
- **Renderer Process**: The UI that displays the webhook testing interface
- **Integrated Proxy**: Express server that handles CORS and proxies requests to the backend API
- **Backend API**: https://webhooktest.xxx.dev (external service)

## Project Structure

```
WebHookUI-Desktop/
├── src/
│   └── main.js          # Electron main process
├── renderer/
│   ├── index.html       # UI template
│   ├── style.css        # Styles
│   └── main.js          # UI logic
├── assets/              # App icons and resources
├── package.json         # Dependencies and build config
└── README.md
```

## API Format

The app works with the webhook testing service API that returns log entries in this format:

```json
{
  "Id": "guid",
  "Date": "ISO timestamp",
  "TokenId": "guid",
  "MessageObject": {
    "Method": "HTTP method",
    "Value": "request path",
    "Headers": { "header-name": ["header-value"] },
    "QueryParameters": [],
    "Body": "raw body string",
    "BodyObject": {}
  }
}
```

## Benefits of Desktop Version

- **No Manual Setup**: No need to manually start proxy server - it's integrated
- **Single Executable**: Everything bundled in one app
- **Native Experience**: Native desktop app with proper window management
- **Easy Distribution**: Can be packaged and distributed as a standalone app
- **Offline Ready**: UI works offline (only API calls need internet)

## Development

The desktop app is built using:
- **Electron**: For the desktop app framework
- **Express**: For the integrated proxy server
- **Vanilla JavaScript**: For the UI logic
- **Modern CSS**: For styling and responsive design

## License

MIT License
