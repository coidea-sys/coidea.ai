import React, { useState } from 'react';

const LIABILITY_MODELS = {
  Standard: {
    name: 'Standard',
    label: '标准模式',
    description: '无特殊责任要求，适合低风险任务',
    icon: '📄',
    color: '#4CAF50'
  },
  Limited: {
    name: 'Limited',
    label: '有限责任',
    description: 'Agent 需质押指定金额，最大损失可控',
    icon: '🛡️',
    color: '#2196F3'
  },
  Insured: {
    name: 'Insured',
    label: '保险覆盖',
    description: '由第三方保险公司承保，适合中等风险',
    icon: '🔒',
    color: '#9C27B0'
  },
  Bonded: {
    name: 'Bonded',
    label: '保证金模式',
    description: '双方都需要质押，适合高价值任务',
    icon: '⚖️',
    color: '#FF9800'
  }
};

function LiabilitySelector({ selected, onSelect, reward }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="liability-selector">
      <label className="selector-label">
        责任模型
        <span className="help-icon" onClick={() => setShowDetails(!showDetails)}>
          ℹ️
        </span>
      </label>
      
      {showDetails && (
        <div className="liability-help">
          <p>选择适合任务风险的责任模型：</p>
          <ul>
            <li><strong>标准</strong>：日常任务，无额外要求</li>
            <li><strong>有限责任</strong>：Agent 质押担保，损失可控</li>
            <li><strong>保险覆盖</strong>：第三方承保，专业保障</li>
            <li><strong>保证金</strong>：双方质押，高价值任务</li>
          </ul>
        </div>
      )}

      <div className="liability-options">
        {Object.entries(LIABILITY_MODELS).map(([key, model]) => (
          <div
            key={key}
            className={`liability-option ${selected === key ? 'selected' : ''}`}
            onClick={() => onSelect(key)}
            style={{ borderColor: selected === key ? model.color : 'transparent' }}
          >
            <div className="option-icon" style={{ color: model.color }}>
              {model.icon}
            </div>
            <div className="option-content">
              <div className="option-label">{model.label}</div>
              <div className="option-name">{model.name}</div>
              <div className="option-desc">{model.description}</div>
            </div>
            {selected === key && (
              <div className="option-check">✓</div>
            )}
          </div>
        ))}
      </div>

      {selected !== 'Standard' && reward > 0 && (
        <div className="liability-amount-input">
          <label>责任金额 (ETH)</label>
          <input
            type="number"
            step="0.001"
            defaultValue={(reward * 1.2 / 1e18).toFixed(4)}
            placeholder="输入责任金额"
          />
          <small>建议不低于任务奖励的 120%</small>
        </div>
      )}
    </div>
  );
}

// Agent 责任能力展示组件
function AgentLiabilityStatus({ agentAddress, requiredAmount }) {
  const [status, setStatus] = useState({
    loading: true,
    canAssume: false,
    type: null,
    maxLiability: 0,
    staked: 0
  });

  // 模拟查询责任能力
  React.useEffect(() => {
    // TODO: 连接合约查询
    setTimeout(() => {
      setStatus({
        loading: false,
        canAssume: true,
        type: 'Limited',
        maxLiability: 2.0,
        staked: 2.5
      });
    }, 500);
  }, [agentAddress]);

  if (status.loading) {
    return <div className="liability-status loading">验证责任能力中...</div>;
  }

  if (!status.canAssume) {
    return (
      <div className="liability-status insufficient">
        <span className="status-icon">❌</span>
        <div>
          <div>责任能力不足</div>
          <small>需要 {requiredAmount} ETH，当前仅 {status.maxLiability} ETH</small>
        </div>
      </div>
    );
  }

  return (
    <div className="liability-status sufficient">
      <span className="status-icon">✅</span>
      <div>
        <div>可承担责任</div>
        <small>{status.type} 模式 | 最大 {status.maxLiability} ETH | 已质押 {status.staked} ETH</small>
      </div>
    </div>
  );
}

export { LiabilitySelector, AgentLiabilityStatus, LIABILITY_MODELS };
export default LiabilitySelector;
