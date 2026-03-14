'use client';

/**
 * Toast Sistemi
 * ─────────────────────────────────────────────
 * Kullanım 1 — Provider kurulumu (layout.jsx veya _app.jsx):
 *   import { ToastProvider } from '@/components/Toast'
 *   <ToastProvider><App /></ToastProvider>
 *
 * Kullanım 2 — Herhangi bir bileşenden:
 *   import { useToast } from '@/components/Toast'
 *   const toast = useToast()
 *   toast.error('Bağlantı hatası')
 *   toast.success('Kaydedildi!')
 *   toast.warn('İnternet bağlantınız yavaş')
 *   toast.info('Yeni içerik eklendi')
 */

import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

const VARIANTS = {
  success: { bg: '#f0fdf4', border: '#86efac', ink: '#166534', icon: '✓', accent: '#16a34a' },
  error:   { bg: '#fef2f2', border: '#fca5a5', ink: '#991b1b', icon: '✕', accent: '#dc2626' },
  warn:    { bg: '#fffbeb', border: '#fcd34d', ink: '#92400e', icon: '⚠', accent: '#d97706' },
  info:    { bg: '#eff6ff', border: '#93c5fd', ink: '#1e40af', icon: 'ℹ', accent: '#3b82f6' },
};

const DURATIONS = { success: 3500, info: 4000, warn: 5000, error: 6000 };

// ── Tek Toast bileşeni ─────────────────────────────────────────
function Toast({ id, type, title, message, onDismiss }) {
  const v = VARIANTS[type] || VARIANTS.info;
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Mount animasyonu
    requestAnimationFrame(() => setVisible(true));
    // Otomatik kapatma
    timerRef.current = setTimeout(() => dismiss(), DURATIONS[type] || 4000);
    return () => clearTimeout(timerRef.current);
  }, []);

  function dismiss() {
    setVisible(false);
    setTimeout(() => onDismiss(id), 300); // animasyon bittikten sonra kaldır
  }

  return (
    <div
      onClick={dismiss}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '.75rem',
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderLeft: `4px solid ${v.accent}`,
        borderRadius: '10px',
        padding: '.85rem 1rem',
        maxWidth: '340px',
        width: '100%',
        boxShadow: '0 4px 16px rgba(0,0,0,.08)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all .3s cubic-bezier(.4,0,.2,1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(24px)',
        pointerEvents: visible ? 'all' : 'none',
      }}
    >
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: v.accent + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '.8rem', color: v.accent, fontWeight: 700, flexShrink: 0,
        marginTop: '1px',
      }}>
        {v.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ fontWeight: 700, fontSize: '.84rem', color: v.ink, marginBottom: '.15rem' }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: '.81rem', color: v.ink, lineHeight: 1.5 }}>{message}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        style={{
          background: 'none', border: 'none', color: v.ink + '88',
          cursor: 'pointer', fontSize: '.9rem', padding: 0,
          lineHeight: 1, flexShrink: 0, marginTop: '1px',
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ── ToastContainer ─────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '.5rem',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ── ToastProvider ──────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type, message, title) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p.slice(-4), { id, type, message, title }]); // max 5 toast
    return id;
  }, []);

  const api = {
    success: (msg, title) => add('success', msg, title),
    error:   (msg, title) => add('error',   msg, title),
    warn:    (msg, title) => add('warn',    msg, title),
    info:    (msg, title) => add('info',    msg, title),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── useToast hook ──────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast: ToastProvider bulunamadı. layout.jsx dosyanıza <ToastProvider> ekleyin.');
  return ctx;
}
