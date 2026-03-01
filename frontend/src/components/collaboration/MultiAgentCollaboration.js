import React, { useState, useEffect } from 'react';
import './MultiAgentCollaboration.css';

const MultiAgentCollaboration = ({ taskId, primaryAgent, socket }) => {
  const [team, setTeam] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [revenueSplit, setRevenueSplit] = useState({});

  // 初始化团队（主 Agent + 可邀请其他 Agent）
  useEffect(() => {
    if (primaryAgent) {
      setTeam([{
        id: primaryAgent.id,
        name: primaryAgent.name,
        role: 'lead',
        permissions: ['manage', 'assign', 'review', 'submit'],
        revenueShare: 100
      }]);
    }
  }, [primaryAgent]);

  // 监听 Agent 间消息
  useEffect(() => {
    if (!socket) return;

    socket.on('agent:teamMessage', (data) => {
      if (data.taskId === taskId) {
        setMessages(prev => [...prev, {
          ...data,
          timestamp: Date.now()
        }]);
      }
    });

    socket.on('agent:subtaskUpdate', (data) => {
      if (data.taskId === taskId) {
        setSubtasks(prev => 
          prev.map(st => st.id === data.subtaskId ? { ...st, ...data.updates } : st)
        );
      }
    });

    return () => {
      socket.off('agent:teamMessage');
      socket.off('agent:subtaskUpdate');
    };
  }, [socket, taskId]);

  // 邀请 Agent 加入团队
  const inviteAgent = (agent) => {
    const newMember = {
      id: agent.id,
      name: agent.name,
      role: 'member',
      permissions: ['submit'],
      revenueShare: 0,
      status: 'pending'
    };
    
    setTeam(prev => [...prev, newMember]);
    
    // 发送邀请通知
    socket.emit('agent:invite', {
      toAgentId: agent.id,
      taskId,
      inviterId: primaryAgent.id,
      message: `You've been invited to collaborate on task #${taskId}`
    });
    
    setShowInviteModal(false);
  };

  // 创建子任务
  const createSubtask = (title, description, assignedTo, reward) => {
    const subtask = {
      id: Date.now(),
      title,
      description,
      assignedTo,
      reward,
      status: 'pending', // pending, in_progress, completed
      progress: 0,
      createdAt: Date.now()
    };
    
    setSubtasks(prev => [...prev, subtask]);
    
    // 通知被分配的 Agent
    socket.emit('agent:subtaskAssigned', {
      toAgentId: assignedTo,
      taskId,
      subtask
    });
  };

  // 更新子任务状态
  const updateSubtaskStatus = (subtaskId, status, progress) => {
    setSubtasks(prev => 
      prev.map(st => st.id === subtaskId ? { ...st, status, progress } : st)
    );
    
    socket.emit('agent:subtaskUpdate', {
      taskId,
      subtaskId,
      updates: { status, progress }
    });
  };

  // 发送团队消息
  const sendTeamMessage = (message) => {
    const messageData = {
      taskId,
      fromAgentId: primaryAgent.id,
      fromName: primaryAgent.name,
      message,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, messageData]);
    
    socket.emit('agent:teamMessage', messageData);
  };

  // 更新收益分配
  const updateRevenueSplit = (agentId, share) => {
    setRevenueSplit(prev => ({
      ...prev,
      [agentId]: share
    }));
    
    setTeam(prev => 
      prev.map(member => 
        member.id === agentId ? { ...member, revenueShare: share } : member
      )
    );
  };

  // 分配权限
  const updatePermissions = (agentId, permissions) => {
    setTeam(prev => 
      prev.map(member => 
        member.id === agentId ? { ...member, permissions } : member
      )
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in_progress': return '🔄';
      case 'completed': return '✅';
      default: return '❓';
    }
  };

  return (
    <div className="multi-agent-collaboration">
      {/* 头部 - 团队信息 */}
      <div className="ma-header">
        <h3>🤝 Multi-Agent Collaboration</h3>
        <div className="team-summary">
          <span>{team.length} Agents</span>
          <span>{subtasks.length} Subtasks</span>
          <button 
            className="invite-btn"
            onClick={() => setShowInviteModal(true)}
          >
            + Invite Agent
          </button>
        </div>
      </div>

      <div className="ma-body">
        {/* 左侧 - 子任务 */}
        <div className="subtasks-section">
          <div className="section-header">
            <h4>📋 Subtasks</h4>
            <button 
              className="add-btn"
              onClick={() => createSubtask(
                'New Subtask', 
                'Description', 
                primaryAgent.id, 
                '0.1'
              )}
            >
              + Add
            </button>
          </div>

          <div className="subtasks-list">
            {subtasks.map(subtask => (
              <div key={subtask.id} className={`subtask-card ${subtask.status}`}>
                <div className="subtask-header">
                  <span className="status-icon">{getStatusIcon(subtask.status)}</span>
                  <span className="subtask-title">{subtask.title}</span>
                  <span className="subtask-reward">{subtask.reward} ETH</span>
                </div>
                
                <p className="subtask-desc">{subtask.description}</p>
                
                <div className="subtask-meta">
                  <span>Assigned to: {subtask.assignedTo?.slice(0, 8)}...</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${subtask.progress}%` }}
                    />
                  </div>
                  <span>{subtask.progress}%</span>
                </div>

                <div className="subtask-actions">
                  <button 
                    onClick={() => updateSubtaskStatus(subtask.id, 'in_progress', 25)}
                    disabled={subtask.status !== 'pending'}
                  >
                    Start
                  </button>
                  <button 
                    onClick={() => updateSubtaskStatus(subtask.id, 'completed', 100)}
                    disabled={subtask.status === 'completed'}
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))}
            
            {subtasks.length === 0 && (
              <p className="empty-state">No subtasks yet. Create one to start collaboration.</p>
            )}
          </div>
        </div>

        {/* 中间 - 团队消息 */}
        <div className="team-chat">
          <h4>💬 Team Chat</h4>
          
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`chat-message ${msg.fromAgentId === primaryAgent.id ? 'own' : 'other'}`}
              >
                <span className="msg-author">{msg.fromName}</span>
                <p className="msg-text">{msg.message}</p>
                <span className="msg-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>

          <form 
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.target.elements.message;
              if (input.value.trim()) {
                sendTeamMessage(input.value);
                input.value = '';
              }
            }}
          >
            <input 
              name="message"
              type="text" 
              placeholder="Message team..."
            />
            <button type="submit">Send</button>
          </form>
        </div>

        {/* 右侧 - 团队成员 */}
        <div className="team-section">
          <h4>👥 Team Members</h4>
          
          <div className="team-list">
            {team.map(member => (
              <div key={member.id} className={`team-member ${member.role}`}>
                <div className="member-header">
                  <span className="member-avatar">{member.name.charAt(0)}</span>
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <span className={`member-role ${member.role}`}>{member.role}</span>
                  </div>
                </div>

                <div className="member-permissions">
                  {member.permissions.map(perm => (
                    <span key={perm} className="permission-tag">{perm}</span>
                  ))}
                </div>

                <div className="revenue-split">
                  <label>Revenue Share:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={member.revenueShare}
                    onChange={(e) => updateRevenueSplit(member.id, parseInt(e.target.value))}
                    disabled={member.role !== 'lead'}
                  />
                  <span>%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="revenue-summary">
            <h5>Revenue Distribution</h5>
            <div className="distribution-bar">
              {team.map(member => (
                <div
                  key={member.id}
                  className="distribution-segment"
                  style={{ 
                    width: `${member.revenueShare}%`,
                    background: `hsl(${member.id * 60}, 70%, 50%)`
                  }}
                  title={`${member.name}: ${member.revenueShare}%`}
                />
              ))}
            </div>
            
            <div className="total-share">
              Total: {team.reduce((sum, m) => sum + m.revenueShare, 0)}%
            </div>
          </div>
        </div>
      </div>

      {/* 邀请模态框 */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Invite Agent</h3>
            
            <div className="agent-list">
              {availableAgents.map(agent => (
                <div key={agent.id} className="agent-option">
                  <span>{agent.name}</span>
                  <span>Reputation: {agent.reputation}</span>
                  <button onClick={() => inviteAgent(agent)}>Invite</button>
                </div>
              ))}
            </div>
            
            <button className="close-btn" onClick={() => setShowInviteModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiAgentCollaboration;
