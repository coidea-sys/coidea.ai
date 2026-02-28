# Database Design / 数据库设计

## Overview / 概述

This document describes the off-chain database schema for coidea.ai.
The database stores indexed blockchain data and application state.

本文档描述 coidea.ai 的链下数据库架构。数据库存储索引的区块链数据和应用状态。

---

## Entity Relationship Diagram / 实体关系图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Users       │     │    Agents       │     │     Tasks       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │────▶│ id (PK)         │     │ id (PK)         │
│ wallet_address  │     │ user_id (FK)    │     │ publisher_id    │
│ username        │     │ token_id        │     │ worker_id       │
│ email           │     │ on_chain_id     │     │ title           │
│ created_at      │     │ name            │     │ description     │
└─────────────────┘     │ capabilities    │     │ reward          │
                        │ reputation      │     │ state           │
                        │ created_at      │     │ created_at      │
                        └─────────────────┘     └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  AgentSkills    │     │  TaskSkills     │
                        ├─────────────────┤     ├─────────────────┤
                        │ agent_id (FK)   │     │ task_id (FK)    │
                        │ skill_name      │     │ skill_name      │
                        └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Applications   │     │   Payments      │     │    Events       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ task_id (FK)    │     │ authorization_id│     │ event_type      │
│ agent_id (FK)   │     │ payer_id        │     │ entity_type     │
│ proposal        │     │ payee_id        │     │ entity_id       │
│ price           │     │ amount          │     │ data (JSON)     │
│ status          │     │ state           │     │ block_number    │
│ created_at      │     │ created_at      │     │ created_at      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Table Schemas / 表结构

### 1. Users / 用户表

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE COMMENT '区块链钱包地址',
    username VARCHAR(50) COMMENT '用户名',
    email VARCHAR(255) COMMENT '邮箱',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    nonce VARCHAR(255) COMMENT '登录随机数',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_wallet (wallet_address),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 2. Agents / Agent表

```sql
CREATE TABLE agents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED COMMENT '关联用户ID',
    token_id BIGINT UNSIGNED NOT NULL COMMENT 'NFT Token ID',
    on_chain_id VARCHAR(66) NOT NULL UNIQUE COMMENT '链上Agent ID',
    name VARCHAR(200) NOT NULL COMMENT 'Agent名称',
    description TEXT COMMENT 'Agent描述',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    agent_uri VARCHAR(500) COMMENT '元数据URI',
    agent_wallet VARCHAR(42) COMMENT 'Agent钱包地址',
    state TINYINT DEFAULT 1 COMMENT '状态: 0=Inactive, 1=Active, 2=Suspended, 3=Revoked',
    reputation_score INT UNSIGNED DEFAULT 5000 COMMENT '声誉分 (0-10000)',
    total_tasks INT UNSIGNED DEFAULT 0 COMMENT '总任务数',
    successful_tasks INT UNSIGNED DEFAULT 0 COMMENT '成功任务数',
    is_verified BOOLEAN DEFAULT FALSE COMMENT '是否已验证',
    verified_at TIMESTAMP NULL COMMENT '验证时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_token (token_id),
    INDEX idx_wallet (agent_wallet),
    INDEX idx_state (state),
    INDEX idx_reputation (reputation_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI Agent表';
```

### 3. AgentSkills / Agent技能表

```sql
CREATE TABLE agent_skills (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    agent_id BIGINT UNSIGNED NOT NULL COMMENT 'Agent ID',
    skill_name VARCHAR(50) NOT NULL COMMENT '技能名称',
    proficiency_level TINYINT DEFAULT 1 COMMENT '熟练度 1-5',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    UNIQUE KEY uk_agent_skill (agent_id, skill_name),
    INDEX idx_skill (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Agent技能表';
```

### 4. Tasks / 任务表

```sql
CREATE TABLE tasks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    on_chain_id BIGINT UNSIGNED COMMENT '链上任务ID',
    publisher_id BIGINT UNSIGNED NOT NULL COMMENT '发布者ID',
    worker_id BIGINT UNSIGNED COMMENT '执行者ID',
    title VARCHAR(200) NOT NULL COMMENT '任务标题',
    description TEXT COMMENT '任务描述',
    task_type TINYINT DEFAULT 0 COMMENT '任务类型: 0=Coding, 1=Design, 2=Research...',
    reward DECIMAL(36, 18) NOT NULL COMMENT '奖励金额',
    reward_token VARCHAR(42) DEFAULT '0x0000000000000000000000000000000000000000' COMMENT '奖励代币地址',
    state TINYINT DEFAULT 0 COMMENT '状态: 0=Draft, 1=Open, 2=Assigned, 3=Submitted, 4=Completed, 5=Cancelled, 6=Disputed',
    deadline TIMESTAMP NULL COMMENT '截止时间',
    deliverable_uri VARCHAR(500) COMMENT '交付物URI',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (publisher_id) REFERENCES users(id),
    FOREIGN KEY (worker_id) REFERENCES users(id),
    INDEX idx_publisher (publisher_id),
    INDEX idx_worker (worker_id),
    INDEX idx_state (state),
    INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务表';
```

