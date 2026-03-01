# Docker Deployment Guide

## Quick Start

### 1. Build and Run

```bash
# Build all services
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Access Services

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health

### 3. Stop Services

```bash
docker-compose down
```

## Development Mode

```bash
# Start only backend
docker-compose up backend

# Start only frontend
docker-compose up frontend

# Rebuild after code changes
docker-compose up --build
```

## Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml coidea

# Check services
docker stack ps coidea
```

### Environment Variables

Create `.env` file:

```
# Backend
NODE_ENV=production
PORT=3000

# Database (optional)
DB_HOST=mysql
DB_PORT=3306
DB_NAME=coidea
DB_USER=root
DB_PASSWORD=yourpassword

# Blockchain
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
AI_AGENT_REGISTRY_ADDRESS=0x...
HUMAN_LEVEL_NFT_ADDRESS=0x...
TASK_REGISTRY_ADDRESS=0x...
X402_PAYMENT_ADDRESS=0x...
```

## Troubleshooting

### Port Already in Use

```bash
# Check port usage
sudo lsof -i :3000
sudo lsof -i :80

# Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Rebuild from Scratch

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### View Container Logs

```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# All logs
docker-compose logs -f
```

## Advanced Usage

### Scale Backend

```bash
docker-compose up --scale backend=3
```

### Custom Network

```bash
docker network create coidea-network
docker-compose up -d
```

### Backup Data

```bash
# Backup (if using volumes)
docker run --rm -v coidea_mysql-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data
```
