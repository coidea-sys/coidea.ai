import React, { useState, useEffect } from 'react';
import { useHuman } from '../hooks/useHuman';

export function HumanProfile({ address }) {
  const { getHuman, checkIsHuman } = useHuman();
  const [profile, setProfile] = useState(null);
  const [isHuman, setIsHuman] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const loadProfile = async () => {
    setLoading(true);
    
    const humanStatus = await checkIsHuman(address);
    setIsHuman(humanStatus);

    if (humanStatus) {
      const data = await getHuman(address);
      setProfile(data);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (<div data-testid="profile-loading">加载中...</div>);
  }

  if (!isHuman) {
    return (
      <div data-testid="not-human">
        <p>该地址尚未注册为 Human</p>
      </div>
    );
  }

  if (!profile) {
    return (<div data-testid="profile-error">无法加载资料</div>);
  }

  return (
    <div data-testid="human-profile">
      <h3>{profile.username}</h3>
      <div>
        <label>钱包地址:</label>
        <div>{profile.wallet}</div>
      </div>
      
      <div>
        <label>声誉:</label>
        <div>{profile.reputation}</div>
      </div>

      <div>
        <label>注册时间:</label>
        <div>{new Date(Number(profile.registeredAt) * 1000).toLocaleString()}</div>
      </div>

      <div>
        <label>状态:</label>
        <div>{profile.isActive ? '活跃' : '非活跃'}</div>
      </div>
    </div>
  );
}
