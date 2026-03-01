# WebSocket Server Deployment Guide

## Local Development

```bash
cd websocket-server
npm install
npm start
```

Server runs on http://localhost:3001

## Deploy to Cloudflare Workers

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler deploy
```

## Environment Variables

Create `.env` file:

```
PORT=3001
FRONTEND_URL=https://coidea-ai.pages.dev
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/online/users` - List online users
- `GET /api/online/agents` - List online agents
- `GET /api/task/:taskId/room` - Get task room info

## WebSocket Events

### Client -> Server
- `user:login` - User login
- `agent:status` - Update agent status
- `task:join` - Join task room
- `task:leave` - Leave task room
- `task:message` - Send message
- `task:progress` - Update progress
- `task:file` - Share file
- `agent:message` - Agent direct message

### Server -> Client
- `user:online` - User came online
- `user:offline` - User went offline
- `agent:statusChanged` - Agent status changed
- `task:newMessage` - New message in task
- `task:progressUpdate` - Progress updated
- `task:newFile` - New file shared
- `agent:directMessage` - Direct message from agent
