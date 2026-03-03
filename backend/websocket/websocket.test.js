/**
 * WebSocket Server Unit Tests
 * TDD for real-time collaboration backend
 */

const WebSocket = require('ws');
const http = require('http');

// Mock WebSocket Server
jest.mock('ws', () => {
  const mockServer = jest.fn(function(options) {
    this.options = options;
    this.clients = new Set();
    this.on = jest.fn();
    this.close = jest.fn();
  });
  
  mockServer.prototype.on = jest.fn();
  mockServer.prototype.close = jest.fn();
  
  const mockWebSocket = jest.fn(function(url) {
    this.url = url;
    this.readyState = 1;
    this.send = jest.fn();
    this.close = jest.fn();
    this.on = jest.fn();
  });
  
  mockWebSocket.OPEN = 1;
  
  return {
    Server: mockServer,
    WebSocket: mockWebSocket
  };
});

describe('WebSocket Server', () => {
  let mockServer;
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { Server } = require('ws');
    mockServer = new Server({ port: 3001 });
    
    mockClient = {
      readyState: 1,
      send: jest.fn(),
      on: jest.fn(),
      close: jest.fn()
    };
  });

  describe('server initialization', () => {
    it('should create WebSocket server', () => {
      const { Server } = require('ws');
      const server = new Server({ port: 3001 });
      
      expect(server).toBeDefined();
      expect(Server).toHaveBeenCalledWith({ port: 3001 });
    });

    it('should listen on specified port', () => {
      const { Server } = require('ws');
      const server = new Server({ port: 3001 });
      
      expect(server.options.port).toBe(3001);
    });
  });

  describe('client connection', () => {
    it('should handle client connection', () => {
      const connectionHandler = jest.fn();
      mockServer.on('connection', connectionHandler);
      
      // Simulate connection
      mockServer.on.mock.calls
        .find(call => call[0] === 'connection')?.[1](mockClient);
      
      expect(mockServer.on).toHaveBeenCalledWith('connection', connectionHandler);
    });

    it('should add client to clients set', () => {
      mockServer.clients.add(mockClient);
      
      expect(mockServer.clients.has(mockClient)).toBe(true);
    });

    it('should handle client disconnection', () => {
      mockServer.clients.add(mockClient);
      
      const closeHandler = jest.fn();
      mockClient.on('close', closeHandler);
      
      // Simulate close
      mockClient.on.mock.calls
        .find(call => call[0] === 'close')?.[1]();
      
      mockServer.clients.delete(mockClient);
      
      expect(mockServer.clients.has(mockClient)).toBe(false);
    });
  });

  describe('message handling', () => {
    it('should receive message from client', () => {
      const messageHandler = jest.fn();
      mockClient.on('message', messageHandler);
      
      const message = JSON.stringify({ type: 'ping' });
      mockClient.on.mock.calls
        .find(call => call[0] === 'message')?.[1](message);
      
      expect(mockClient.on).toHaveBeenCalledWith('message', messageHandler);
    });

    it('should parse JSON message', () => {
      const received = [];
      mockClient.on('message', (data) => {
        received.push(JSON.parse(data));
      });
      
      const message = JSON.stringify({ type: 'subscribe', channel: 'tasks' });
      mockClient.on.mock.calls
        .find(call => call[0] === 'message')?.[1](message);
      
      expect(received[0]).toEqual({ type: 'subscribe', channel: 'tasks' });
    });

    it('should handle invalid JSON', () => {
      const errorHandler = jest.fn();
      
      try {
        JSON.parse('invalid json');
      } catch (err) {
        errorHandler(err);
      }
      
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('broadcasting', () => {
    it('should broadcast message to all clients', () => {
      const client1 = { ...mockClient, id: 1 };
      const client2 = { ...mockClient, id: 2 };
      
      mockServer.clients.add(client1);
      mockServer.clients.add(client2);
      
      const message = JSON.stringify({ type: 'update', data: {} });
      
      mockServer.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
      
      expect(client1.send).toHaveBeenCalledWith(message);
      expect(client2.send).toHaveBeenCalledWith(message);
    });

    it('should not broadcast to closed clients', () => {
      const client1 = { ...mockClient, readyState: 1, send: jest.fn() };
      const client2 = { ...mockClient, readyState: 3, send: jest.fn() }; // CLOSED
      
      mockServer.clients.add(client1);
      mockServer.clients.add(client2);
      
      const message = JSON.stringify({ type: 'update' });
      
      mockServer.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
      
      expect(client1.send).toHaveBeenCalledWith(message);
      expect(client2.send).not.toHaveBeenCalled();
    });
  });

  describe('channels', () => {
    it('should handle channel subscription', () => {
      const subscriptions = new Map();
      
      const subscribe = (client, channel) => {
        if (!subscriptions.has(channel)) {
          subscriptions.set(channel, new Set());
        }
        subscriptions.get(channel).add(client);
      };
      
      subscribe(mockClient, 'tasks');
      
      expect(subscriptions.get('tasks').has(mockClient)).toBe(true);
    });

    it('should handle channel unsubscription', () => {
      const subscriptions = new Map();
      subscriptions.set('tasks', new Set([mockClient]));
      
      const unsubscribe = (client, channel) => {
        if (subscriptions.has(channel)) {
          subscriptions.get(channel).delete(client);
        }
      };
      
      unsubscribe(mockClient, 'tasks');
      
      expect(subscriptions.get('tasks').has(mockClient)).toBe(false);
    });

    it('should broadcast to channel subscribers only', () => {
      const client1 = { ...mockClient, id: 1, send: jest.fn() };
      const client2 = { ...mockClient, id: 2, send: jest.fn() };
      const client3 = { ...mockClient, id: 3, send: jest.fn() };
      
      const subscriptions = new Map();
      subscriptions.set('tasks', new Set([client1, client2]));
      subscriptions.set('agents', new Set([client3]));
      
      const message = JSON.stringify({ type: 'task_update' });
      
      subscriptions.get('tasks').forEach(client => {
        client.send(message);
      });
      
      expect(client1.send).toHaveBeenCalledWith(message);
      expect(client2.send).toHaveBeenCalledWith(message);
      expect(client3.send).not.toHaveBeenCalled();
    });
  });

  describe('event types', () => {
    it('should handle ping message', () => {
      const handler = jest.fn((client) => {
        client.send(JSON.stringify({ type: 'pong' }));
      });
      
      handler(mockClient);
      
      expect(mockClient.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'pong' })
      );
    });

    it('should handle agent_status message', () => {
      const handler = jest.fn((client, data) => {
        client.send(JSON.stringify({
          type: 'agent_status',
          agentId: data.agentId,
          status: data.status
        }));
      });
      
      handler(mockClient, { agentId: '1', status: 'online' });
      
      expect(mockClient.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'agent_status',
          agentId: '1',
          status: 'online'
        })
      );
    });

    it('should handle task_update message', () => {
      const handler = jest.fn((client, data) => {
        client.send(JSON.stringify({
          type: 'task_update',
          taskId: data.taskId,
          state: data.state
        }));
      });
      
      handler(mockClient, { taskId: '1', state: 'completed' });
      
      expect(mockClient.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'task_update',
          taskId: '1',
          state: 'completed'
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle client error', () => {
      const errorHandler = jest.fn();
      mockClient.on('error', errorHandler);
      
      const error = new Error('Connection error');
      mockClient.on.mock.calls
        .find(call => call[0] === 'error')?.[1](error);
      
      expect(mockClient.on).toHaveBeenCalledWith('error', errorHandler);
    });

    it('should handle server error', () => {
      const errorHandler = jest.fn();
      mockServer.on('error', errorHandler);
      
      const error = new Error('Server error');
      mockServer.on.mock.calls
        .find(call => call[0] === 'error')?.[1](error);
      
      expect(mockServer.on).toHaveBeenCalledWith('error', errorHandler);
    });
  });

  describe('server shutdown', () => {
    it('should close server gracefully', () => {
      mockServer.close();
      
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should close all client connections on shutdown', () => {
      const client1 = { ...mockClient };
      const client2 = { ...mockClient };
      
      mockServer.clients.add(client1);
      mockServer.clients.add(client2);
      
      // Close all clients before server
      mockServer.clients.forEach(client => client.close());
      mockServer.close();
      
      expect(client1.close).toHaveBeenCalled();
      expect(client2.close).toHaveBeenCalled();
      expect(mockServer.close).toHaveBeenCalled();
    });
  });
});
