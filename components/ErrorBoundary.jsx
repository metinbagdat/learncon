'use client'; // Next.js App Router için gerekli

import React, { Component, createContext, useContext, useCallback, useState } from 'react';
import logger from '@/lib/logger';

// ─────────────────────────────────────────────
// ErrorContext — tüm bileşenlerden hata fırlatmak için
// ─────────────────────────────────────────────
const ErrorContext = createContext(null);
export const useErrorContext = () => useContext(ErrorContext);

// ─────────────────────────────────────────────
// ErrorBoundary — render sırasındaki hataları yakalar
// ─────────────────────────────────────────────
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('React render hatası', error, {
      componentStack: errorInfo.componentStack?.slice(0, 500),
      boundary: this.props.name || 'anonymous',
    });

    // props.onError callback varsa çağır (örn: parent'a bildirmek için)
    this.props.onError?.(error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Özel fallback UI verilmişse göster
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.handleReset,
        });
      }

      // Varsayılan hata UI
      return (
        <DefaultErrorUI
          error={this.state.error}
          onReset={this.handleReset}
          minimal={this.props.minimal}
        />
      );
    }

    return this.props.children;
  }
}

// ─────────────────────────────────────────────
// Varsayılan hata arayüzü
// ─────────────────────────────────────────────
function DefaultErrorUI({ error, onReset, minimal }) {
  const isDev = process.env.NODE_ENV === 'development';

  if (minimal) {
    return (
      <div style={styles.minimalBox}>
        <span style={styles.minimalIcon}>⚠️</span>
        <span style={styles.minimalText}>Bu bölüm yüklenemedi.</span>
        <button style={styles.minimalBtn} onClick={onReset}>Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.icon}>💥</div>
        <h2 style={styles.title}>Bir şeyler ters gitti</h2>
        <p style={styles.desc}>
          Bu sayfa beklenmeyen bir hatayla karşılaştı. Hata otomatik olarak kaydedildi.
        </p>
        {isDev && error && (
          <details style={styles.details}>
            <summary style={styles.summary}>Hata detayı (geliştirici)</summary>
            <pre style={styles.pre}>{error.message}{'\n\n'}{error.stack}</pre>
          </details>
        )}
        <div style={styles.btnRow}>
          <button style={styles.btnPrimary} onClick={onReset}>
            Tekrar Dene
          </button>
          <button style={styles.btnSecondary} onClick={() => window.location.href = '/'}>
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap:        { minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  card:        { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '2.5rem', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,.06)' },
  icon:        { fontSize: '2.5rem', marginBottom: '1rem' },
  title:       { fontFamily: 'system-ui, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#111', marginBottom: '.5rem' },
  desc:        { fontSize: '.9rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '1.5rem' },
  details:     { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '.75rem', marginBottom: '1.5rem', textAlign: 'left' },
  summary:     { fontSize: '.8rem', color: '#6b7280', cursor: 'pointer', fontWeight: 600 },
  pre:         { fontSize: '.72rem', color: '#dc2626', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginTop: '.5rem', lineHeight: 1.5 },
  btnRow:      { display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary:  { background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontWeight: 600, fontSize: '.88rem', cursor: 'pointer' },
  btnSecondary:{ background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', padding: '9px 20px', fontWeight: 500, fontSize: '.88rem', cursor: 'pointer' },
  minimalBox:  { display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.9rem 1.2rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px' },
  minimalIcon: { fontSize: '1.1rem', flexShrink: 0 },
  minimalText: { flex: 1, fontSize: '.85rem', color: '#991b1b' },
  minimalBtn:  { background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
};

// ─────────────────────────────────────────────
// useAsync — async fonksiyonlar için error wrapper
//
// Kullanım:
//   const { run, loading, error, data } = useAsync()
//   await run(() => fetchQuizData(id), 'Quiz yükleme hatası')
// ─────────────────────────────────────────────
export function useAsync() {
  const [state, setState] = useState({ loading: false, error: null, data: null });

  const run = useCallback(async (asyncFn, errorMessage = 'İşlem başarısız', context = {}) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const result = await asyncFn();
      setState({ loading: false, error: null, data: result });
      return result;
    } catch (err) {
      const msg = err?.message || errorMessage;
      logger.error(errorMessage, err, context);
      setState({ loading: false, error: msg, data: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return { ...state, run, reset };
}

// ─────────────────────────────────────────────
// withErrorBoundary — HOC olarak kullanım
//
// Kullanım:
//   export default withErrorBoundary(QuizPage, { name: 'QuizPage', minimal: false })
// ─────────────────────────────────────────────
export function withErrorBoundary(Component, options = {}) {
  const Wrapped = (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return Wrapped;
}
