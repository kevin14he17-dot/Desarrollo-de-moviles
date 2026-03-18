import { useCallback } from 'react';
import useAuthStore from '../stores/authStore';
import { authService } from '../services/api';

export const useAuth = () => {
  const { user, token, isLoading, error, setUser, setLoading, setError, logout } =
    useAuthStore();

  const login = useCallback(
    async (username, password) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.login(username, password);
        const { user, tokens } = response.data.data;
        setUser(user, tokens.accessToken, tokens.refreshToken);
        return { success: true };
      } catch (err) {
        const message = err.response?.data?.error?.message || 'Error al iniciar sesión';
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, setError]
  );

  const register = useCallback(
    async (userData) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.register(userData);
        const { user } = response.data.data;
        // No hacemos auto-login, solo mostramos éxito
        return { success: true, user };
      } catch (err) {
        const message = err.response?.data?.error?.message || 'Error al registrar';
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError]
  );

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout: handleLogout,
  };
};

export default useAuth;
