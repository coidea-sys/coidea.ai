import React, { useState, useEffect } from 'react';
import { useTask } from '../hooks/useTask';

export function TaskApplications({ taskId, isPublisher, onAssigned }) {
  const { getContract } = useTask();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(null);

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const loadApplications = async () => {
    try {
      const contract = await getContract();
      const appIds = await contract.getTaskApplications(taskId);
      
      const apps = await Promise.all(
        appIds.map(async (id) => {
          const app = await contract.applications(id);
          return {
            id: Number(id),
            applicant: app.applicant,
            proposedPrice: app.proposedPrice,
            message: app.message,
            state: app.state,
          };
        })
      );
      
      setApplications(apps.filter(a => a.state === 0)); // Only pending
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  };

  const handleAssign = async (applicationId) => {
    setAssigning(applicationId);
    setLoading(true);
    
    try {
      const contract = await getContract();
      const tx = await contract.assignTask(taskId, applicationId);
      await tx.wait();
      onAssigned?.();
    } catch (err) {
      console.error('Failed to assign:', err);
      alert('分配失败: ' + err.message);
    } finally {
      setLoading(false);
      setAssigning(null);
    }
  };

  if (!isPublisher) return null;
  
  if (applications.length === 0) {
    return (
      <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h4>申请者</h4>
        <p style={{ color: '#666' }}>暂无申请者</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px', marginTop: '16px' }}>
      <h4>申请者 ({applications.length})</h4>
      
      <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
        {applications.map((app) => (
          <div 
            key={app.id}
            style={{
              padding: '12px',
              background: 'white',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {app.applicant.slice(0, 6)}...{app.applicant.slice(-4)}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  报价: {app.proposedPrice} ETH
                </div>
                {app.message && (
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
                    "{app.message}"
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleAssign(app.id)}
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px'
                }}
              >
                {assigning === app.id ? '分配中...' : '分配任务'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
