import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '600px', margin: '4rem auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#111' }}>
            Något gick fel
          </h1>
          <p style={{ color: '#555', marginBottom: '1.5rem' }}>
            Sidan kunde inte läsas in. Försök ladda om.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#0e6efe', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 20px', cursor: 'pointer',
              fontSize: '1rem', fontWeight: 600,
            }}
          >
            Ladda om sidan
          </button>
          <details style={{ marginTop: '2rem' }}>
            <summary style={{ color: '#888', cursor: 'pointer', fontSize: '0.875rem' }}>Teknisk info</summary>
            <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#999', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {(this.state.error as Error).message}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
