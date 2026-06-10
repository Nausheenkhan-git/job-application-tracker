import toast from 'react-hot-toast';

export type ErrorType = 
  | 'network'
  | 'auth'
  | 'validation'
  | 'server'
  | 'unknown';

interface ErrorMessage {
  type: ErrorType;
  message: string;
  userMessage: string;
}

const errorMessages: Record<ErrorType, ErrorMessage> = {
  network: {
    type: 'network',
    message: 'Network connection error',
    userMessage: 'Unable to connect to server. Please check your internet connection.'
  },
  auth: {
    type: 'auth',
    message: 'Authentication error',
    userMessage: 'Please log in again to continue.'
  },
  validation: {
    type: 'validation',
    message: 'Validation error',
    userMessage: 'Please check your input and try again.'
  },
  server: {
    type: 'server',
    message: 'Server error',
    userMessage: 'Something went wrong on our end. Please try again later.'
  },
  unknown: {
    type: 'unknown',
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred. Please try again.'
  }
};

export function handleError(error: any, context?: string) {
  console.error(`Error in ${context || 'unknown context'}:`, error);
  
  let errorType: ErrorType = 'unknown';
  
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Network')) {
    errorType = 'network';
  } else if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
    errorType = 'auth';
  } else if (error?.status === 400 || error?.message?.includes('validation')) {
    errorType = 'validation';
  } else if (error?.status >= 500) {
    errorType = 'server';
  }
  
  const errorInfo = errorMessages[errorType];
  toast.error(errorInfo.userMessage);
  
  if (errorType === 'auth') {
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }
  
  return errorInfo;
}

export function showSuccess(message: string) {
  toast.success(message);
}

export function showInfo(message: string) {
  toast(message);
}

export function showWarning(message: string) {
  toast.error(message);
}