import React, { useState, useEffect, useRef } from 'react';
import './TaskCollaborationSpace.css';

const TaskCollaborationSpace = ({ taskId, userId, socket }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 加入任务房间
  useEffect(() => {
    if (socket && taskId) {
      socket.emit('task:join', { taskId });
      
      socket.on('task:newMessage', (data) => {
        setMessages(prev => [...prev, data]);
      });

      socket.on('task:userJoined', (data) => {
        setOnlineUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
      });

      socket.on('task:userLeft', (data) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
      });

      socket.on('task:newFile', (data) => {
        setFiles(prev => [...prev, data]);
      });

      socket.on('task:progressUpdate', (data) => {
        setProgress(data.progress);
      });

      return () => {
        socket.emit('task:leave', { taskId });
        socket.off('task:newMessage');
        socket.off('task:userJoined');
        socket.off('task:userLeft');
        socket.off('task:newFile');
        socket.off('task:progressUpdate');
      };
    }
  }, [socket, taskId]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.emit('task:message', {
        taskId,
        message: inputMessage,
        type: 'text'
      });
      setInputMessage('');
    }
  };

  // 上传文件
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // TODO: 上传到 IPFS
    const mockFileUrl = `ipfs://mock-${Date.now()}`;
    
    socket.emit('task:file', {
      taskId,
      fileName: file.name,
      fileUrl: mockFileUrl,
      fileType: file.type
    });
  };

  // 更新进度
  const handleProgressUpdate = (newProgress) => {
    setProgress(newProgress);
    socket.emit('task:progress', {
      taskId,
      progress: newProgress,
      status: newProgress === 100 ? 'completed' : 'in_progress',
      details: `Progress updated to ${newProgress}%`
    });
  };

  return (
    <div className="task-collaboration-space">
      {/* 头部 - 在线用户 */}
      <div className="collab-header">
        <div className="online-users">
          <span className="online-indicator">🟢</span>
          <span>{onlineUsers.length} online</span>
          <div className="user-avatars">
            {onlineUsers.slice(0, 5).map((user, idx) => (
              <div key={idx} className="user-avatar" title={user.userId}>
                {user.userId?.slice(0, 2)}
              </div>
            ))}
            {onlineUsers.length > 5 && (
              <div className="user-avatar more">+{onlineUsers.length - 5}</div>
            )}
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          <span>{progress}%</span>
        </div>
      </div>

      <div className="collab-body">
        {/* 左侧 - 消息区 */}
        <div className="messages-section">
          <div className="messages-list">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`message ${msg.userId === userId ? 'own' : 'other'}`}
              >
                <div className="message-header">
                  <span className="message-author">{msg.userId?.slice(0, 8)}...</span>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="message-input" onSubmit={handleSendMessage}>
            <button 
              type="button" 
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📎
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
            />
            <button type="submit" disabled={!inputMessage.trim()}>
              Send
            </button>
          </form>
          
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>

        {/* 右侧 - 文件和进度 */}
        <div className="sidebar">
          <div className="files-section">
            <h4>📁 Shared Files ({files.length})</h4>
            <div className="files-list">
              {files.map((file, idx) => (
                <div key={idx} className="file-item">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.fileName}</span>
                  <span className="file-time">
                    {new Date(file.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {files.length === 0 && (
                <p className="empty-state">No files shared yet</p>
              )}
            </div>
          </div>

          <div className="progress-section">
            <h4>📊 Progress</h4>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => handleProgressUpdate(parseInt(e.target.value))}
            />
            <div className="progress-actions">
              <button onClick={() => handleProgressUpdate(25)}>25%</button>
              <button onClick={() => handleProgressUpdate(50)}>50%</button>
              <button onClick={() => handleProgressUpdate(75)}>75%</button>
              <button onClick={() => handleProgressUpdate(100)}>100% ✅</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCollaborationSpace;
