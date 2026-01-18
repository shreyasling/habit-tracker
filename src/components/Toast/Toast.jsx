import toast, { Toaster } from 'react-hot-toast';

// Custom toast styles that match our app theme
const toastOptions = {
    duration: 4000,
    position: 'top-right',
    style: {
        background: 'rgba(23, 23, 23, 0.8)',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '12px 20px',
        fontSize: '0.875rem',
        fontWeight: '500',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        zIndex: 99999,
        maxWidth: '350px',
    },
};

// Success toast
export const toastSuccess = (message) => {
    toast.success(message, {
        ...toastOptions,
        style: {
            ...toastOptions.style,
            background: 'rgba(20, 83, 45, 0.8)', // Dark green tint
            border: '1px solid rgba(34, 197, 94, 0.2)',
        },
        iconTheme: {
            primary: '#4ade80',
            secondary: '#fff',
        },
    });
};

// Error toast
export const toastError = (message) => {
    toast.error(message, {
        ...toastOptions,
        style: {
            ...toastOptions.style,
            background: 'rgba(127, 29, 29, 0.8)', // Dark red tint
            border: '1px solid rgba(239, 68, 68, 0.2)',
        },
        iconTheme: {
            primary: '#f87171',
            secondary: '#fff',
        },
    });
};

// Info toast (using custom icon)
export const toastInfo = (message) => {
    toast(message, {
        ...toastOptions,
        icon: '💡',
    });
};

// Warning toast
export const toastWarning = (message) => {
    toast(message, {
        ...toastOptions,
        style: {
            ...toastOptions.style,
            background: 'rgba(120, 53, 15, 0.8)', // Dark amber tint
            border: '1px solid rgba(245, 158, 11, 0.2)',
        },
        icon: '⚠️',
    });
};

// Celebration toast for streaks and achievements
export const toastCelebration = (message) => {
    toast(message, {
        ...toastOptions,
        duration: 5000,
        icon: '🎉',
        style: {
            ...toastOptions.style,
            background: 'linear-gradient(135deg, rgba(20, 83, 45, 0.95), rgba(23, 23, 23, 0.95))',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 215, 0, 0.1)',
        },
    });
};

// Custom hook for easier usage (mirrors old API)
export function useToast() {
    return {
        success: toastSuccess,
        error: toastError,
        info: toastInfo,
        warning: toastWarning,
        celebration: toastCelebration,
    };
}

// Toast container component
export function ToastProvider({ children }) {
    return (
        <>
            {children}
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerStyle={{
                    top: 24,
                    right: 24,
                    zIndex: 99999,
                }}
                toastOptions={toastOptions}
            />
        </>
    );
}

export default ToastProvider;
