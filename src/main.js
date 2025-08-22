const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

let mainWindow;
let proxyServer;

// Proxy server setup
function startProxyServer() {
  const proxyApp = express();
  
  // Load configuration
  let config;
  try {
    config = require('../config.js');
  } catch (err) {
    // Fallback configuration if config.js is not available
    config = {
      webhookBackendUrl: 'https://your-private-webhook-service.com',
      proxyPort: 3002,
      proxyPortRange: { start: 3002, end: 3012 }
    };
    console.warn('⚠️  config.js not found, using fallback configuration');
  }
  
  const PORT = config.proxyPort || 3002; // Use configured port or default

  // Enable CORS for all routes
  proxyApp.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Proxy middleware configuration
  const proxyOptions = {
    target: config.webhookBackendUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '', // Remove /api prefix when forwarding
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyOptions.target}${req.url.replace('/api', '')}`);
    },
    onError: (err, req, res) => {
      console.error('[PROXY ERROR]', err.message);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  };

  // Apply proxy middleware to /api routes
  proxyApp.use('/api', createProxyMiddleware(proxyOptions));

  // Health check endpoint
  proxyApp.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Proxy server is running' });
  });
  // Handle port conflicts
  proxyServer = proxyApp.listen(PORT, (err) => {
    if (err) {
      console.error(`❌ Failed to start proxy server on port ${PORT}:`, err.message);
      // Try alternative ports
      proxyServer = tryAlternativePorts(proxyApp, config.proxyPortRange.start, config.proxyPortRange.end);
    } else {
      console.log(`✅ Webhook UI Proxy Server running on http://localhost:${PORT}`);
      console.log(`🔗 Proxying requests to: ${config.webhookBackendUrl}`);
      console.log(`🚀 Frontend should use: http://localhost:${PORT}/api for webhook API calls`);
    }
  });

  proxyServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${PORT} is busy, trying alternative ports...`);
      proxyServer = tryAlternativePorts(proxyApp, config.proxyPortRange.start, config.proxyPortRange.end);
    } else {
      console.error('Proxy server error:', err);
    }
  });

  return proxyServer;
}

// Try alternative ports if the default is busy
function tryAlternativePorts(app, startPort, endPort) {
  for (let port = startPort; port <= endPort; port++) {
    try {
      const server = app.listen(port, () => {
        console.log(`✅ Webhook UI Proxy Server running on http://localhost:${port} (alternative port)`);
        console.log(`🔗 Proxying requests to: ${config.webhookBackendUrl}`);
        console.log(`🚀 Frontend should use: http://localhost:${port}/api for webhook API calls`);
        
        // Update the frontend to use the new port
        updateProxyUrlInRenderer(port);
        return server;
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && port < endPort) {
          // Try next port
          return;
        } else if (err.code === 'EADDRINUSE') {
          console.error(`❌ All ports from ${startPort} to ${endPort} are busy!`);
        } else {
          console.error('Proxy server error:', err);
        }
      });

      return server;
    } catch (err) {
      if (port === endPort) {
        console.error(`❌ Could not start proxy server on any port from ${startPort} to ${endPort}`);
      }
    }
  }
}

// Function to update the proxy URL in the renderer process
function updateProxyUrlInRenderer(port) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`
      if (window.webhookUI) {
        window.webhookUI.proxyUrl = 'http://localhost:${port}/api';
        console.log('Updated proxy URL to:', window.webhookUI.proxyUrl);
      }
    `);
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false, // Don't show until ready
    titleBarStyle: 'default'
  });

  // Load the app
  mainWindow.loadFile('renderer/index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'F5',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            // You can add an about dialog here
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  // Start the proxy server
  startProxyServer();
  
  // Create the main window
  createWindow();
  
  // Create the application menu
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop the proxy server
  if (proxyServer) {
    proxyServer.close(() => {
      console.log('Proxy server stopped');
    });
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Stop the proxy server
  if (proxyServer) {
    proxyServer.close();
  }
});
