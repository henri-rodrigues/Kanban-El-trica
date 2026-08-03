import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleClearCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#090d16',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            background: '#1e293b',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: '1.4rem', color: '#f43f5e', marginBottom: '0.75rem' }}>
              ⚠️ Ops! Aconteceu um imprevisto
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Ocorreu uma falha inesperada no carregamento dos dados. Clique abaixo para atualizar a aplicação.
            </p>
            <div style={{ fontSize: '0.75rem', background: '#0f172a', padding: '0.75rem', borderRadius: '6px', color: '#fda4af', marginBottom: '1.5rem', wordBreak: 'break-word', textAlign: 'left' }}>
              {this.state.error?.toString()}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                onClick={this.handleReset}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                🔄 Recarregar Página
              </button>
              <button 
                onClick={this.handleClearCache}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', background: '#475569', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                🧹 Limpar Cache & Recarregar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
