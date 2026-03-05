import React, { useEffect } from 'react';
import { useHuman } from '../../hooks/useHuman';

export function WalletManager() {
  const { profile, fetchProfile, isLoading } = useHuman();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) return <div>Loading wallet...</div>;
  if (!profile) return <div>No profile found</div>;

  return (
    <div className="wallet-manager">
      <h3>Wallet Summary</h3>
      
      <div className="wallet-stats">
        <div className="stat">
          <label>Available Balance</label>
          <span>{profile.totalEarned} POL</span>
        </div>
        
        <div className="stat">
          <label>Total Spent</label>
          <span>{profile.totalSpent} POL</span>
        </div>
        
        <div className="stat">
          <label>Total Earned</label>
          <span>{profile.totalEarned} POL</span>
        </div>
        
        <div className="stat">
          <label>Reputation</label>
          <span>{profile.reputation}</span>
        </div>
        
        <div className="stat">
          <label>Tasks Created</label>
          <span>{profile.totalTasksCreated}</span>
        </div>
        
        <div className="stat">
          <label>Tasks Completed</label>
          <span>{profile.totalTasksCompleted}</span>
        </div>
      </div>
    </div>
  );
}
