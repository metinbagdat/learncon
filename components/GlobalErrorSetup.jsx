'use client';

/**
 * GlobalErrorSetup.jsx
 * ─────────────────────────────────────────────
 * _app.jsx veya layout.jsx'e <GlobalErrorSetup /> olarak ekleyin.
 * window.onerror ve unhandledrejection olaylarını yakalar.
 *
 * DevLogPanel:
 * Sadece development'ta görünür. Sağ alta sabitlenmiş,
 * kaydedilmiş logları gösterir. Klavye kısayolu: Ctrl+Shift+L
 */

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';

// ── Global hata yönetimi ───────────────────────────────────────
export function GlobalErrorSetup() {
  useEffect(() => {
    // 1. Yakalanmamış JS hataları
    const handleError = (event) => {
      logger.error('Yakalanmamış hata', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    };

    // 2. Yakalanmamış Promise reddetmeleri
    const handleUnhandledRejection = (event) => {
      const err = event.reason;
      logger.error('İşlenmeyen Promise hatası', err instanceof Error ? err : { reason: String(err) });
    };

    // 3. Ağ bağlantısı koptu uyarısı
    const handleOffline = () => logger.warn('İnternet bağlantısı kesildi');
    const handleOnline  = () => logger.info('İnternet bağlantısı geri geldi');

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    logger.info('Uygulama başlatıldı', { version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0' });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Sadece development'ta DevLogPanel'i göster
  if (process.env.NODE_ENV !== 'development') return null;
  return <DevLogPanel />;
}

// ── DevLogPanel ────────────────────────────────────────────────
const LEVEL_STYLE = {
  debug: { bg: '#f1f5f9', ink: '#64748b', dot: '#94a3b8' },
  info:  { bg: '#eff6ff', ink: '#1e40af', dot: '#3b82f6' },
  warn:  { bg: '#fffbeb', ink: '#92400e', dot: '#f59e0b' },
  error: { bg: '#fef2f2', ink: '#991b1b', dot: '#ef4444' },
};

function DevLogPanel() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs]   = useState([]);
  const [filter, setFilter] = useState('warn');

  // Ctrl+Shift+L kısayolu
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        setOpen(o => !o);
        if (!open) refresh();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function refresh() {
    setLogs(logger.getAll().slice().reverse());
  }

  function filtered() {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return logs.filter(l => levels[l.level] >= levels[filter]);
  }

  if (!open) {
    const errorCount = logger.getByLevel('error').length;
    return (
      <button
        onClick={() => { setOpen(true); refresh(); }}
        style={{
          position: 'fixed', bottom: '1rem', left: '1rem', zIndex: 9998,
          background: errorCount > 0 ? '#fef2f2' : '#f8fafc',
          border: `1px solid ${errorCount > 0 ? '#fca5a5' : '#e2e8f0'}`,
          borderRadius: '8px', padding: '6px 10px',
          fontSize: '.72rem', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '5px',
          color: errorCount > 0 ? '#dc2626' : '#64748b',
          fontFamily: 'monospace',
        }}
        title="DevLog Panelini Aç (Ctrl+Shift+L)"
      >
        🪵 DEV
        {errorCount > 0 && (
          <span style={{ background: '#dc2626', color: '#fff', borderRadius: '4px', padding: '1px 5px', fontSize: '.65rem' }}>
            {errorCount} hata
          </span>
        )}
      </button>
    );
  }

  const displayLogs = filtered();

  return (
    <div style={{
      position: 'fixed', bottom: '1rem', left: '1rem', zIndex: 9998,
      width: '520px', maxWidth: 'calc(100vw - 2rem)',
      background: '#0f172a', border: '1px solid #334155',
      borderRadius: '12px', boxShadow: '0 16px 40px rgba(0,0,0,.5)',
      fontFamily: 'monospace', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '.6rem .9rem', background: '#1e293b', borderBottom: '1px solid #334155' }}>
        <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#94a3b8', flex: 1 }}>🪵 DEV LOG PANEL</span>
        {['debug','info','warn','error'].map(lv => (
          <button key={lv}
            onClick={() => setFilter(lv)}
            style={{
              background: filter === lv ? LEVEL_STYLE[lv].dot : 'transparent',
              color: filter === lv ? '#fff' : LEVEL_STYLE[lv].dot,
              border: `1px solid ${LEVEL_STYLE[lv].dot}`,
              borderRadius: '4px', padding: '2px 7px',
              fontSize: '.65rem', fontWeight: 700, cursor: 'pointer',
            }}
          >{lv.toUpperCase()}</button>
        ))}
        <button onClick={refresh} style={panelBtn}>↻</button>
        <button onClick={() => logger.download()} style={panelBtn} title="Logları indir">⬇</button>
        <button onClick={() => { logger.clear(); setLogs([]); }} style={{ ...panelBtn, color: '#f87171' }} title="Temizle">🗑</button>
        <button onClick={() => setOpen(false)} style={{ ...panelBtn, color: '#f87171' }}>✕</button>
      </div>

      {/* Log listesi */}
      <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '.5rem' }}>
        {displayLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#475569', fontSize: '.78rem', padding: '1.5rem 0' }}>
            Bu seviyede log yok
          </div>
        ) : displayLogs.map((log, i) => {
          const s = LEVEL_STYLE[log.level] || LEVEL_STYLE.info;
          return (
            <div key={log.id || i} style={{
              display: 'flex', gap: '7px', padding: '.35rem .4rem',
              borderRadius: '6px', marginBottom: '2px', alignItems: 'flex-start',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0, marginTop: 5 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '.62rem', color: '#475569' }}>{log.timestamp?.slice(11,19)}</span>
                  <span style={{ fontSize: '.62rem', fontWeight: 700, color: s.dot }}>{log.level.toUpperCase()}</span>
                  {log.url && <span style={{ fontSize: '.6rem', color: '#334155', background: '#1e293b', padding: '1px 5px', borderRadius: '3px' }}>{log.url}</span>}
                </div>
                <div style={{ fontSize: '.77rem', color: '#e2e8f0', marginTop: '2px', wordBreak: 'break-word' }}>{log.message}</div>
                {log.error?.message && (
                  <div style={{ fontSize: '.72rem', color: '#f87171', marginTop: '2px', fontStyle: 'italic' }}>{log.error.message}</div>
                )}
                {log.context && (
                  <div style={{ fontSize: '.68rem', color: '#64748b', marginTop: '1px' }}>{JSON.stringify(log.context).slice(0, 120)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '.4rem .9rem', borderTop: '1px solid #334155', fontSize: '.65rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
        <span>{displayLogs.length} log gösteriliyor</span>
        <span>Ctrl+Shift+L ile aç/kapat</span>
      </div>
    </div>
  );
}

const panelBtn = {
  background: 'transparent', border: '1px solid #334155',
  color: '#94a3b8', borderRadius: '4px', padding: '2px 7px',
  fontSize: '.72rem', cursor: 'pointer',
};
