import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReportForm from './ReportForm';
import Dashboard from './Dashboard';
import MyReports from './MyReports';
import { AuthContext } from './AuthContext';

function App() {
  const { auth } = useContext(AuthContext);

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
