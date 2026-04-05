import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const login = (data) => {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    setAuth({
      token: data.access,
      refresh: data.refresh,
      user: data.user
    });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setAuth(null);
  };

  const refreshSession = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return logout();

    try {
      const res = await axios.post('/api/auth/token/refresh/', { refresh: refreshToken });
      const newAccess = res.data.access;
      localStorage.setItem('access_token', newAccess);
      setAuth(prev => ({
        ...prev,
        token: newAccess
      }));
      return newAccess;
    } catch (err) {
      console.error("Session refresh failed", err);
      logout();
      return null;
    }
  };

  useEffect(() => {
    // Rehydrate session from local storage on load
    const token = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setAuth({
        token,
        refresh,
        user: JSON.parse(user)
      });
    }
    setIsHydrating(false);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout, refreshSession, isHydrating }}>
      {children}
    </AuthContext.Provider>
  );
};
