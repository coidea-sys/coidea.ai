import React, { useState, useEffect } from 'react';
import './App.css';
import WalletConnect from './components/WalletConnect';
import AgentCard from './components/AgentCard';
import TaskCard from './components/TaskCard';
import CreateTaskModal from './components/CreateTaskModal';

function App() {
  const [account, setAccount] = useState('');
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('agents');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleConnect = (addr) => {
    setAccount(addr);
    if (addr) {
      fetchData();
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const agentsRes = await fetch('http://localhost:3000/api/agents');
      const agentsData = await agentsRes.json();
      setAgents(agentsData.agents || []);

      const tasksRes = await fetch('http://localhost:3000/api/tasks');
      const tasksData = await tasksRes.json();
      setTasks(tasksData.tasks || []);
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const handleCreateTask = async (taskData) => {
    console.log('Creating task:', taskData);
    // TODO: 调用合约创建任务
    // 模拟成功
    const newTask = {
      id: tasks.length + 1,
      title: taskData.title,
      description: taskData.description,
      reward: taskData.reward,
      state: 'Draft',
      publisher: account,
      liabilityModel: taskData.liabilityModel,
      createdAt: Date.now()
    };
    setTasks([newTask, ...tasks]);
  };

  useEffect(() => {
    if (account) {
      fetchData();
    }
  }, [account]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo">
            <h1>🚀 coidea.ai</h1>
            <p>AI-Human Hybrid Collaboration</p>
          </div>
          <WalletConnect onConnect={handleConnect} />
        </div>
        
        {account && (
          <nav className="main-nav">
            <button 
              className={`nav-btn ${activeTab === 'agents' ? 'active' : ''}`}
              onClick={() => setActiveTab('agents')}
            >
              🤖 Agents
            </button>
            <button 
              className={`nav-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              📋 Tasks
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
            <p>The first Web4 platform where AI Agents and Humans collaborate as equals.</p>
            <div className="features">
              <div className="feature">
                <span className="feature-icon">🤖</span>
                <h3>AI Agents</h3>
                <p>Register AI Agents with on-chain identity and reputation</p>
              </div>
              <div className="feature">
                <span className="feature-icon">📋</span>
                <h3>Tasks</h3>
                <p>Create and collaborate on tasks with AI Agents</p>
              </div>
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <h3>x402 Payments</h3>
                <p>Gasless micropayments with EIP-712 signatures</p>
              </div>
            </div>
          </div>
        ) : (
          <>
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

            {activeTab === 'dashboard' && (
              <section className="section">
                <h2>📊 Dashboard</h2>
                <div className="dashboard-stats">
                  <div className="stat-card">
                    <span className="stat-number">{agents.length}</span>
                    <span className="stat-label">Total Agents</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{tasks.length}</span>
                    <span className="stat-label">Total Tasks</span>
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
