import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { Link } from 'react-router-dom';

function MyReports() {
  const { auth, isHydrating } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyReports = async () => {
      try {
        const response = await axios.get('/api/reports/', {
          headers: { Authorization: `Bearer ${auth.token}` }
        });
        setReports(response.data);
      } catch (err) {
        console.error("Error fetching personal reports", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (auth?.token) {
      fetchMyReports();
    }
  }, [auth]);

  if (isHydrating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary/30 text-4xl">refresh</span>
      </div>
    );
  }

  if (!auth?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface px-6 text-center">
        <h2 className="text-2xl font-bold text-on-surface">Access Denied</h2>
        <p className="text-on-surface-variant mt-2">Please log in to view your reports.</p>
        <Link to="/" className="mt-6 text-primary font-bold hover:underline">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen text-on-surface pb-20">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-primary">My Reports</h1>
          <p className="text-on-surface-variant text-sm font-medium">Tracking your impact on Bareilly</p>
        </div>
        <Link to="/" className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">add</span>
        </Link>
      </header>

      <main className="px-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary/30">refresh</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-surface-container-low rounded-3xl p-10 text-center space-y-4 border border-outline-variant/20">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-outline">
              <span className="material-symbols-outlined text-3xl">assignment_late</span>
            </div>
            <p className="text-on-surface-variant font-medium">You haven't submitted any reports yet.</p>
            <Link to="/" className="inline-block bg-primary text-on-primary px-6 py-2 rounded-full font-bold text-sm shadow-lg">New Report</Link>
          </div>
        ) : (
          reports.map(report => (
            <div key={report.id} className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10 flex gap-4 items-center">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
                <img src={report.image} alt="Report" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                    report.status === 'Resolved' ? 'bg-green-100 text-green-700' : 
                    report.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {report.status}
                  </span>
                  <span className="text-xs text-on-surface-variant/60">{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-on-surface truncate mt-1">Issue #{report.id}</h3>
                <p className="text-sm text-on-surface-variant line-clamp-1 truncate">{report.ai_description}</p>
              </div>
              <div className="flex flex-col items-center justify-center pr-2">
                <div className="text-xs font-black text-primary mb-1">TRIAGE</div>
                <div className="text-lg font-black text-on-surface">{report.severity_score}</div>
              </div>
            </div>
          ))
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-6 pb-8 pt-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_30px_rgb(0,38,49,0.06)] z-50">
        <Link to="/" className="flex flex-col items-center justify-center text-slate-400 p-2">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-[10px] font-bold mt-1">Report</span>
        </Link>
        <Link to="/my-reports" className="flex flex-col items-center justify-center text-primary p-2">
          <span className="material-symbols-outlined">list_alt</span>
          <span className="text-[10px] font-bold mt-1">My Reports</span>
        </Link>
        {auth?.user?.is_staff && (
          <Link to="/dashboard" className="flex flex-col items-center justify-center text-slate-400 p-2">
            <span className="material-symbols-outlined">analytics</span>
            <span className="text-[10px] font-bold mt-1">Admin</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

export default MyReports;
