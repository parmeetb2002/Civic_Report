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
    const hydrate = async () => {
      const token = localStorage.getItem('access_token');
      const refresh = localStorage.getItem('refresh_token');
      const cachedUser = localStorage.getItem('user');

      if (token && cachedUser) {
        // Set cached state immediately so UI doesn't flicker
        setAuth({
          token,
          refresh,
          user: JSON.parse(cachedUser)
        });

        // Then fetch live user data to pick up any is_staff changes
        try {
          const res = await axios.get(`/api/me/?t=${new Date().getTime()}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const freshUser = res.data;
          localStorage.setItem('user', JSON.stringify(freshUser));
          setAuth(prev => ({
            ...prev,
            user: freshUser,
            token: prev?.token || token,
            refresh: prev?.refresh || refresh
          }));
        } catch (err) {
          // Token might be expired — try refresh
          console.warn("Could not refresh user profile, session may be stale.");
        }
      }
      setIsHydrating(false);
    };

    hydrate();
  }, []);

  const refreshProfile = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const res = await axios.get(`/api/me/?t=${new Date().getTime()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const freshUser = res.data;
      localStorage.setItem('user', JSON.stringify(freshUser));
      setAuth(prev => prev ? { ...prev, user: freshUser } : null);
    } catch (err) {
      console.warn("Silent profile refresh failed");
    }
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, refreshSession, isHydrating, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
