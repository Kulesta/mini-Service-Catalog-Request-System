import { useState, useCallback } from 'react';
import { ToastCtx } from './toastContext';

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3500) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, exiting: false }]);
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 300);
        }, duration);
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
        warning: (msg) => addToast(msg, 'warning'),
    };

    return (
        <ToastCtx.Provider value={toast}>
            {children}
            <div className="toast-container">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} />
                ))}
            </div>
        </ToastCtx.Provider>
    );
}

function ToastItem({ toast }) {
    const config = {
        success: {
            bg: 'bg-emerald-50 border-emerald-200',
            text: 'text-emerald-800',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            iconColor: 'text-emerald-500',
            bar: 'bg-emerald-500',
        },
        error: {
            bg: 'bg-red-50 border-red-200',
            text: 'text-red-800',
            icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
            iconColor: 'text-red-500',
            bar: 'bg-red-500',
        },
        info: {
            bg: 'bg-blue-50 border-blue-200',
            text: 'text-blue-800',
            icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            iconColor: 'text-blue-500',
            bar: 'bg-blue-500',
        },
        warning: {
            bg: 'bg-amber-50 border-amber-200',
            text: 'text-amber-800',
            icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
            iconColor: 'text-amber-500',
            bar: 'bg-amber-500',
        },
    };

    const c = config[toast.type] || config.success;

    return (
        <div className={`toast rounded-xl border shadow-lg overflow-hidden ${toast.bg} ${toast.exiting ? 'toast-exit' : ''}`}>
            <div className="flex items-center gap-3 px-4 py-3">
                <svg className={`w-5 h-5 shrink-0 ${c.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                </svg>
                <p className={`text-sm font-medium ${c.text}`}>{toast.message}</p>
            </div>
            <div className={`h-0.5 ${c.bar}`} style={{ animation: 'shrink 3.5s linear forwards' }} />
        </div>
    );
}
