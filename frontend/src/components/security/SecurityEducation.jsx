import React, { useState } from 'react';

const SECURITY_TIPS = [
  {
    id: 1,
    title: '验证网站地址',
    content: '确认网址是 https://coidea.ai，警惕钓鱼网站！',
    icon: '🔒',
  },
  {
    id: 2,
    title: '保护私钥',
    content: '永远不要分享你的私钥或助记词给任何人。',
    icon: '🗝️',
  },
  {
    id: 3,
    title: '使用硬件钱包',
    content: '大额资金建议使用 Ledger 或 Trezor 硬件钱包。',
    icon: '💰',
  },
];

export function SecurityEducation() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <button onClick={() => setDismissed(false)}>
        🛡️ 安全提示
      </button>
    );
  }

  return (
    <div>
      <h3>🛡️ 安全中心</h3>
      <button onClick={() => setDismissed(true)}>✕</button>
      
      <div>
        {SECURITY_TIPS.map(tip => (
          <div key={tip.id}>
            <span>{tip.icon}</span>
            <h4>{tip.title}</h4>
            <p>{tip.content}</p>
          </div>
        ))}
      </div>
      
      <a 
        href="https://github.com/coidea-sys/coidea.ai/blob/main/docs/SECURITY.md"
        target="_blank"
        rel="noopener noreferrer"
      >
        查看完整安全指南 →
      </a>
    </div>
  );
}
