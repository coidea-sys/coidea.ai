import React from 'react';
import { useSecurity } from '../../hooks/useSecurity';

export function SecurityBanner() {
  const { isSafeDomain, warning, reminders } = useSecurity();

  if (isSafeDomain) {
    return (
      <div className="security-banner safe">
        <span className="security-icon">🔒</span>
        <span className="security-text">
          官方安全网站: https://coidea.ai
        </span>
      </div>
    );
  }

  return (
    <div className="security-banner unsafe">
      <span className="security-icon">⚠️</span>
      <div className="security-content">
        <pre>{warning}</pre>
        <div className="security-reminders">
          <h4>安全提醒:</h4>
          <ul>
            {reminders.map((reminder, index) => (
              <li key={index}>{reminder}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
