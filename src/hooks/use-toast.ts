import { toast } from 'sonner';

export const useToast = () => {
  return {
    toast: (message: string, options?: { type?: 'success' | 'error' | 'info' | 'warning' }) => {
      const { type = 'info' } = options || {};
      
      switch (type) {
        case 'success':
          return toast.success(message);
        case 'error':
          return toast.error(message);
        case 'warning':
          return toast.warning(message);
        default:
          return toast(message);
      }
    },
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    warning: (message: string) => toast.warning(message),
    info: (message: string) => toast.info(message),
  };
};