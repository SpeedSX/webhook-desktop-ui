# Configuration Guide

This guide explains how to configure WebhookUI for your private webhook backend service.

## ⚠️ Important Security Note

**Never commit your `config.js` file to a public repository!** It contains your private webhook backend URL.

## Quick Setup

1. **Copy the example configuration:**
   ```bash
   cp config.example.js config.js
   ```

2. **Edit `config.js` with your settings:**
   ```javascript
   const config = {
     // Change this to your private webhook backend service
     webhookBackendUrl: 'https://your-private-webhook-service.com',
     
     // Other settings...
   };
   ```

3. **Restart the application**

## Configuration Options

### `webhookBackendUrl`
- **Required**: Your private webhook backend service URL
- **Example**: `'https://your-private-webhook-service.com'`
- **Security**: This URL should NOT be shared publicly

### `proxyPort`
- **Default**: `3002`
- **Purpose**: Local proxy service port that forwards requests to your webhook backend

### `proxyPortRange`
- **Default**: `{ start: 3002, end: 3012 }`
- **Purpose**: Range of ports to try if the primary proxy port is unavailable

### `autoRefreshInterval`
- **Default**: `3000` (3 seconds)
- **Purpose**: How often to automatically refresh request logs

### `maxLogCount`
- **Default**: `50`
- **Purpose**: Maximum number of requests to load by default

## File Structure

```
WebHookUI-Desktop/
├── config.example.js     # Example configuration (safe to commit)
├── config.js            # Your actual configuration (DO NOT COMMIT)
├── .gitignore           # Prevents config.js from being committed
├── renderer/
│   ├── index.html       # References config.js
│   ├── main.js          # Uses configuration values
│   └── style.css
└── src/
    └── main.js
```

## Making Your Repository Public

1. **Ensure `config.js` is in `.gitignore`** ✅
2. **Keep `config.example.js` as a template** ✅
3. **Document the configuration process** ✅
4. **Users can copy and customize for their setup** ✅

## Troubleshooting

### Configuration Not Loading
- Check that `config.js` exists in the root directory
- Verify the file path in `renderer/index.html`
- Check browser console for JavaScript errors

### Proxy Connection Issues
- Verify your proxy service is running on the configured port
- Check that the port range includes your proxy service port
- Ensure your webhook backend URL is accessible

## Example Configuration

```javascript
const config = {
  // Your private webhook backend
  webhookBackendUrl: 'https://webhooks.mycompany.com',
  
  // Local development proxy
  proxyPort: 3002,
  proxyPortRange: { start: 3002, end: 3012 },
  
  // Application settings
  autoRefreshInterval: 5000, // 5 seconds
  maxLogCount: 100,
  
  // UI preferences
  defaultExpandedSections: ['request-information', 'query-parameters'],
  defaultCollapsedSections: ['headers', 'parsed-body-object', 'raw-message']
};
```

## Support

If you encounter issues with configuration:
1. Check the browser console for error messages
2. Verify your `config.js` syntax is valid JavaScript
3. Ensure all required fields are set
4. Test with the example configuration first
