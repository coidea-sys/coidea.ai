import React, { useState, useMemo } from 'react';
import './Tasks.css';

/**
 * Tasks Page Component
 * Complete task marketplace with filtering, sorting, and pagination
 */

const TASK_STATES = ['Open', 'Assigned', 'Completed', 'Cancelled'];
const PAGE_SIZE = 10;

function Tasks({ tasks = [], onCreateTask, onApply, onComplete, currentUser }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by state
    if (filter !== 'all') {
      const stateIndex = TASK_STATES.indexOf(filter);
      result = result.filter(t => t.state === stateIndex);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      case 'reward-high':
        result.sort((a, b) => parseInt(b.reward || 0) - parseInt(a.reward || 0));
        break;
      case 'reward-low':
        result.sort((a, b) => parseInt(a.reward || 0) - parseInt(b.reward || 0));
        break;
      case 'deadline':
        result.sort((a, b) => (a.deadline || 0) - (b.deadline || 0));
        break;
      default:
        break;
    }

    return result;
  }, [tasks, filter, sortBy, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / PAGE_SIZE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const formatReward = (wei) => {
    if (!wei) return '0';
    return (parseInt(wei) / 1e18).toFixed(4);
  };

  const formatDeadline = (timestamp) => {
    if (!timestamp) return 'No deadline';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = date - now;
    
    if (diff < 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} days left`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hours left`;
  };

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h2>📋 Tasks</h2>
        <button className="btn btn-primary" onClick={onCreateTask}>
          + Create Task
        </button>
      </div>

      {/* Filters */}
      <div className="tasks-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All States</option>
            {TASK_STATES.map((state, i) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="reward-high">Highest Reward</option>
            <option value="reward-low">Lowest Reward</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>
      </div>

      {/* Task Count */}
      <div className="tasks-count">
        Showing {paginatedTasks.length} of {filteredTasks.length} tasks
      </div>

      {/* Task List */}
      <div className="tasks-list">
        {paginatedTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found</p>
          </div>
        ) : (
          paginatedTasks.map(task => (
            <div 
              key={task.id} 
              className={`task-card state-${task.state}`}
              onClick={() => setSelectedTask(task)}
            >
              <div className="task-header">
                <span className="task-id">#{task.id}</span>
                <span className={`task-state-badge state-${task.state}`}>
                  {TASK_STATES[task.state]}
                </span>
              </div>
              
              <h3 className="task-title">{task.title}</h3>
              <p className="task-description">{task.description}</p>
              
              <div className="task-footer">
                <div className="task-meta">
                  <span className="task-reward">
                    💰 {formatReward(task.reward)} MATIC
                  </span>
                  <span className="task-deadline">
                    ⏰ {formatDeadline(task.deadline)}
                  </span>
                </div>
                
                <div className="task-actions">
                  {task.state === 0 && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApply?.(task.id);
                      }}
                    >
                      Apply
                    </button>
                  )}
                  {task.state === 1 && task.assignee === currentUser && (
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onComplete?.(task.id);
                      }}
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            ← Prev
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedTask(null)}>×</button>
            
            <h2>{selectedTask.title}</h2>
            <p>{selectedTask.description}</p>
            
            <div className="task-details">
              <div><strong>Reward:</strong> {formatReward(selectedTask.reward)} MATIC</div>
              <div><strong>Status:</strong> {TASK_STATES[selectedTask.state]}</div>
              <div><strong>Deadline:</strong> {formatDeadline(selectedTask.deadline)}</div>
              <div><strong>Creator:</strong> {selectedTask.creator?.slice(0, 6)}...{selectedTask.creator?.slice(-4)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
