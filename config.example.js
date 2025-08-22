// WebhookUI Configuration Example
// Copy this file to config.js and modify the values for your setup

const config = {
  // Webhook backend service URL
  // IMPORTANT: Change this to your private webhook backend service URL
  // This should NOT be committed to public repositories
  webhookBackendUrl: 'https://your-private-webhook-service.com',
  
  // Proxy service configuration
  // Local proxy service that forwards requests to your webhook backend
  proxyPort: 3002,
  proxyPortRange: {
    start: 3002,
    end: 3012
  },
  
  // Application settings
  autoRefreshInterval: 3000, // 3 seconds
  maxLogCount: 50,
  
  // UI settings
  defaultExpandedSections: ['request-information', 'query-parameters', 'request-body'],
  defaultCollapsedSections: ['headers', 'parsed-body-object', 'raw-message']
};

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} else {
  window.webhookUIConfig = config;
}
