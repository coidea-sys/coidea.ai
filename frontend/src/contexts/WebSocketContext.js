import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const WebSocketContext = createContext(null);

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';

export const WebSocketProvider = ({ children, userId, userType = 'human' }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [onlineAgents, setOnlineAgents] = useState(new Map());

  useEffect(() => {
    if (!userId) {
      setConnected(false);
      return;
    }

    const newSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setConnected(true);
      newSocket.emit('user:login', { userId, type: userType });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('user:online', (data) => {
      setOnlineUsers(prev => new Map(prev).set(data.userId, data));
    });

    newSocket.on('user:offline', (data) => {
      setOnlineUsers(prev => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    newSocket.on('agent:statusChanged', (data) => {
      setOnlineAgents(prev => new Map(prev).set(data.agentId, { status: data.status }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId, userType]);

  const value = {
    socket,
    connected,
    onlineUsers,
    onlineAgents,
    onlineUsersCount: onlineUsers.size,
    onlineAgentsCount: onlineAgents.size
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
