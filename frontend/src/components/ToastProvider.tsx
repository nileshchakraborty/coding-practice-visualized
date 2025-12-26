import React, { useState, useCallback, type ReactNode } from 'react';
import { AlertCircle, CheckCircle, XCircle, X, Info } from 'lucide-react';
import { ToastContext, type Toast } from '../context/ToastContext';

const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
    const icons = {
        success: <CheckCircle className="text-emerald-400" size={20} />,
        error: <XCircle className="text-red-400" size={20} />,
        warning: <AlertCircle className="text-amber-400" size={20} />,
        info: <Info className="text-blue-400" size={20} />
    };

    const borders = {
        success: 'border-emerald-500/30',
        error: 'border-red-500/30',
        warning: 'border-amber-500/30',
        info: 'border-blue-500/30'
    };

    return (
        <div
            className={`bg-slate-900/95 backdrop-blur-sm border ${borders[toast.type]} rounded-xl p-4 shadow-2xl max-w-md animate-slide-in`}
            role="alert"
        >
            <div className="flex items-start gap-3">
                {icons[toast.type]}
                <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{toast.title}</p>
                    <p className="text-slate-400 text-sm mt-1 whitespace-pre-line">{toast.message}</p>
                </div>
                <button onClick={onDismiss} className="text-slate-500 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((type: Toast['type'], title: string, message: string, duration = 5000) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, type, title, message }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-3">
                {toasts.map(toast => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => dismissToast(toast.id)}
                    />
                ))}
            </div>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
        </ToastContext.Provider>
    );
};
