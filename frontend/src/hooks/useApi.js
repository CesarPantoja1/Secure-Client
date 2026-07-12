import { useState, useCallback } from 'react';
import { apiRequest, ApiError } from '../services/api';
import { useNavigate } from 'react-router-dom';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
          navigate('/login', { state: { message: "Tu sesión ha expirado. Inicia sesión nuevamente." } });
          return;
        }
        // Se guarda el error para manejar rate limits (429) u otros status en la UI
        setError(err);
      } else {
        setError(new ApiError(err.message, 0, 'UNKNOWN_ERROR', null, null));
      }
      throw err;
    }
  }, [navigate]);

  return { execute, loading, error, clearError };
}
