# Cloudflare 发布流程

## 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Cloudflare Pages** | 免费、CDN、自动部署 | 仅静态网站 | 前端展示 |
| **Cloudflare Workers** | 边缘计算、低延迟 | 有请求限制 | API/后端逻辑 |
| **Cloudflare Pages + Functions** | 静态+动态结合 | 函数有冷启动 | 全栈应用 |

## 推荐方案：Pages + Functions

最适合 coidea.ai 的架构。

---

## 发布步骤

### 1. 准备工作

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

### 2. 前端配置

创建 `wrangler.toml`:

```toml
name = "coidea-ai"
main = "functions/[[path]].js"
compatibility_date = "2024-01-01"

[site]
bucket = "./frontend/build"

[build]
command = "npm run build"

[[kv_namespaces]]
binding = "COIDEA_KV"
id = "your-kv-namespace-id"
```

### 3. 后端迁移到 Workers

创建 `functions/api/[[path]].js`:

```javascript
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // API 路由
  if (url.pathname.startsWith('/api/agents')) {
    return handleAgents(request, env);
  }
  
  if (url.pathname.startsWith('/api/tasks')) {
    return handleTasks(request, env);
  }
  
  return new Response('Not Found', { status: 404 });
}

async function handleAgents(request, env) {
  // 从 Cloudflare KV 或 D1 数据库读取
  const agents = await env.COIDEA_KV.get('agents', { type: 'json' }) || [];
  
  return new Response(JSON.stringify({ success: true, agents }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 4. 数据库选择

#### 选项 A: Cloudflare KV (简单键值)
```javascript
// 存储
await env.COIDEA_KV.put('agent:0', JSON.stringify(agentData));

// 读取
const agent = await env.COIDEA_KV.get('agent:0', { type: 'json' });
```

#### 选项 B: Cloudflare D1 (SQL 数据库)
```sql
-- 创建表
CREATE TABLE agents (
  id INTEGER PRIMARY KEY,
  name TEXT,
  wallet TEXT,
  reputation INTEGER
);
```

```javascript
// 查询
const { results } = await env.DB.prepare(
  'SELECT * FROM agents WHERE state = ?'
).bind(1).all();
```

#### 选项 C: 混合方案 (推荐)
- **D1**: 存储结构化数据（Agents, Tasks, Users）
- **KV**: 缓存、会话、配置

### 5. 区块链交互

Workers 中调用区块链需要:

```javascript
// 使用 ethers.js 的轻量版本
import { ethers } from 'ethers';

// 连接到 Polygon RPC
const provider = new ethers.JsonRpcProvider('https://rpc-amoy.polygon.technology');

// 读取合约数据（无需私钥）
const contract = new ethers.Contract(address, abi, provider);
const agent = await contract.getAgent(0);
```

### 6. 部署

```bash
# 开发模式预览
wrangler pages dev

# 部署到生产
wrangler pages deploy

# 或配置 Git 自动部署
# GitHub → Cloudflare Pages (自动)
```

---

## 架构图

```
┌─────────────────────────────────────────┐
│         Cloudflare Edge Network         │
│  ┌─────────────┐    ┌─────────────┐    │
│  │   Pages     │◄───│  Functions  │    │
│  │  (Frontend) │    │   (API)     │    │
│  └─────────────┘    └──────┬──────┘    │
│                            │           │
│                     ┌──────┴──────┐    │
│                     │  D1 / KV    │    │
│                     │  (Database) │    │
│                     └─────────────┘    │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│      Polygon Amoy Testnet               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Registry│ │  Tasks  │ │ Payments│  │
│  └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────┘
```

---

## 成本估算

| 服务 | 免费额度 | 超出费用 |
|------|----------|----------|
| Pages | 无限请求 | $0 |
| Workers | 100k/天 | $0.50/百万请求 |
| KV | 1GB 存储 | $0.50/GB/月 |
| D1 | 5GB 存储 | $5/月 |

**预计月费**: $0-5 (MVP 阶段完全免费)

---

## 实施计划

### Phase 1: 静态前端 (1天)
- [ ] 配置 wrangler.toml
- [ ] 部署 Pages
- [ ] 配置自定义域名

### Phase 2: API 迁移 (2天)
- [ ] 创建 D1 数据库
- [ ] 迁移后端逻辑到 Workers
- [ ] 测试 API 端点

### Phase 3: 区块链集成 (1天)
- [ ] 配置 RPC 调用
- [ ] 实现合约读取
- [ ] 测试完整流程

---

## 优势

1. **全球 CDN**: 用户就近访问，延迟低
2. **免费额度**: MVP 阶段零成本
3. **自动扩展**: 无需担心流量峰值
4. **Git 集成**: 推送即部署
5. **边缘计算**: API 响应快

---

## 风险

1. **Workers 限制**: 单次请求 50ms CPU 时间
2. **冷启动**: 函数首次调用有延迟
3. **生态较新**: D1 功能还在完善中
