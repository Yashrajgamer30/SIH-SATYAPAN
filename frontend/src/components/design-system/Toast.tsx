import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(({ type, title, message }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Render Tray */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map(toast => {
          const config = {
            success: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-600', icon: CheckCircle2 },
            error: { bg: 'bg-danger-50', text: 'text-danger', border: 'border-danger', icon: AlertCircle },
            warning: { bg: 'bg-warning-50', text: 'text-warning', border: 'border-warning', icon: AlertTriangle },
            info: { bg: 'bg-info-50', text: 'text-info', border: 'border-info', icon: Info }
          }[toast.type];

          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto p-3.5 bg-gov-surface border-l-4 ${config.border} border-t border-r border-b border-gov-border rounded shadow-lg flex items-start gap-3 transition-all duration-200`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${config.text} mt-0.5`} />
              <div className="flex-1 overflow-hidden">
                <p className="text-14 font-bold text-gov-text">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-12 text-gov-muted mt-0.5">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-gov-subtle rounded text-gov-muted hover:text-gov-text cursor-pointer"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
