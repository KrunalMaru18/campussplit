import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campussplit_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Failed to parse cached user:', e);
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('campussplit_token') || null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function verifyUser() {
      const storedToken = localStorage.getItem('campussplit_token');
      if (storedToken) {
        try {
          // Timeout verification after 6s so offline/slow network doesn't trap the user
          const verifyPromise = authApi.getMe();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth verify timeout')), 6000)
          );

          const res = await Promise.race([verifyPromise, timeoutPromise]);
          if (isMounted && res?.user) {
            setUser(res.user);
            localStorage.setItem('campussplit_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session verification notice:', err.message);
          // If network error/timeout, keep cached user session so offline PWA still works
          if (!err.isNetworkError && err.status === 401) {
            logout();
          }
        }
      }
      if (isMounted) setLoading(false);
    }

    verifyUser();

    const handleAuthLogout = () => {
      logout();
    };
    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      isMounted = false;
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    setUser(data.user);
    setToken(data.token);
    setAuthToken(data.token);
    localStorage.setItem('campussplit_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (userData) => {
    const data = await authApi.register(userData);
    setUser(data.user);
    setToken(data.token);
    setAuthToken(data.token);
    localStorage.setItem('campussplit_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem('campussplit_user');
  };

  const setAuthSession = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setAuthToken(userToken);
    localStorage.setItem('campussplit_user', JSON.stringify(userData));
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('campussplit_user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, setAuthSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
