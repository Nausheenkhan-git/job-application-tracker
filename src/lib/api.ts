import { handleError } from './errorHandler';

interface FetchOptions extends RequestInit {
  showError?: boolean;
  showSuccess?: boolean;
  successMessage?: string;
}

export async function apiFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const { showError = true, showSuccess = false, successMessage, ...fetchOptions } = options;
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (showError) {
        handleError({ status: response.status, message: data.error }, url);
      }
      return null;
    }
    
    if (showSuccess && successMessage) {
      // You can import showSuccess from errorHandler
      console.log('Success:', successMessage);
    }
    
    return data as T;
  } catch (error) {
    if (showError) {
      handleError(error, url);
    }
    return null;
  }
}

// Example usage in dashboard:
// const data = await apiFetch('/api/applications', { 
//   showError: true,
//   showSuccess: false
// });