// Webhook Testing UI Application (Desktop Version)
class WebhookUI {
  constructor() {
    // Load configuration from config.js
    this.config = window.webhookUIConfig || {
      webhookBackendUrl: 'https://your-private-webhook-service.com',
      proxyPort: 3002,
      proxyPortRange: { start: 3002, end: 3012 },
      autoRefreshInterval: 3000,
      maxLogCount: 50
    };
    
    this.baseUrl = this.config.webhookBackendUrl;
    this.proxyUrl = `http://localhost:${this.config.proxyPort}/api`;
    this.currentToken = null;
    this.autoRefreshInterval = null;
    this.requests = [];
    this.viewedRequests = new Set(); // Track which requests have been viewed
    
    // Make instance available globally for port updates
    window.webhookUI = this;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkProxyConnection();
    this.loadTokenFromStorage();
    this.addCopyToClipboard();
  }

  // Event Bindings
  bindEvents() {
    // Token generation
    document.getElementById('generateToken').addEventListener('click', () => this.generateToken());
    document.getElementById('useCustomToken').addEventListener('click', () => this.useCustomToken());
    
    // Token management
    document.getElementById('copyUrl').addEventListener('click', () => this.copyWebhookUrl());
    document.getElementById('clearToken').addEventListener('click', () => this.clearToken());
    
    // Request logs
    document.getElementById('refreshLogs').addEventListener('click', () => this.loadRequests());
    document.getElementById('toggleAutoRefresh').addEventListener('click', () => this.toggleAutoRefresh());
    document.getElementById('clearLogs').addEventListener('click', () => this.clearLogs());
    document.getElementById('markAllAsViewed').addEventListener('click', () => this.markAllAsViewed());
    
    // Filters
    document.getElementById('searchFilter').addEventListener('input', () => this.filterRequests());
    document.getElementById('methodFilter').addEventListener('change', () => this.filterRequests());
    
    // Details Panel
    document.getElementById('closeDetailsPanel').addEventListener('click', () => this.closeDetailsPanel());

    // Enter key for custom token
    document.getElementById('customToken').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.useCustomToken();
    });
  }

  // Token Management
  generateToken() {
    const token = this.generateGUID();
    this.setActiveToken(token);
  }

  useCustomToken() {
    const customToken = document.getElementById('customToken').value.trim();
    if (this.isValidGUID(customToken)) {
      this.setActiveToken(customToken);
      document.getElementById('customToken').value = '';
    } else {
      this.showError('Please enter a valid GUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)');
    }
  }

  setActiveToken(token) {
    this.currentToken = token;
    this.requests = [];
    this.viewedRequests.clear(); // Clear viewed requests for new token
    this.updateUI();
    this.saveTokenToStorage();
    this.loadRequests();
  }

  clearToken() {
    this.currentToken = null;
    this.requests = [];
    this.viewedRequests.clear(); // Clear viewed requests when clearing token
    this.stopAutoRefresh();
    this.updateUI();
    this.removeTokenFromStorage();
  }

  // UI Updates
  updateUI() {
    const hasToken = !!this.currentToken;
    
    // Show/hide sections
    document.getElementById('activeTokenSection').style.display = hasToken ? 'block' : 'none';
    document.getElementById('requestLogsSection').style.display = hasToken ? 'block' : 'none';
    
    if (hasToken) {
      // Update webhook URL and token display
      const webhookUrl = `${this.baseUrl}/${this.currentToken}`;
      document.getElementById('webhookUrl').value = webhookUrl;
      document.getElementById('currentToken').textContent = this.currentToken;
    }
  }

  // Request Management
  async loadRequests() {
    if (!this.currentToken) return;

    const count = document.getElementById('logCount').value || this.config.maxLogCount;
    
    try {
      const response = await fetch(`${this.proxyUrl}/${this.currentToken}/log/${count}`);
      
      if (response.ok) {
        const newRequests = await response.json();
        const newRequestsArray = Array.isArray(newRequests) ? newRequests : [];
        
        // Check if this is the first load for this token (no previous requests)
        const isFirstLoad = this.requests.length === 0;
        
        // Track which requests are new (not previously seen)
        const newRequestIds = new Set(newRequestsArray.map(req => req.Id || req.id));
        const previousRequestIds = new Set(this.requests.map(req => req.Id || req.id));
        
        if (isFirstLoad) {
          // On first load, mark all existing requests as viewed
          newRequestIds.forEach(id => {
            if (id) {
              this.viewedRequests.add(id);
            }
          });
        } else {
          // Mark new requests as unviewed (only for subsequent loads)
          newRequestIds.forEach(id => {
            if (!previousRequestIds.has(id)) {
              // This is a new request, don't mark it as viewed yet
            }
          });
        }
        
        // Remove viewed status for requests that are no longer in the list
        this.viewedRequests.forEach(id => {
          if (!newRequestIds.has(id)) {
            this.viewedRequests.delete(id);
          }
        });
        
        this.requests = newRequestsArray;
        this.renderRequests();
      } else if (response.status === 404) {
        // No requests yet
        this.requests = [];
        this.viewedRequests.clear(); // Clear viewed requests when starting fresh
        this.renderRequests();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
      this.showError(`Failed to load requests: ${error.message}`);
    }
  }

  renderRequests() {
    const container = document.getElementById('requestsList');
    
    if (this.requests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No requests yet. Send a request to your webhook endpoint to see it here.</p>
        </div>
      `;
      return;
    }

    const filteredRequests = this.getFilteredRequests();
    
    container.innerHTML = filteredRequests.map(request => this.renderRequestItem(request)).join('');
    
    // Add click listeners to request items
    container.querySelectorAll('.request-item').forEach((item, index) => {
      item.addEventListener('click', () => this.showRequestDetails(filteredRequests[index]));
    });
    
    // Update new requests counter in header
    this.updateNewRequestsCounter();
  }

  updateNewRequestsCounter() {
    const newRequestsCount = this.requests.filter(req => {
      const requestId = req.Id || req.id;
      return requestId && !this.viewedRequests.has(requestId);
    }).length;
    
    // Update the header title to show new requests count
    const headerTitle = document.querySelector('.logs-header h2');
    if (headerTitle) {
      if (newRequestsCount > 0) {
        headerTitle.innerHTML = `<i class="fas fa-list"></i> Request Logs <span class="new-requests-badge">${newRequestsCount} new</span>`;
      } else {
        headerTitle.innerHTML = `<i class="fas fa-list"></i> Request Logs`;
      }
    }
  }

  renderRequestItem(request) {
    // Handle the actual webhook service format
    const time = new Date(request.Date || request.timestamp || Date.now()).toLocaleString();
    const method = (request.MessageObject?.Method || request.method || 'GET').toUpperCase();
    const fullPath = request.MessageObject?.Value || request.path || request.url || '/';
    
    // Extract the path after the token (more useful for developers)
    let displayPath = fullPath;
    if (this.currentToken && fullPath.includes(this.currentToken)) {
      const tokenIndex = fullPath.indexOf(this.currentToken);
      const afterToken = fullPath.substring(tokenIndex + this.currentToken.length);
      displayPath = afterToken || '/';
    }
    
    const status = request.MessageObject?.StatusCode || request.statusCode || request.status || 200;
    
    const methodClass = `method-${method.toLowerCase()}`;
    const statusClass = `status-${Math.floor(status / 100) * 100}`;
    
    // Check if this request is new (unviewed)
    const requestId = request.Id || request.id;
    const isNewRequest = requestId && !this.viewedRequests.has(requestId);
    const newRequestClass = isNewRequest ? 'new-request' : '';
    
    return `
      <div class="request-item ${newRequestClass}" data-request-id="${requestId || Date.now()}">
        <div class="request-header">
          <span class="request-method ${methodClass}">${method}</span>
          <span class="request-path" title="${fullPath}">${displayPath}</span>
          <span class="request-time">${time}</span>
          <span class="request-status ${statusClass}">${status}</span>
        </div>
        <div class="request-preview">
          <div>
            <strong>Headers:</strong> ${Object.keys(request.MessageObject?.Headers || request.headers || {}).length} items
          </div>
          <div>
            <strong>Body:</strong> ${this.getBodyPreview(request.MessageObject?.Body || request.body)}
          </div>
        </div>
      </div>
    `;
  }

  getBodyPreview(body) {
    if (!body) return 'Empty';
    
    // Handle both string body and object body
    let bodyStr;
    if (typeof body === 'string') {
      bodyStr = body;
    } else if (typeof body === 'object') {
      bodyStr = JSON.stringify(body);
    } else {
      bodyStr = String(body);
    }
    
    // Clean up the preview text
    bodyStr = bodyStr.trim();
    
    // Return truncated version if too long
    return bodyStr.length > 50 ? bodyStr.substring(0, 50) + '...' : bodyStr;
  }

  // Request Details Panel
  showRequestDetails(request) {
    const panel = document.getElementById('requestDetailsPanel');
    const details = document.getElementById('requestDetails');
    const requestId = request.Id || request.id;
    
    // Check if clicking on the same request - toggle panel
    if (this.currentSelectedRequest && 
        (this.currentSelectedRequest.Id || this.currentSelectedRequest.id) === requestId &&
        panel.style.display === 'block') {
      this.closeDetailsPanel();
      return;
    }
    
    // Mark this request as viewed
    if (requestId) {
      this.viewedRequests.add(requestId);
      
      // Remove the 'new-request' class from the request item
      const requestItems = document.querySelectorAll('.request-item');
      requestItems.forEach(item => {
        const itemId = item.getAttribute('data-request-id');
        if (itemId === requestId) {
          item.classList.remove('new-request');
        }
      });
      
      // Update the new requests counter
      this.updateNewRequestsCounter();
    }
    
    // Clear any active state from previous requests
    document.querySelectorAll('.request-item.active').forEach(item => {
      item.classList.remove('active');
    });
    
    // Find and highlight the clicked request item
    const requestItems = document.querySelectorAll('.request-item');
    requestItems.forEach(item => {
      const itemId = item.getAttribute('data-request-id');
      if (itemId === requestId) {
        item.classList.add('active');
      }
    });
    
    details.innerHTML = this.renderRequestDetails(request);
    panel.style.display = 'block';
    
    // Store current request for reference
    this.currentSelectedRequest = request;
  }

  renderRequestDetails(request) {
    const time = new Date(request.Date || request.timestamp || Date.now()).toLocaleString();
    const messageObj = request.MessageObject || {};
    const fullPath = messageObj.Value || request.path || request.url || '/';
    
    // Extract the path after the token for better readability
    let endpointPath = fullPath;
    if (this.currentToken && fullPath.includes(this.currentToken)) {
      const tokenIndex = fullPath.indexOf(this.currentToken);
      const afterToken = fullPath.substring(tokenIndex + this.currentToken.length);
      endpointPath = afterToken || '/';
    }
    
    return `
      <div class="detail-section collapsible">
        <div class="section-header">
          <h4 class="collapsible-header" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">
            <i class="fas fa-chevron-down"></i> Request Information
          </h4>
          <button class="copy-btn" onclick="event.stopPropagation(); this.parentElement.parentElement.querySelector('.detail-grid').copyToClipboard()">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
        <div class="detail-grid collapsible-content">
          <span class="detail-label">Method:</span>
          <span class="detail-value">${messageObj.Method || request.method || 'GET'}</span>
          
          <span class="detail-label">Endpoint:</span>
          <span class="detail-value">${endpointPath}</span>
          
          <span class="detail-label">Full Path:</span>
          <span class="detail-value">${fullPath}</span>
          
          <span class="detail-label">Timestamp:</span>
          <span class="detail-value">${time}</span>
          
          <span class="detail-label">Request ID:</span>
          <span class="detail-value">${request.Id || request.id || 'N/A'}</span>
          
          <span class="detail-label">Token ID:</span>
          <span class="detail-value">${request.TokenId || 'N/A'}</span>
        </div>
      </div>

      <div class="detail-section collapsible collapsed">
        <div class="section-header">
          <h4 class="collapsible-header" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">
            <i class="fas fa-chevron-right"></i> Headers
          </h4>
          <button class="copy-btn" onclick="event.stopPropagation(); this.parentElement.parentElement.querySelector('.code-block').copyToClipboard()">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
        <div class="code-block collapsible-content">${this.formatJSON(messageObj.Headers || request.headers || {})}</div>
      </div>

      <div class="detail-section collapsible">
        <div class="section-header">
          <h4 class="collapsible-header" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">
            <i class="fas fa-chevron-down"></i> Query Parameters
          </h4>
          <button class="copy-btn" onclick="event.stopPropagation(); this.parentElement.parentElement.querySelector('.code-block').copyToClipboard()">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
        <div class="code-block collapsible-content">${this.formatJSON(messageObj.QueryParameters || request.query || [])}</div>
      </div>

      <div class="detail-section collapsible">
        <div class="section-header">
          <h4 class="collapsible-header" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">
            <i class="fas fa-chevron-down"></i> Request Body
          </h4>
          <button class="copy-btn" onclick="event.stopPropagation(); this.parentElement.parentElement.querySelector('.code-block').copyToClipboard()">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>
        <div class="code-block collapsible-content">${this.formatRequestBody(messageObj.Body || request.body)}</div>
      </div>

      ${messageObj.BodyObject ? `
        <div class="detail-section collapsible collapsed">
          <div class="section-header">
            <h4 class="collapsible-header" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">
              <i class="fas fa-chevron-right"></i> Parsed Body Object
            </h4>
            <button class="copy-btn" onclick="event.stopPropagation(); this.parentElement.parentElement.querySelector('.code-block').copyToClipboard()">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="code-block collapsible-content">${this.formatJSON(messageObj.BodyObject)}</div>
        </div>
      ` : ''}

      ${request.Message ? `
        <div class="detail-section collapsible collapsed">
          <div class="section-header">
            <h4 class="collapsible-header" onclick="this.parentElement.parentElement.classList.toggle('collapsed')">
              <i class="fas fa-chevron-right"></i> Raw Message
            </h4>
            <button class="copy-btn" onclick="event.stopPropagation(); this.parentElement.parentElement.querySelector('.code-block').copyToClipboard()">
              <i class="fas fa-copy"></i> Copy
            </button>
          </div>
          <div class="code-block collapsible-content">${this.escapeHtml(request.Message)}</div>
        </div>
      ` : ''}
    `;
  }

  formatRequestBody(body) {
    if (!body) return 'Empty';
    
    // If it's already an object, format it as JSON
    if (typeof body === 'object') {
      return this.formatJSON(body);
    }
    
    // If it's a string, try to parse as JSON for pretty formatting
    if (typeof body === 'string') {
      const trimmedBody = body.trim();
      
      // Check if it looks like JSON
      if ((trimmedBody.startsWith('{') && trimmedBody.endsWith('}')) || 
          (trimmedBody.startsWith('[') && trimmedBody.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmedBody);
          return this.formatJSON(parsed);
        } catch {
          // If parsing fails, return as-is
          return this.escapeHtml(trimmedBody);
        }
      }
      
      // Return as-is if not JSON-like
      return this.escapeHtml(trimmedBody);
    }
    
    // For other types, convert to string
    return this.escapeHtml(String(body));
  }

  formatJSON(obj) {
    return this.escapeHtml(JSON.stringify(obj, null, 2));
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  closeDetailsPanel() {
    const panel = document.getElementById('requestDetailsPanel');
    panel.style.display = 'none';
    
    // Clear active state from all request items
    document.querySelectorAll('.request-item.active').forEach(item => {
      item.classList.remove('active');
    });
    
    // Clear current selection
    this.currentSelectedRequest = null;
  }

  // Filtering
  getFilteredRequests() {
    let filtered = [...this.requests];
    
    const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
    const methodFilter = document.getElementById('methodFilter').value;
    
    if (searchTerm) {
      filtered = filtered.filter(request => {
        const messageObj = request.MessageObject || {};
        const searchableText = [
          messageObj.Method || request.method,
          messageObj.Value || request.path || request.url,
          JSON.stringify(messageObj.Headers || request.headers || {}),
          messageObj.Body || (typeof request.body === 'string' ? request.body : JSON.stringify(request.body || {})),
          request.Id || request.id || '',
          request.TokenId || ''
        ].join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm);
      });
    }
    
    if (methodFilter) {
      filtered = filtered.filter(request => {
        const method = request.MessageObject?.Method || request.method || 'GET';
        return method.toUpperCase() === methodFilter.toUpperCase();
      });
    }
    
    return filtered;
  }

  filterRequests() {
    this.renderRequests();
  }

  // Auto-refresh
  toggleAutoRefresh() {
    const button = document.getElementById('toggleAutoRefresh');
    
    if (this.autoRefreshInterval) {
      this.stopAutoRefresh();
    } else {
      this.startAutoRefresh();
    }
  }

  startAutoRefresh() {
    const button = document.getElementById('toggleAutoRefresh');
    button.innerHTML = '<i class="fas fa-pause"></i> Stop Auto Refresh';
    button.classList.add('auto-refresh-active');
    
         this.autoRefreshInterval = setInterval(() => {
       this.loadRequests();
     }, this.config.autoRefreshInterval); // Refresh interval from config
  }

  stopAutoRefresh() {
    const button = document.getElementById('toggleAutoRefresh');
    button.innerHTML = '<i class="fas fa-play"></i> Auto Refresh';
    button.classList.remove('auto-refresh-active');
    
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  clearLogs() {
    this.requests = [];
    this.viewedRequests.clear(); // Clear viewed requests when clearing logs
    this.renderRequests();
  }

  markAllAsViewed() {
    this.viewedRequests.clear(); // Mark all as viewed
    this.renderRequests(); // Re-render to remove 'new-request' class from all items
    this.updateNewRequestsCounter(); // Update the counter
    this.showSuccess('All requests marked as viewed!');
  }
  // Connection Management
  async checkProxyConnection() {
    const statusElement = document.getElementById('connectionStatus');
    
    try {
      statusElement.className = 'connection-status checking';
      statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Checking proxy connection...</span>';
      
             // Try the configured proxy URL first
       let healthUrl = this.proxyUrl.replace('/api', '/health');
       let response = await fetch(healthUrl, {
         method: 'GET',
         headers: { 'Content-Type': 'application/json' }
       });
       
       if (!response.ok) {
         // If primary port fails, try alternative ports
         for (let port = this.config.proxyPortRange.start; port <= this.config.proxyPortRange.end; port++) {
          try {
            healthUrl = `http://localhost:${port}/health`;
            response = await fetch(healthUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              // Update proxy URL to working port
              this.proxyUrl = `http://localhost:${port}/api`;
              console.log(`Found working proxy on port ${port}`);
              break;
            }
          } catch (err) {
            // Continue trying next port
          }
        }
      }
      
      if (response.ok) {
        statusElement.className = 'connection-status connected';
        statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Proxy connected</span>';
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      statusElement.className = 'connection-status disconnected';
      statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Proxy disconnected</span>';
      console.warn('Proxy connection failed:', error.message);
    }
  }

  // Utility Functions
  generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  isValidGUID(str) {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(str);
  }

  copyWebhookUrl() {
    const urlInput = document.getElementById('webhookUrl');
    urlInput.select();
    urlInput.setSelectionRange(0, 99999);
    
    try {
      document.execCommand('copy');
      this.showSuccess('Webhook URL copied to clipboard!');
    } catch (err) {
      // Fallback for modern browsers
      navigator.clipboard.writeText(urlInput.value).then(() => {
        this.showSuccess('Webhook URL copied to clipboard!');
      }).catch(() => {
        this.showError('Failed to copy URL to clipboard');
      });
    }
  }

  // Add copyToClipboard method to HTMLElement prototype
  addCopyToClipboard() {
    if (!HTMLElement.prototype.copyToClipboard) {
      HTMLElement.prototype.copyToClipboard = function() {
        const text = this.textContent || this.innerText;
        
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(() => {
            // Show success notification
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 12px 20px;
              border-radius: 4px;
              color: white;
              font-weight: 500;
              z-index: 10000;
              max-width: 400px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              background-color: #10b981;
            `;
            notification.textContent = 'Content copied to clipboard!';
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
              notification.remove();
            }, 2000);
          }).catch(() => {
            this.showError('Failed to copy to clipboard');
          });
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            document.execCommand('copy');
            textArea.remove();
            
            // Show success notification
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 12px 20px;
              border-radius: 4px;
              color: white;
              font-weight: 500;
              z-index: 10000;
              max-width: 400px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              background-color: #10b981;
            `;
            notification.textContent = 'Content copied to clipboard!';
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
              notification.remove();
            }, 2000);
          } catch (err) {
            textArea.remove();
            this.showError('Failed to copy to clipboard');
          }
        }
      };
    }
  }

  // Storage
  saveTokenToStorage() {
    if (this.currentToken) {
      localStorage.setItem('webhookui-token', this.currentToken);
    }
  }

  loadTokenFromStorage() {
    const savedToken = localStorage.getItem('webhookui-token');
    if (savedToken && this.isValidGUID(savedToken)) {
      this.setActiveToken(savedToken);
    }
  }

  removeTokenFromStorage() {
    localStorage.removeItem('webhookui-token');
  }

  // Notifications
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    // Simple notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new WebhookUI();
});

console.log('🚀 Webhook Testing UI Desktop loaded successfully!');
