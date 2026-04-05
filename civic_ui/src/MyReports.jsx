import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { Link } from 'react-router-dom';

function MyReports() {
  const { auth, logout, isHydrating } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, notificationsRes] = await Promise.all([
          axios.get('/api/reports/', { headers: { Authorization: `Bearer ${auth.token}` } }),
          axios.get('/api/notifications/', { headers: { Authorization: `Bearer ${auth.token}` } })
        ]);
        setReports(reportsRes.data);
        setNotifications(notificationsRes.data);
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (auth?.token) {
      if (!isHydrating && auth.refreshProfile) {
        auth.refreshProfile(); // refresh if they sit on this page
      }
      fetchData();
    }
  }, [auth?.token]);

  const markNotificationsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    try {
      await Promise.all(unreadIds.map(id => 
        axios.patch(`/api/notifications/${id}/`, { is_read: true }, {
          headers: { Authorization: `Bearer ${auth.token}` }
        })
      ));
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking as read", err);
    }
  };

  if (isHydrating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary/30 text-4xl">refresh</span>
      </div>
    );
  }

  if (!auth?.user) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center uppercase font-black">
          <h1 className="text-3xl tracking-tighter">Identity Required</h1>
          <p className="text-on-surface-variant/40 text-[10px] tracking-widest mt-2 mb-8 italic">Access Restricted to Registered Citizens</p>
          <Link to="/" className="bg-primary text-white px-10 py-4 rounded-3xl text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Authenticate Now</Link>
       </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="bg-surface min-h-screen text-on-surface pb-32 selection:bg-primary/10 font-body">
      <header className="px-6 pt-12 pb-8 flex items-center justify-between max-w-2xl mx-auto">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-primary leading-none mb-1">Citizen Feed</h1>
          <p className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-[0.2em]">Your Civic Contributions</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); if(!showNotifications) markNotificationsRead(); }}
            data-tooltip="Notifications"
            className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-xl border border-outline-variant/10 relative active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-2xl font-black">notifications</span>
            {unreadCount > 0 && <span className="notification-dot"></span>}
          </button>
          <Link to="/" data-tooltip="New Report" className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-xl border border-outline-variant/10 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-2xl font-black">add</span>
          </Link>
          <button
            onClick={logout}
            className="px-4 h-12 rounded-2xl bg-red-50 flex items-center justify-center gap-2 text-red-600 font-bold text-[10px] uppercase tracking-widest shadow-xl border border-red-100 active:scale-90 transition-all hover:bg-red-100"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-6">
        {showNotifications && (
          <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-outline-variant/5 animate-in slide-in-from-top-4 duration-300">
             <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex justify-between items-center">
               Notification Inbox
               <span className="text-on-surface-variant/40">{unreadCount} Unread</span>
             </h3>
             <div className="space-y-6">
               {notifications.length === 0 ? (
                 <p className="text-xs font-bold text-on-surface-variant/40 italic text-center py-4 uppercase">Clear Sky. No Updates.</p>
               ) : notifications.slice(0, 5).map(n => (
                 <div key={n.id} className="flex gap-4 items-start">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                    <p className={`text-xs font-bold leading-relaxed ${n.is_read ? 'text-on-surface-variant/60' : 'text-on-surface'}`}>{n.message}</p>
                 </div>
               ))}
             </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
             <span className="material-symbols-outlined animate-spin text-primary/20 text-5xl font-black">refresh</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-[40px] p-12 text-center space-y-8 border border-outline-variant/5 shadow-2xl">
             <span className="material-symbols-outlined text-6xl text-primary/10 font-black">inventory_2</span>
             <p className="text-sm font-black text-on-surface-variant uppercase tracking-widest">No Active Submissions</p>
             <Link to="/" className="inline-block bg-primary text-white px-10 py-4 rounded-3xl font-black text-[10px] tracking-widest uppercase shadow-2xl">Create First Report</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report, idx) => (
              <div 
                key={report.id} 
                className="bg-white rounded-[40px] p-2 shadow-2xl border border-outline-variant/5 group hover:-translate-y-1 transition-all duration-500 overflow-hidden"
              >
                <div className="flex gap-4 p-4 items-center">
                   <div className="w-24 h-24 rounded-[28px] overflow-hidden bg-surface-container flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-700">
                      <img src={report.image} alt="Original" className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full tracking-widest ${
                          report.status === 'Resolved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-primary text-white shadow-lg shadow-primary/20'
                        }`}>
                          {report.status}
                        </span>
                        <span className="text-[10px] font-black text-on-surface-variant/20 tracking-tighter">{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-black text-on-surface text-lg tracking-tighter leading-none mb-1">Issue #{report.id}</h3>
                      <p className="text-xs text-on-surface-variant/60 font-medium line-clamp-1 italic italic uppercase tracking-tighter">{report.ai_description}</p>
                   </div>
                   <div className="pr-4 flex flex-col items-center">
                      <span className="text-[10px] font-black text-primary leading-none">{report.severity_score}</span>
                      <span className="text-[8px] font-black text-primary/20 uppercase tracking-[0.2em] mt-1">Score</span>
                   </div>
                </div>

                {report.status === 'Resolved' && report.resolved_image && (
                  <div className="m-2 p-6 bg-emerald-50/50 rounded-[32px] border border-emerald-100/50 animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex gap-4 items-center">
                       <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-white flex-shrink-0">
                          <img src={report.resolved_image} alt="Fixed" className="w-full h-full object-cover" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 italic">Resolution Evidence</p>
                          <p className="text-xs font-bold text-emerald-900 leading-tight">The reported issue has been verified as fixed by the infrastructure unit.</p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Nav remains same but with Tooltips */}
      <nav className="fixed bottom-6 left-6 right-6 flex justify-around items-center h-20 bg-primary/95 backdrop-blur-xl rounded-[30px] shadow-2xl z-[100] border border-white/10 px-4 max-w-2xl mx-auto">
        <Link to="/" data-tooltip="Capture Issue" className="flex flex-col items-center justify-center text-white/50 hover:text-white p-2 transition-colors">
          <span className="material-symbols-outlined text-2xl">add_box</span>
        </Link>
        <Link to="/my-reports" data-tooltip="My History" className="flex flex-col items-center justify-center text-white p-4 bg-white/10 rounded-2xl shadow-inner shadow-black/20">
          <span className="material-symbols-outlined text-2xl font-black">person_pin</span>
        </Link>
        {auth?.user?.is_staff && (
          <Link to="/dashboard" data-tooltip="Admin Desk" className="flex flex-col items-center justify-center text-white/50 hover:text-white p-2 transition-colors">
            <span className="material-symbols-outlined text-2xl">dashboard</span>
          </Link>
        )}
        <button onClick={logout} data-tooltip="Sign Out" className="flex flex-col items-center justify-center text-red-400 hover:text-red-500 p-2 transition-all">
          <span className="material-symbols-outlined text-2xl">logout</span>
        </button>
      </nav>
    </div>
  );
}

export default MyReports;
