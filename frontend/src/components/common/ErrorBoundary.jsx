import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 可以在这里发送错误到监控服务
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2>😵 出错了</h2>
          <p>应用遇到了意外错误</p>
          <pre style={{
            background: '#f4f4f4',
            padding: '16px',
            borderRadius: '4px',
            textAlign: 'left',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
