import toast from 'react-hot-toast';

/**
 * Toast notification utility with Hebrew-friendly styling
 * Provides success, error, and info notifications with glassmorphism design
 */

const toastConfig = {
  duration: 3000,
  position: 'top-center' as const,
  style: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: '1.5rem',
    padding: '1rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    direction: 'rtl' as const,
    textAlign: 'right' as const,
  },
};

export const showToast = {
  /**
   * Show success toast with green accent
   */
  success: (message: string) => {
    return toast.success(message, {
      ...toastConfig,
      style: {
        ...toastConfig.style,
        borderLeft: '4px solid #86EFAC', // baby-mint-300
      },
      icon: '✅',
    });
  },

  /**
   * Show error toast with pink accent
   */
  error: (message: string) => {
    return toast.error(message, {
      ...toastConfig,
      style: {
        ...toastConfig.style,
        borderLeft: '4px solid #FCA5A5', // baby-pink-300
      },
      icon: '❌',
    });
  },

  /**
   * Show info toast with blue accent
   */
  info: (message: string) => {
    return toast(message, {
      ...toastConfig,
      style: {
        ...toastConfig.style,
        borderLeft: '4px solid #93C5FD', // baby-blue-300
      },
      icon: 'ℹ️',
    });
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};

export default showToast;
