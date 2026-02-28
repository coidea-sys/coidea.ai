/**
 * coidea.ai 记忆系统核心实现
 * 
 * 提供分层记忆存储、检索和管理功能
 */

const fs = require('fs').promises;
const path = require('path');

// 记忆层级定义
const MEMORY_LAYERS = {
  WORKING: 'working',      // 工作记忆 - 会话级
  SHORT_TERM: 'short_term', // 短期记忆 - 24-48小时
  LONG_TERM: 'long_term',   // 长期记忆 - 永久
  CORE: 'core'             // 核心记忆 - 身份/价值观
};

// 记忆类型定义
const MEMORY_TYPES = {
  EPISODIC: 'episodic',     // 事件记忆
  SEMANTIC: 'semantic',     // 语义记忆
  PROCEDURAL: 'procedural', // 程序记忆
  RELATIONAL: 'relational'  // 关系记忆
};

class MemorySystem {
  constructor(basePath = '/root/.openclaw/workspace') {
    this.basePath = basePath;
    this.memoryDir = path.join(basePath, 'memory');
    this.projectMemoryDir = path.join(basePath, 'projects', 'coidea.ai', 'memory');
    
    // 工作记忆（内存中）
    this.workingMemory = {
      sessionContext: [],
      recentConversations: [],
      tempCalculations: {}
    };
  }

  /**
   * 初始化记忆系统
   */
  async initialize() {
    try {
      await fs.mkdir(this.memoryDir, { recursive: true });
      await fs.mkdir(this.projectMemoryDir, { recursive: true });
      console.log('✓ Memory system initialized');
    } catch (error) {
      console.error('Failed to initialize memory system:', error);
      throw error;
    }
  }

  /**
   * 计算事件重要性
   */
  calculateImportance(event) {
    let score = 0;
    
    // 决策权重
    if (event.containsDecision) score += 3;
    
    // 情感强度 (0-1 映射到 0-2)
    if (event.emotionalValence) {
      score += Math.abs(event.emotionalValence) * 2;
    }
    
    // 关系影响
    if (event.affectsRelationships) score += 2;
    
    // 项目相关性
    if (event.projectRelated) score += 2;
    
    // 新颖性
    if (event.isNovel) score += 1;
    
    // 里程碑标记
    if (event.isMilestone) score += 3;
    
    return Math.min(Math.round(score), 10);
  }

  /**
   * 写入记忆
   */
  async write(memory) {
    const importance = memory.importance || this.calculateImportance(memory);
    memory.importance = importance;
    memory.timestamp = memory.timestamp || new Date().toISOString();
    memory.memoryId = memory.memoryId || this.generateMemoryId();

    // 根据重要性决定存储层级
    if (importance >= 9) {
      // 核心记忆 - 写入 MEMORY.md
      await this.writeToCoreMemory(memory);
    } else if (importance >= 7) {
      // 长期记忆 - 写入项目记忆
      await this.writeToLongTermMemory(memory);
    } else if (importance >= 4) {
      // 短期记忆 - 写入每日记忆
      await this.writeToShortTermMemory(memory);
    }
    // 重要性 < 4 的只保留在工作记忆中

    return memory.memoryId;
  }

  /**
   * 写入短期记忆（每日文件）
   */
  async writeToShortTermMemory(memory) {
    const today = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.memoryDir, `${today}.md`);
    
    const entry = this.formatMemoryEntry(memory);
    
