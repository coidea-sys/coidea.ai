import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';

export const useWebSocket = (userId, userType = 'human') => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [onlineAgents, setOnlineAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // 连接 WebSocket
  useEffect(() => {
    if (!userId) return;

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setConnected(true);
      
      // 登录
      socket.emit('user:login', {
        userId,
        type: userType,
        timestamp: Date.now()
      });
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    // 用户上线/离线
    socket.on('user:online', (data) => {
      setOnlineUsers(prev => [...prev.filter(u => u.id !== data.userId), data]);
    });

    socket.on('user:offline', (data) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== data.userId));
    });

    // Agent 状态变化
    socket.on('agent:statusChanged', (data) => {
      setOnlineAgents(prev => 
        prev.map(a => a.id === data.agentId ? { ...a, status: data.status } : a)
      );
    });

    // 新消息
    socket.on('task:newMessage', (data) => {
      setMessages(prev => [...prev, data]);
    });

    // 进度更新
    socket.on('task:progressUpdate', (data) => {
      setNotifications(prev => [{
        type: 'progress',
        ...data
      }, ...prev].slice(0, 50));
    });

    // Agent 消息
    socket.on('agent:directMessage', (data) => {
      setNotifications(prev => [{
        type: 'agent',
        ...data
      }, ...prev].slice(0, 50));
    });

    // 心跳
    const heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      socket.disconnect();
    };
  }, [userId, userType]);

  // 加入任务房间
  const joinTask = useCallback((taskId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('task:join', { taskId });
    }
  }, []);

  // 离开任务房间
  const leaveTask = useCallback((taskId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('task:leave', { taskId });
    }
  }, []);

  // 发送消息
  const sendMessage = useCallback((taskId, message, type = 'text') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('task:message', { taskId, message, type });
    }
  }, []);

  // 更新进度
  const updateProgress = useCallback((taskId, progress, status, details) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('task:progress', { taskId, progress, status, details });
    }
  }, []);

  // 共享文件
  const shareFile = useCallback((taskId, fileName, fileUrl, fileType) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('task:file', { taskId, fileName, fileUrl, fileType });
    }
  }, []);

  // 更新 Agent 状态
  const updateAgentStatus = useCallback((agentId, status) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('agent:status', { agentId, status });
    }
  }, []);

  // 发送 Agent 消息
  const sendAgentMessage = useCallback((toAgentId, message, context) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('agent:message', { toAgentId, message, context });
    }
  }, []);

  return {
    connected,
    onlineUsers,
    onlineAgents,
    messages,
    notifications,
    joinTask,
    leaveTask,
    sendMessage,
    updateProgress,
    shareFile,
    updateAgentStatus,
    sendAgentMessage,
    socket: socketRef.current
  };
};

export default useWebSocket;
