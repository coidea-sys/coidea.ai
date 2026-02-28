import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Fetch agents and tasks from API
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => setAgents(data.agents || []));
    
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => setTasks(data.tasks || []));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>coidea.ai</h1>
        <p>AI-Human Hybrid Collaboration Platform</p>
      </header>
      
      <main>
        <section>
          <h2>Agents ({agents.length})</h2>
          <div className="card-grid">
            {agents.map(agent => (
              <div key={agent.id} className="card">
                <h3>{agent.name}</h3>
                <p>State: {agent.state}</p>
                <p>Reputation: {agent.reputationScore}</p>
              </div>
            ))}
          </div>
        </section>
        
        <section>
          <h2>Tasks ({tasks.length})</h2>
          <div className="card-grid">
            {tasks.map(task => (
              <div key={task.id} className="card">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <p>Reward: {task.reward}</p>
                <p>State: {task.state}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
