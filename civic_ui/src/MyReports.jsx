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
    <div className="bg-surface min-h-screen text-on-surface pb-32 selection:bg-primary/10">
      <header className="px-6 pt-12 pb-8 flex items-center justify-between max-w-2xl mx-auto">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-primary leading-none mb-1">Citizen Feed</h1>
          <p className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-[0.2em]">Your Civic Contributions</p>
        </div>
        <Link to="/" className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-xl border border-outline-variant/10 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-2xl font-black">add</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Accessing Ledger...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-[40px] p-12 text-center space-y-6 border border-outline-variant/10 shadow-2xl animate-in zoom-in-95 duration-700">
            <div className="w-20 h-20 rounded-[30px] bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant/20">
              <span className="material-symbols-outlined text-5xl font-black">inventory_2</span>
            </div>
            <div>
              <p className="text-on-surface font-black text-xl tracking-tighter">No Active Reports</p>
              <p className="text-on-surface-variant/60 text-sm mt-1 font-medium">Your contribution history is currently empty.</p>
            </div>
            <Link to="/" className="inline-block bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform">Start Reporting</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, idx) => (
              <div 
                key={report.id} 
                className="bg-white rounded-[32px] p-5 shadow-xl border border-outline-variant/5 flex gap-5 items-center group hover:bg-surface-container-low transition-all animate-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-container flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  <img src={report.image} alt="Incident" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full tracking-widest shadow-sm ${
                      report.status === 'Resolved' ? 'bg-emerald-500 text-white' : 
                      report.status === 'In Progress' ? 'bg-amber-500 text-white' : 'bg-primary text-white'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-tighter">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-black text-on-surface text-lg tracking-tighter leading-none mb-1">Incident #{report.id}</h3>
                  <p className="text-sm text-on-surface-variant font-medium line-clamp-1 truncate opacity-60">{report.ai_description}</p>
                </div>
                <div className="flex flex-col items-center justify-center bg-primary/5 rounded-2xl px-3 py-4 min-w-[60px]">
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Score</span>
                  <span className="text-2xl font-black text-primary leading-none">{report.severity_score}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 flex justify-around items-center h-20 bg-primary rounded-[30px] shadow-2xl z-[100] border border-white/10 px-4 max-w-2xl mx-auto">
        <Link to="/" className="flex flex-col items-center justify-center text-white/50 hover:text-white p-2 transition-colors">
          <span className="material-symbols-outlined text-2xl">add_box</span>
        </Link>
        <Link to="/my-reports" className="flex flex-col items-center justify-center text-white p-4 bg-white/10 rounded-2xl transition-all">
          <span className="material-symbols-outlined text-2xl font-black">person_pin</span>
        </Link>
        {auth?.user?.is_staff && (
          <Link to="/dashboard" className="flex flex-col items-center justify-center text-white/50 hover:text-white p-2 transition-colors">
            <span className="material-symbols-outlined text-2xl">dashboard</span>
          </Link>
        )}
      </nav>
    </div>
  );
}

export default MyReports;
