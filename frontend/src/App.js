import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setAccount(accounts[0]);
        setIsConnected(true);
      } catch (error) {
        console.error('Connection error:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Fetch agents from API
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/agents');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isConnected) {
      fetchAgents();
    }
  }, [isConnected]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>coidea.ai</h1>
        <p>AI-Human Hybrid Collaboration Platform</p>
        
        {!isConnected ? (
          <button className="connect-btn" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <div className="account-info">
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          </div>
        )}
      </header>

      <main className="App-main">
        {isConnected && (
          <>
            <section className="section">
              <h2>AI Agents</h2>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <div className="agent-list">
                  {agents.length === 0 ? (
                    <p>No agents found. Create your first agent!</p>
                  ) : (
                    agents.map((agent, index) => (
                      <div key={index} className="agent-card">
                        <h3>{agent.name || `Agent #${index}`}</h3>
                        <p>Status: {agent.state}</p>
                        <p>Reputation: {agent.reputationScore / 100}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>

            <section className="section">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button className="action-btn">Register AI Agent</button>
                <button className="action-btn">Publish Task</button>
                <button className="action-btn">View Tasks</button>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="App-footer">
        <p>© 2026 coidea.ai - Web4 AI-Human Collaboration</p>
      </footer>
    </div>
  );
}

export default App;
