import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('App error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#2563eb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '20px',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}>
          <svg width="64" height="64" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M96 40L40 76V152H152V76L96 40Z" fill="white"/>
            <rect x="84" y="124" width="24" height="28" fill="#2563eb"/>
            <circle cx="100" cy="138" r="2" fill="white"/>
            <rect x="60" y="100" width="16" height="16" rx="2" fill="#2563eb"/>
            <rect x="116" y="100" width="16" height="16" rx="2" fill="#2563eb"/>
          </svg>
          <h1 style={{ margin: '16px 0 8px 0', fontSize: '24px', fontWeight: '600' }}>PropNet</h1>
          <p style={{ margin: '0 0 16px 0', opacity: 0.8 }}>Something went wrong</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'white',
              color: '#2563eb',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}