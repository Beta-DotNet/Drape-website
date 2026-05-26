'use client';

import { useEffect, useState } from 'react';
import type { AppToastPayload } from '@/lib/toast';

export default function ToastContainer() {
  const [toast, setToast] = useState<AppToastPayload | null>(null);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<AppToastPayload>).detail;
      setToast(detail);
    };

    window.addEventListener('drape_app_toast', handleToast as EventListener);

    return () => {
      window.removeEventListener('drape_app_toast', handleToast as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(null), toast.duration ?? 4200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (!toast) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 18,
        top: 18,
        zIndex: 2200,
        maxWidth: 360,
        padding: '14px 16px',
        borderRadius: 18,
        background: 'rgba(15, 23, 42, 0.96)',
        color: '#fff',
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.28)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'auto',
      }}
    >
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{toast.message}</div>
      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action?.onAction();
            setToast(null);
          }}
          style={{
            border: 'none',
            borderRadius: 999,
            background: 'var(--gold, #f9d343)',
            color: 'var(--navy-dark, #122a3e)',
            padding: '10px 14px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {toast.action.label}
        </button>
      ) : null}
    </div>
  );
}
