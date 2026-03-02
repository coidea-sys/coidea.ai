import React, { useState, lazy, Suspense } from 'react';
import './App.css';
import { ethers } from 'ethers';
import { ToastProvider, useToast } from './hooks/useToast';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ThemeToggle from './components/common/ThemeToggle';
import NetworkSwitch from './components/common/NetworkSwitch';
import WalletConnect from './components/WalletConnect';
import AgentCard from './components/AgentCard';
import TaskCard from './components/TaskCard';
import { SkeletonCard } from './components/common/Skeleton';
// import HumanRegistration from './components/human/HumanRegistration';
// import WalletManager from './components/human/WalletManager';
import { getNetworkConfig } from './config/network';
import TaskRegistryABI from './abis/TaskRegistry.json';

// Lazy load heavy components
const CreateTaskModal = lazy(() => import('./components/CreateTaskModal'));
const Community = lazy(() => import('./components/Community'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const NotificationCenter = lazy(() => import('./components/collaboration/NotificationCenter'));

function App() {
  const { success, error: showError } = useToast();
  const [account, setAccount] = useState('');
  const [signer, setSigner] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState('polygon');
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Human state - will be used in future
  // eslint-disable-next-line no-unused-vars
  const [isHuman, setIsHuman] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [showRegistration, setShowRegistration] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [showWallet, setShowWallet] = useState(false);

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
      showError('Please connect wallet first');
      return;
    }

    setIsCreating(true);

    try {
      const taskRegistry = new ethers.Contract(
        config.contracts.TaskRegistry,
        TaskRegistryABI.abi,
        signer
      );

      const liabilityModelMap = {
        'Standard': 0,
        'Limited': 1,
        'Insured': 2,
        'Bonded': 3
      };

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

      const totalValue = reward + (taskData.liabilityModel === 'Bonded' ? liabilityAmount : 0n);

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

      const receipt = await tx.wait();

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
        success(`Task created successfully! ID: ${taskId.toString()}`);
      } else {
        success('Task created successfully!');
      }

      await fetchData(signer);
      setShowCreateModal(false);

    } catch (err) {
      console.error('Create task error:', err);
      showError(err.message || 'Failed to create task');
    } finally {
      setIsCreating(false);
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
            {isCreating && (
              <span className="tx-status pending">⏳ Creating task...</span>
            )}
            <ThemeToggle />
            <NetworkSwitch 
              currentNetwork={currentNetwork} 
              onSwitch={setCurrentNetwork} 
            />
            <Suspense fallback={<span>🔔</span>}>
              <NotificationCenter socket={null} userId={account} />
            </Suspense>
            <WalletConnect onConnect={handleConnect} />
            {account && (
              <button
                className="btn btn-secondary profile-btn"
                onClick={() => setShowProfile(true)}
              >
                👤 Profile
              </button>
            )}
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
              <Community signer={signer} account={account} />
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
      
      <Suspense fallback={<SkeletonCard />}>
        <CreateTaskModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
        />
      </Suspense>

      <Suspense fallback={<SkeletonCard />}>
        <UserProfile
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          account={account}
          signer={signer}
        />
      </Suspense>
    </div>
  );
}

function AppWithProvider() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default AppWithProvider;
