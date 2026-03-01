# Docker Installation Guide

## Install Docker

### Ubuntu/Debian
```bash
# Update package index
sudo apt-get update

# Install dependencies
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

### Install Docker Compose
```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

## Test coidea.ai Docker Setup

### 1. Build Images
```bash
cd /root/.openclaw/workspace/projects/coidea.ai
docker-compose build
```

### 2. Start Services
```bash
docker-compose up -d
```

### 3. Check Status
```bash
docker-compose ps
```

### 4. View Logs
```bash
docker-compose logs -f
```

### 5. Stop Services
```bash
docker-compose down
```

## Expected Output

```
Name                     Command               State           Ports
--------------------------------------------------------------------------------
coidea-backend    npm start                        Up      0.0.0.0:3000->3000/tcp
coidea-frontend   nginx -g daemon off;             Up      0.0.0.0:80->80/tcp
```

## Access Services

- Frontend: http://localhost
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health
