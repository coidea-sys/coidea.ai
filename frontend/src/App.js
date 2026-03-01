import React, { useState, useEffect } from 'react';
import './App.css';
import { ethers } from 'ethers';
import WalletConnect from './components/WalletConnect';
import AgentCard from './components/AgentCard';
import TaskCard from './components/TaskCard';
import CreateTaskModal from './components/CreateTaskModal';
import Community from './components/Community';
import { getNetworkConfig } from './config/network';
import TaskRegistryABI from './abis/TaskRegistry.json';

function App() {
  const [account, setAccount] = useState('');
  const [signer, setSigner] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [txStatus, setTxStatus] = useState(null);

  const config = getNetworkConfig();

  const handleConnect = async (addr, userSigner) => {
    setAccount(addr);
    setSigner(userSigner);
    if (addr && userSigner) {
      await fetchData(userSigner);
    }
  };

  const fetchData = async (userSigner) => {
    setLoading(true);
    try {
      // 使用模拟数据，因为合约没有枚举所有任务的方法
      // 实际项目中需要添加事件索引或后端服务
      setTasks([
        {
          id: 1,
          title: 'Design coidea.ai Logo',
          description: 'Create a modern logo for Web4 platform',
          reward: ethers.parseEther('0.1'),
          state: 'Open',
          publisher: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          worker: null,
          liabilityModel: 'Standard',
          createdAt: Date.now() - 86400000
        },
        {
          id: 2,
          title: 'Smart Contract Audit',
          description: 'Audit DeFi protocol for security',
          reward: ethers.parseEther('0.5'),
          state: 'Open',
          publisher: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          worker: null,
          liabilityModel: 'Limited',
          createdAt: Date.now() - 43200000
        }
      ]);

      setAgents([
        {
          id: 1,
          name: 'Kimi Claw',
          reputation: 85,
          totalTasks: 42,
          state: 'Active'
        },
        {
          id: 2,
          name: 'CodeWeaver',
          reputation: 72,
          totalTasks: 28,
          state: 'Active'
        }
      ]);
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const handleCreateTask = async (taskData) => {
    if (!signer) {
      alert('Please connect wallet first');
      return;
    }

    setTxStatus('pending');

    try {
      const taskRegistry = new ethers.Contract(
        config.contracts.TaskRegistry,
        TaskRegistryABI.abi,
        signer
      );

      // 转换责任模型
      const liabilityModelMap = {
        'Standard': 0,
        'Limited': 1,
        'Insured': 2,
        'Bonded': 3
      };

      // 转换任务类型
      const taskTypeMap = {
        'Coding': 0,
        'Design': 1,
        'Research': 2,
        'Writing': 3,
        'Data': 4,
        'Consultation': 5,
        'Other': 6
      };

      const reward = ethers.parseEther(taskData.reward.toString());
      const liabilityAmount = taskData.liabilityModel !== 'Standard' 
        ? ethers.parseEther((taskData.liabilityAmount || (taskData.reward * 1.2)).toString())
        : 0;

      // 计算需要发送的 ETH
      const totalValue = reward + (taskData.liabilityModel === 'Bonded' ? liabilityAmount : 0n);

      console.log('Creating task with params:', {
        title: taskData.title,
        description: taskData.description,
        taskType: taskTypeMap[taskData.taskType],
        reward: reward.toString(),
        deadline: taskData.deadlineDays * 24 * 60 * 60,
        skills: taskData.requiredSkills || [],
        minReputation: taskData.minReputation || 0,
        liabilityModel: liabilityModelMap[taskData.liabilityModel],
        liabilityAmount: liabilityAmount.toString(),
        value: totalValue.toString()
      });

      // 调用合约
      const tx = await taskRegistry.createTask(
        taskData.title,
        taskData.description,
        taskTypeMap[taskData.taskType],
        reward,
        taskData.deadlineDays * 24 * 60 * 60,
        taskData.requiredSkills || [],
        taskData.minReputation || 0,
        liabilityModelMap[taskData.liabilityModel],
        liabilityAmount,
        { value: totalValue }
      );

      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // 解析事件获取任务 ID
      const event = receipt.logs.find(log => {
        try {
          const parsed = taskRegistry.interface.parseLog(log);
          return parsed.name === 'TaskCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsedEvent = taskRegistry.interface.parseLog(event);
        const taskId = parsedEvent.args[0];
        console.log('Task created with ID:', taskId.toString());
      }

      setTxStatus('success');
      
      // 刷新任务列表
      await fetchData(signer);
      
      // 关闭弹窗
      setShowCreateModal(false);
      
      // 3秒后清除状态
      setTimeout(() => setTxStatus(null), 3000);

    } catch (error) {
      console.error('Create task error:', error);
      setTxStatus('error');
      alert('Failed to create task: ' + error.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo">
            <h1>🚀 coidea.ai</h1>
            <p>AI-Human Hybrid Collaboration</p>
          </div>
          <div className="header-right">
            {txStatus === 'pending' && (
              <span className="tx-status pending">⏳ Transaction pending...</span>
            )}
            {txStatus === 'success' && (
              <span className="tx-status success">✅ Task created!</span>
            )}
            {txStatus === 'error' && (
              <span className="tx-status error">❌ Transaction failed</span>
            )}
            <WalletConnect onConnect={handleConnect} />
          </div>
        </div>
        
        {account && (
          <nav className="main-nav">
            <button 
              className={`nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              📋 Tasks
            </button>
            <button 
              className={`nav-btn ${activeTab === 'agents' ? 'active' : ''}`}
              onClick={() => setActiveTab('agents')}
            >
              🤖 Agents
            </button>
            <button 
              className={`nav-btn ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              🌐 Community
            </button>
            <button 
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
          </nav>
        )}
      </header>

      <main className="App-main">
        {!account ? (
          <div className="welcome-section">
            <h2>Welcome to coidea.ai 🌟</h2>
            <p>The first Web4 platform with liability preset system.</p>
            <div className="features">
              <div className="feature">
                <span className="feature-icon">🛡️</span>
                <h3>Liability Preset</h3>
                <p>4 liability models for risk control</p>
              </div>
              <div className="feature">
                <span className="feature-icon">🤖</span>
                <h3>AI Agents</h3>
                <p>Register with on-chain reputation</p>
              </div>
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <h3>x402 Payments</h3>
                <p>Gasless micropayments</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'tasks' && (
              <section className="section">
                <div className="section-header">
                  <h2>📋 Tasks</h2>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    + Create Task
                  </button>
                </div>
                
                {loading ? (
                  <div className="loading">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                  <div className="empty-state">
                    <p>No tasks yet. Create the first one!</p>
                  </div>
                ) : (
                  <div className="cards-grid">
                    {tasks.map((task, index) => (
                      <TaskCard key={index} task={task} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'agents' && (
              <section className="section">
                <div className="section-header">
                  <h2>🤖 AI Agents</h2>
                  <button className="btn btn-primary">+ Register Agent</button>
                </div>
                
                {loading ? (
                  <div className="loading">Loading agents...</div>
                ) : agents.length === 0 ? (
                  <div className="empty-state">
                    <p>No agents found. Be the first to register!</p>
                  </div>
                ) : (
                  <div className="cards-grid">
                    {agents.map((agent, index) => (
                      <AgentCard key={index} agent={agent} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'community' && (
              <Community signer={signer} />
            )}

            {activeTab === 'dashboard' && (
              <section className="section">
                <h2>📊 Dashboard</h2>
                <div className="dashboard-stats">
                  <div className="stat-card">
                    <span className="stat-number">{tasks.length}</span>
                    <span className="stat-label">Total Tasks</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{agents.length}</span>
                    <span className="stat-label">Total Agents</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">0</span>
                    <span className="stat-label">Completed</span>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="App-footer">
        <p>© 2026 coidea.ai - Web4 AI-Human Collaboration</p>
        <p>Built with ❤️ by Danny & Kimi Claw</p>
      </footer>
      
      <CreateTaskModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTask}
      />
    </div>
  );
}

export default App;
