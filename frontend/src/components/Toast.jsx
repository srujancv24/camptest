import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message, duration) => {
        return addToast(message, 'success', duration);
    }, [addToast]);

    const showError = useCallback((message, duration) => {
        return addToast(message, 'error', duration);
    }, [addToast]);

    const showInfo = useCallback((message, duration) => {
        return addToast(message, 'info', duration);
    }, [addToast]);

    const showWarning = useCallback((message, duration) => {
        return addToast(message, 'warning', duration);
    }, [addToast]);

    const value = {
        toasts,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeToast
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};

const Toast = ({ toast, onRemove }) => {
    const getToastStyles = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-white';
            default:
                return 'bg-blue-500 text-white';
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            default:
                return 'ℹ️';
        }
    };

    return (
        <div className={`
      flex items-center justify-between p-4 rounded-lg shadow-lg min-w-80 max-w-md
      transform transition-all duration-300 ease-in-out
      ${getToastStyles(toast.type)}
    `}>
            <div className="flex items-center space-x-3">
                <span className="text-lg">{getIcon(toast.type)}</span>
                <span className="font-medium">{toast.message}</span>
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
            >
                ✕
            </button>
        </div>
    );
};

export default Toast;