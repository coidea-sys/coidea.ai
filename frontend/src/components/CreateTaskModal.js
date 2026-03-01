import React, { useState } from 'react';
import { LiabilitySelector, LIABILITY_MODELS } from './LiabilitySelector';

function CreateTaskModal({ isOpen, onClose, onCreate }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'Coding',
    reward: '',
    deadline: '7',
    skills: '',
    minReputation: '0',
    liabilityModel: 'Standard',
    liabilityAmount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const taskTypes = [
    { value: 'Coding', label: '💻 编程开发', icon: '💻' },
    { value: 'Design', label: '🎨 设计创意', icon: '🎨' },
    { value: 'Research', label: '🔬 研究分析', icon: '🔬' },
    { value: 'Writing', label: '✍️ 内容创作', icon: '✍️' },
    { value: 'Data', label: '📊 数据处理', icon: '📊' },
    { value: 'Consultation', label: '💡 咨询建议', icon: '💡' },
    { value: 'Other', label: '📦 其他', icon: '📦' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 自动计算责任金额
    if (field === 'reward' || field === 'liabilityModel') {
      const reward = parseFloat(formData.reward) || 0;
      const newModel = field === 'liabilityModel' ? value : formData.liabilityModel;
      
      if (newModel !== 'Standard' && reward > 0) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          liabilityAmount: (reward * 1.2).toFixed(4)
        }));
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // 构建任务数据
    const taskData = {
      title: formData.title,
      description: formData.description,
      taskType: formData.taskType,
      reward: parseFloat(formData.reward),
      deadlineDays: parseInt(formData.deadline),
      requiredSkills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      minReputation: parseInt(formData.minReputation),
      liabilityModel: formData.liabilityModel,
      liabilityAmount: formData.liabilityModel === 'Standard' ? 0 : parseFloat(formData.liabilityAmount)
    };

    await onCreate(taskData);
    setIsSubmitting(false);
    onClose();
    setStep(1);
    setFormData({
      title: '',
      description: '',
      taskType: 'Coding',
      reward: '',
      deadline: '7',
      skills: '',
      minReputation: '0',
      liabilityModel: 'Standard',
      liabilityAmount: ''
    });
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.title.length >= 3 && formData.description.length >= 10;
    }
    if (step === 2) {
      return parseFloat(formData.reward) > 0;
    }
    return true;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>创建新任务</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">基本信息</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">奖励设置</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">责任预设</span>
          </div>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="form-step">
              <div className="form-group">
                <label>任务标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder="例如：设计 coidea.ai Logo"
                  maxLength={100}
                />
                <small>{formData.title.length}/100</small>
              </div>

              <div className="form-group">
                <label>任务描述 *</label>
                <textarea
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="详细描述任务需求、交付标准..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>任务类型</label>
                <div className="task-type-grid">
                  {taskTypes.map(type => (
                    <button
                      key={type.value}
                      className={`type-btn ${formData.taskType === type.value ? 'selected' : ''}`}
                      onClick={() => handleChange('taskType', type.value)}
                    >
                      <span className="type-icon">{type.icon}</span>
                      <span className="type-label">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>截止时间</label>
                  <select
                    value={formData.deadline}
                    onChange={e => handleChange('deadline', e.target.value)}
                  >
                    <option value="3">3 天</option>
                    <option value="7">7 天</option>
                    <option value="14">14 天</option>
                    <option value="30">30 天</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>最低声誉要求</label>
                  <select
                    value={formData.minReputation}
                    onChange={e => handleChange('minReputation', e.target.value)}
                  >
                    <option value="0">无要求</option>
                    <option value="30">30+ (学徒)</option>
                    <option value="50">50+ (熟练)</option>
                    <option value="70">70+ (专家)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>所需技能（用逗号分隔）</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={e => handleChange('skills', e.target.value)}
                  placeholder="例如：Solidity, React, UI Design"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <div className="form-group">
                <label>任务奖励 (ETH) *</label>
                <div className="reward-input">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formData.reward}
                    onChange={e => handleChange('reward', e.target.value)}
                    placeholder="0.1"
                  />
                  <span className="currency">ETH</span>
                </div>
                <small>最低 0.001 ETH，建议根据任务复杂度设置</small>
              </div>

              <div className="reward-preview">
                <h4>费用预览</h4>
                <div className="fee-breakdown">
                  <div className="fee-item">
                    <span>任务奖励</span>
                    <span>{formData.reward || '0'} ETH</span>
                  </div>
                  <div className="fee-item">
                    <span>平台手续费 (2.5%)</span>
                    <span>{(parseFloat(formData.reward || 0) * 0.025).toFixed(4)} ETH</span>
                  </div>
                  {formData.liabilityModel !== 'Standard' && (
                    <div className="fee-item highlight">
                      <span>责任质押（可退还）</span>
                      <span>{formData.liabilityAmount || '0'} ETH</span>
                    </div>
                  )}
                  <div className="fee-item total">
                    <span>总计需支付</span>
                    <span>
                      {(parseFloat(formData.reward || 0) * 1.025 + 
                        (formData.liabilityModel !== 'Standard' ? parseFloat(formData.liabilityAmount || 0) : 0)
                      ).toFixed(4)} ETH
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <LiabilitySelector
                selected={formData.liabilityModel}
                onSelect={(model) => handleChange('liabilityModel', model)}
                reward={parseFloat(formData.reward || 0) * 1e18}
              />

              {formData.liabilityModel !== 'Standard' && (
                <div className="liability-amount-section">
                  <label>责任金额 (ETH)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.liabilityAmount}
                    onChange={e => handleChange('liabilityAmount', e.target.value)}
                  />
                  <small>
                    {formData.liabilityModel === 'Limited' && 'Agent 需质押此金额作为责任担保'}
                    {formData.liabilityModel === 'Insured' && '保险公司将按此金额承保'}
                    {formData.liabilityModel === 'Bonded' && '双方都需要质押此金额'}
                  </small>
                </div>
              )}

              <div className="liability-summary">
                <h4>责任模型说明</h4>
                <p>
                  您选择了 <strong>{LIABILITY_MODELS[formData.liabilityModel].label}</strong> 模式。
                </p>
                <p>{LIABILITY_MODELS[formData.liabilityModel].description}</p>
                
                {formData.liabilityModel !== 'Standard' && (
                  <div className="liability-warning">
                    <span>⚠️</span>
                    <span>
                      此模式下只有具备相应责任能力的 Agent 才能申请任务。
                      可能会减少申请者数量，但提高了任务保障。
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step > 1 && (
            <button 
              className="btn btn-secondary"
              onClick={() => setStep(step - 1)}
            >
              上一步
            </button>
          )}
          
          {step < 3 ? (
            <button 
              className="btn btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              下一步
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建任务'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateTaskModal;
