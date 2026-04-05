import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    // Rehydrate session from local storage on load
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setAuth({
        token,
        user: JSON.parse(user)
      });
    }
    setIsHydrating(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('user', JSON.stringify(data.user));
    setAuth({
      token: data.access,
      user: data.user
    });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, isHydrating }}>
      {children}
    </AuthContext.Provider>
  );
};
