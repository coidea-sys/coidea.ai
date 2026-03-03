/**
 * WebSocket Service for Real-time Collaboration
 */

class WebSocketService {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.emit('connected', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit(data.type, data);
          } catch (err) {
            console.error('Failed to parse message:', err);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.emit('disconnected', { code: event.code, reason: event.reason });
          
          // Attempt reconnection
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
              this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error('Error in event listener:', err);
        }
      });
    }
  }

  // Convenience methods
  ping() {
    return this.send({ type: 'ping', timestamp: Date.now() });
  }

  subscribe(channel) {
    return this.send({ type: 'subscribe', channel });
  }

  unsubscribe(channel) {
    return this.send({ type: 'unsubscribe', channel });
  }
}

// Singleton instance
let instance = null;

export function getWebSocketService(url = 'ws://localhost:3001') {
  if (!instance) {
    instance = new WebSocketService(url);
  }
  return instance;
}

export function resetWebSocketService() {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
}

export default WebSocketService;