    try {
      let content = '';
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (e) {
        // 文件不存在，创建新文件
        content = `# ${today}\n\n## Summary\n\n`;
      }
      
      content += entry;
      await fs.writeFile(filePath, content);
    } catch (error) {
      console.error('Failed to write short-term memory:', error);
    }
  }

  /**
   * 写入长期记忆
   */
  async writeToLongTermMemory(memory) {
    // 确保目录存在
    await fs.mkdir(this.projectMemoryDir, { recursive: true });
    
    const filePath = path.join(this.projectMemoryDir, 'milestones.md');
    const entry = this.formatMemoryEntry(memory);
    
    try {
      let content = '';
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (e) {
        content = '# Project Milestones\n\n';
      }
      
      content += entry;
      await fs.writeFile(filePath, content);
    } catch (error) {
      console.error('Failed to write long-term memory:', error);
    }
  }

  /**
   * 写入核心记忆
   */
  async writeToCoreMemory(memory) {
    // 核心记忆需要人工审核，先写入待审核队列
    const filePath = path.join(this.projectMemoryDir, 'core_pending.md');
    const entry = this.formatMemoryEntry(memory);
    
    try {
      let content = '';
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (e) {
        content = '# Pending Core Memories\n\n';
      }
      
      content += entry;
      await fs.writeFile(filePath, content);
    } catch (error) {
      console.error('Failed to write core memory:', error);
    }
  }

  /**
   * 格式化记忆条目
   */
  formatMemoryEntry(memory) {
    const tags = memory.tags ? memory.tags.map(t => `#${t}`).join(' ') : '';
    
    return `
### ${memory.timestamp}
**Type**: ${memory.type} | **Importance**: ${memory.importance}/10

${memory.content}

${tags}

---
`;
  }

  /**
   * 生成记忆 ID
   */
  generateMemoryId() {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6);
    return `mem_${date}_${random}`;
  }

  /**
   * 语义搜索
   */
  async search(query, options = {}) {
    const { 
      layer = 'all', 
      limit = 10,
      startDate,
      endDate 
    } = options;
    
    const results = [];
    
    // 搜索短期记忆
    if (layer === 'all' || layer === 'short_term') {
      const shortTermResults = await this.searchShortTermMemory(query, { startDate, endDate });
      results.push(...shortTermResults);
    }
    
    // 搜索长期记忆
    if (layer === 'all' || layer === 'long_term') {
      const longTermResults = await this.searchLongTermMemory(query);
      results.push(...longTermResults);
    }
    
    // 按相关性排序并限制数量
    return results
      .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
      .slice(0, limit);
  }

  /**
   * 搜索短期记忆
   */
  async searchShortTermMemory(query, options = {}) {
    const results = [];
    const files = await fs.readdir(this.memoryDir);
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      const fileDate = file.replace('.md', '');
      if (options.startDate && fileDate < options.startDate) continue;
      if (options.endDate && fileDate > options.endDate) continue;
      
      try {
        const content = await fs.readFile(path.join(this.memoryDir, file), 'utf-8');
        const relevance = this.calculateRelevance(content, query);
        
        if (relevance > 0) {
          results.push({
            source: file,
            content: content.substring(0, 500),
            relevance,
            layer: 'short_term'
          });
        }
      } catch (e) {
        // 忽略读取错误
      }
    }
    
    return results;
  }

  /**
   * 搜索长期记忆
   */
  async searchLongTermMemory(query) {
    const results = [];
    
    try {
      const files = await fs.readdir(this.projectMemoryDir);
      
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        
        const content = await fs.readFile(
          path.join(this.projectMemoryDir, file), 
          'utf-8'
        );
        const relevance = this.calculateRelevance(content, query);
        
        if (relevance > 0) {
          results.push({
            source: file,
            content: content.substring(0, 500),
            relevance,
            layer: 'long_term'
          });
        }
      }
    } catch (e) {
      // 目录可能不存在
    }
    
    return results;
  }

  /**
   * 计算相关性（简单版本）
   */
  calculateRelevance(content, query) {
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    let matches = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }

  /**
   * 生成每日摘要
   */
  async generateDailyDigest(date = new Date().toISOString().split('T')[0]) {
    const filePath = path.join(this.memoryDir, `${date}.md`);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // 解析内容，提取关键信息
      const milestones = [];
      const decisions = [];
      const tasks = [];
      
      // 简单的模式匹配
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.includes('确定') || line.includes('决定') || line.includes('采用')) {
          decisions.push(line.trim());
        }
        if (line.includes('完成') || line.includes('实现') || line.includes('启动')) {
          milestones.push(line.trim());
        }
        if (line.includes('[') && line.includes(']')) {
          tasks.push(line.trim());
        }
      }
      
      return {
        date,
        milestones: [...new Set(milestones)].slice(0, 5),
        decisions: [...new Set(decisions)].slice(0, 5),
        tasks: [...new Set(tasks)].slice(0, 10),
        rawContent: content
      };
    } catch (e) {
      return { date, milestones: [], decisions: [], tasks: [], rawContent: '' };
    }
  }

  /**
   * 更新工作记忆
   */
  updateWorkingMemory(key, value) {
    this.workingMemory[key] = value;
  }

  /**
   * 获取工作记忆
   */
  getWorkingMemory(key) {
    return key ? this.workingMemory[key] : this.workingMemory;
  }

  /**
   * 添加到会话上下文
   */
  addToSessionContext(message) {
    this.workingMemory.sessionContext.push({
      timestamp: new Date().toISOString(),
      content: message
    });
    
    // 只保留最近 20 条
    if (this.workingMemory.sessionContext.length > 20) {
      this.workingMemory.sessionContext.shift();
    }
  }
}

module.exports = { MemorySystem, MEMORY_LAYERS, MEMORY_TYPES };