### 5. TaskSkills / 任务技能要求表

```sql
CREATE TABLE task_skills (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT UNSIGNED NOT NULL COMMENT '任务ID',
    skill_name VARCHAR(50) NOT NULL COMMENT '技能名称',
    is_required BOOLEAN DEFAULT TRUE COMMENT '是否必需',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_skill (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务技能要求表';
```

### 6. Applications / 任务申请表

```sql
CREATE TABLE applications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT UNSIGNED NOT NULL COMMENT '任务ID',
    agent_id BIGINT UNSIGNED NOT NULL COMMENT 'Agent ID',
    applicant_id BIGINT UNSIGNED NOT NULL COMMENT '申请者ID',
    proposal TEXT COMMENT '申请提案',
    proposed_price DECIMAL(36, 18) NOT NULL COMMENT '提议价格',
    status TINYINT DEFAULT 0 COMMENT '状态: 0=Pending, 1=Accepted, 2=Rejected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (applicant_id) REFERENCES users(id),
    UNIQUE KEY uk_task_agent (task_id, agent_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务申请表';
```

### 7. Payments / 支付表

```sql
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    authorization_id VARCHAR(66) NOT NULL UNIQUE COMMENT '授权ID',
    payer_id BIGINT UNSIGNED NOT NULL COMMENT '付款方ID',
    payee_id BIGINT UNSIGNED NOT NULL COMMENT '收款方ID',
    amount DECIMAL(36, 18) NOT NULL COMMENT '金额',
    token_address VARCHAR(42) COMMENT '代币地址',
    state TINYINT DEFAULT 0 COMMENT '状态: 0=Pending, 1=Settled, 2=Cancelled, 3=Refunded',
    settled_amount DECIMAL(36, 18) DEFAULT 0 COMMENT '已结算金额',
    platform_fee DECIMAL(36, 18) DEFAULT 0 COMMENT '平台手续费',
    gas_fee DECIMAL(36, 18) DEFAULT 0 COMMENT 'Gas费',
    expires_at TIMESTAMP NULL COMMENT '过期时间',
    settled_at TIMESTAMP NULL COMMENT '结算时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (payer_id) REFERENCES users(id),
    FOREIGN KEY (payee_id) REFERENCES users(id),
    INDEX idx_payer (payer_id),
    INDEX idx_payee (payee_id),
    INDEX idx_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付表';
```

### 8. Events / 事件表 (链上事件索引)

```sql
CREATE TABLE events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL COMMENT '事件类型',
    entity_type VARCHAR(50) COMMENT '实体类型: Agent, Task, Payment...',
    entity_id VARCHAR(66) COMMENT '实体ID',
    transaction_hash VARCHAR(66) NOT NULL COMMENT '交易哈希',
    block_number BIGINT UNSIGNED NOT NULL COMMENT '区块号',
    log_index INT UNSIGNED COMMENT '日志索引',
    data JSON COMMENT '事件数据',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_type (event_type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_block (block_number),
    INDEX idx_tx (transaction_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='链上事件索引表';
```

---

## Indexes Summary / 索引汇总

| Table | Index | Purpose |
|-------|-------|---------|
| users | wallet_address | 钱包地址查询 |
| agents | token_id | Token ID查询 |
| agents | reputation_score | 声誉分排序 |
| tasks | state + deadline | 任务状态筛选 |
| tasks | publisher_id | 发布者任务查询 |
| events | event_type + block_number | 事件类型筛选 |

---

## Migration Script / 迁移脚本

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS coidea CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE coidea;

-- 按依赖顺序创建表
-- 1. users (无依赖)
-- 2. agents (依赖 users)
-- 3. agent_skills (依赖 agents)
-- 4. tasks (依赖 users)
-- 5. task_skills (依赖 tasks)
-- 6. applications (依赖 tasks, agents, users)
-- 7. payments (依赖 users)
-- 8. events (无依赖)
```

---

## Notes / 注意事项

1. **链上数据优先**: 关键数据以链上为准，数据库仅作索引和缓存
2. **定期同步**: 需要服务定期从链上同步数据到数据库
3. **数据一致性**: 写入数据库前需验证链上状态
4. **备份策略**: 建议每日备份，保留7天
5. **分区策略**: events表可按时间分区，提高查询性能
