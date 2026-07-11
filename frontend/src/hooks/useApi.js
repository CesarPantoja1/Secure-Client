import { useState, useCallback } from 'react';
import { apiRequest, ApiError } from '../services/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(async (path, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(path, options);
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) {
        if (err.status === 401) {
          window.location.href = '/login';
          return;
        }
        // Se guarda el error para manejar rate limits (429) u otros status en la UI
        setError(err);
      } else {
        setError(new ApiError(err.message, 0, 'UNKNOWN_ERROR', null, null));
      }
      throw err;
    }
  }, []);

  return { execute, loading, error, clearError };
}
