import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import ReportForm from './ReportForm';
import Dashboard from './Dashboard';
import MyReports from './MyReports';
import { AuthContext } from './AuthContext';

function App() {
  const { auth, refreshSession } = useContext(AuthContext);

  useEffect(() => {
    // Axios response interceptor to handle expired tokens
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newToken = await refreshSession();
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshSession]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ReportForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-reports" element={<MyReports />} />
      </Routes>
    </Router>
  );
}

export default App;
