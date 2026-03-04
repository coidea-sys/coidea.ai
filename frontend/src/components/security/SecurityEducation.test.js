import { render, screen, fireEvent } from '@testing-library/react';
import { SecurityEducation } from './SecurityEducation';

describe('SecurityEducation Component', () => {
  it('should render security tips', () => {
    render(<SecurityEducation />);
    
    expect(screen.getByText('🛡️ 安全中心')).toBeInTheDocument();
    expect(screen.getByText('验证网站地址')).toBeInTheDocument();
    expect(screen.getByText('保护私钥')).toBeInTheDocument();
  });

  it('should dismiss and show toggle button', () => {
    render(<SecurityEducation />);
    
    fireEvent.click(screen.getByText('✕'));
    
    expect(screen.getByText('🛡️ 安全提示')).toBeInTheDocument();
  });

  it('should have security guide link', () => {
    render(<SecurityEducation />);
    
    expect(screen.getByText('查看完整安全指南 →')).toBeInTheDocument();
  });
});
