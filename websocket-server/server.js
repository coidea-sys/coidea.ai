const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 在线用户管理
const onlineUsers = new Map(); // userId -> { socketId, address, type: 'human'|'agent' }
const onlineAgents = new Map(); // agentId -> { socketId, status: 'idle'|'busy'|'offline' }

// 房间管理 (任务协作空间)
const taskRooms = new Map(); // taskId -> Set of userIds

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // 用户登录
  socket.on('user:login', (data) => {
    const { userId, address, type = 'human' } = data;
    onlineUsers.set(userId, {
      socketId: socket.id,
      address,
      type,
      lastSeen: Date.now()
    });
    socket.userId = userId;
    console.log(`User ${userId} logged in`);
    
    // 广播用户上线
    socket.broadcast.emit('user:online', { userId, type });
  });

  // Agent 状态更新
  socket.on('agent:status', (data) => {
    const { agentId, status } = data;
    if (socket.userId === agentId) {
      onlineAgents.set(agentId, {
        socketId: socket.id,
        status, // 'idle' | 'busy' | 'offline'
        lastUpdate: Date.now()
      });
      
      // 广播 Agent 状态变化
      io.emit('agent:statusChanged', { agentId, status });
    }
  });

  // 加入任务房间
  socket.on('task:join', (data) => {
    const { taskId } = data;
    socket.join(`task:${taskId}`);
    
    if (!taskRooms.has(taskId)) {
      taskRooms.set(taskId, new Set());
    }
    taskRooms.get(taskId).add(socket.userId);
    
    // 通知房间内其他用户
    socket.to(`task:${taskId}`).emit('task:userJoined', {
      taskId,
      userId: socket.userId,
      timestamp: Date.now()
    });
    
    console.log(`User ${socket.userId} joined task ${taskId}`);
  });

  // 离开任务房间
  socket.on('task:leave', (data) => {
    const { taskId } = data;
    socket.leave(`task:${taskId}`);
    
    if (taskRooms.has(taskId)) {
      taskRooms.get(taskId).delete(socket.userId);
    }
    
    socket.to(`task:${taskId}`).emit('task:userLeft', {
      taskId,
      userId: socket.userId,
      timestamp: Date.now()
    });
  });

  // 任务消息
  socket.on('task:message', (data) => {
    const { taskId, message, type = 'text' } = data;
    
    const messageData = {
      id: Date.now().toString(),
      taskId,
      userId: socket.userId,
      message,
      type,
      timestamp: Date.now()
    };
    
    // 广播给房间内所有人
    io.to(`task:${taskId}`).emit('task:newMessage', messageData);
  });

  // 工作进度更新
  socket.on('task:progress', (data) => {
    const { taskId, progress, status, details } = data;
    
    io.to(`task:${taskId}`).emit('task:progressUpdate', {
      taskId,
      userId: socket.userId,
      progress,
      status,
      details,
      timestamp: Date.now()
    });
  });

  // 文件共享
  socket.on('task:file', (data) => {
    const { taskId, fileName, fileUrl, fileType } = data;
    
    io.to(`task:${taskId}`).emit('task:newFile', {
      taskId,
      userId: socket.userId,
      fileName,
      fileUrl,
      fileType,
      timestamp: Date.now()
    });
  });

  // Agent 间通信
  socket.on('agent:message', (data) => {
    const { toAgentId, message, context } = data;
    const targetAgent = onlineAgents.get(toAgentId);
    
    if (targetAgent) {
      io.to(targetAgent.socketId).emit('agent:directMessage', {
        fromAgentId: socket.userId,
        message,
        context,
        timestamp: Date.now()
      });
    }
  });

  // 心跳
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
    
    if (socket.userId && onlineUsers.has(socket.userId)) {
      onlineUsers.get(socket.userId).lastSeen = Date.now();
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      onlineAgents.delete(socket.userId);
      
      // 广播用户离线
      socket.broadcast.emit('user:offline', { userId: socket.userId });
      
      // 离开所有任务房间
      taskRooms.forEach((users, taskId) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          socket.to(`task:${taskId}`).emit('task:userLeft', {
            taskId,
            userId: socket.userId,
            timestamp: Date.now()
          });
        }
      });
    }
  });
});

// REST API 端点

// 获取在线用户
app.get('/api/online/users', (req, res) => {
  const users = Array.from(onlineUsers.entries()).map(([id, data]) => ({
    id,
    ...data
  }));
  res.json({ count: users.length, users });
});

// 获取在线 Agents
app.get('/api/online/agents', (req, res) => {
  const agents = Array.from(onlineAgents.entries()).map(([id, data]) => ({
    id,
    ...data
  }));
  res.json({ count: agents.length, agents });
});

// 获取任务房间信息
app.get('/api/task/:taskId/room', (req, res) => {
  const { taskId } = req.params;
  const users = taskRooms.has(taskId) 
    ? Array.from(taskRooms.get(taskId))
    : [];
  res.json({ taskId, userCount: users.length, users });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    onlineUsers: onlineUsers.size,
    onlineAgents: onlineAgents.size,
    activeRooms: taskRooms.size
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
