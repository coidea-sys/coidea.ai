/**
 * WebSocket Server for Real-time Collaboration
 * TDD Implementation
 */

const WebSocket = require('ws');

class WebSocketServer {
  constructor(port = 3001) {
    this.port = port;
    this.wss = null;
    this.clients = new Map(); // client <-> metadata
    this.channels = new Map(); // channel <-> Set of clients
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocket.Server({ port: this.port });

        this.wss.on('connection', (ws, req) => {
          console.log('New client connected');
          
          // Store client with metadata
          const clientId = this.generateClientId();
          this.clients.set(ws, {
            id: clientId,
            channels: new Set(),
            connectedAt: new Date()
          });

          // Send welcome message
          this.sendToClient(ws, {
            type: 'connected',
            clientId,
            timestamp: Date.now()
          });

          // Handle messages
          ws.on('message', (data) => {
            this.handleMessage(ws, data);
          });

          // Handle close
          ws.on('close', () => {
            this.handleDisconnect(ws);
          });

          // Handle error
          ws.on('error', (error) => {
            console.error('Client error:', error);
            this.handleDisconnect(ws);
          });
        });

        this.wss.on('error', (error) => {
          console.error('WebSocket server error:', error);
          reject(error);
        });

        this.wss.on('listening', () => {
          console.log(`WebSocket server listening on port ${this.port}`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  stop() {
    return new Promise((resolve) => {
      // Close all client connections
      this.clients.forEach((metadata, ws) => {
        ws.close();
      });
      this.clients.clear();
      this.channels.clear();

      // Close server
      if (this.wss) {
        this.wss.close(() => {
          console.log('WebSocket server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(ws);

      switch (message.type) {
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
          break;

        case 'subscribe':
          this.subscribe(ws, message.channel);
          break;

        case 'unsubscribe':
          this.unsubscribe(ws, message.channel);
          break;

        case 'broadcast':
          this.broadcast(message.data, message.channel);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
      this.sendToClient(ws, { type: 'error', message: 'Invalid JSON' });
    }
  }

  handleDisconnect(ws) {
    const client = this.clients.get(ws);
    if (client) {
      // Unsubscribe from all channels
      client.channels.forEach(channel => {
        this.unsubscribe(ws, channel);
      });
      
      this.clients.delete(ws);
      console.log(`Client ${client.id} disconnected`);
    }
  }

  subscribe(ws, channel) {
    const client = this.clients.get(ws);
    if (!client) return;

    // Add to channel
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel).add(ws);
    
    // Track in client
    client.channels.add(channel);

    this.sendToClient(ws, {
      type: 'subscribed',
      channel
    });

    console.log(`Client ${client.id} subscribed to ${channel}`);
  }

  unsubscribe(ws, channel) {
    const client = this.clients.get(ws);
    if (!client) return;

    // Remove from channel
    if (this.channels.has(channel)) {
      this.channels.get(channel).delete(ws);
      
      // Clean up empty channels
      if (this.channels.get(channel).size === 0) {
        this.channels.delete(channel);
      }
    }

    // Remove from client tracking
    client.channels.delete(channel);

    console.log(`Client ${client.id} unsubscribed from ${channel}`);
  }

  broadcast(data, channel = null) {
    const message = JSON.stringify({
      type: 'broadcast',
      data,
      timestamp: Date.now()
    });

    if (channel) {
      // Broadcast to channel subscribers
      const subscribers = this.channels.get(channel);
      if (subscribers) {
        subscribers.forEach(ws => {
          this.sendToClient(ws, { type: 'update', data, channel });
        });
      }
    } else {
      // Broadcast to all connected clients
      this.wss.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Specific event broadcasts
  broadcastAgentStatus(agentId, status) {
    this.broadcast({ agentId, status }, 'agents');
  }

  broadcastTaskUpdate(taskId, state) {
    this.broadcast({ taskId, state }, 'tasks');
  }

  broadcastNotification(title, message, channel = null) {
    const data = {
      type: 'notification',
      title,
      message,
      timestamp: Date.now()
    };
    
    if (channel) {
      this.broadcast(data, channel);
    } else {
      this.wss.clients.forEach(ws => {
        this.sendToClient(ws, data);
      });
    }
  }

  getStats() {
    return {
      clients: this.clients.size,
      channels: Array.from(this.channels.keys()).map(channel => ({
        name: channel,
        subscribers: this.channels.get(channel).size
      }))
    };
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = WebSocketServer;
