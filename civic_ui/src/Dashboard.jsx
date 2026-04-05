import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { Link } from 'react-router-dom';
import Login from './Login';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to fix the "Grey Tiles" issue by forcing a resize recalculation
function MapController() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

function Dashboard() {
  const { auth, isHydrating } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('map'); // 'map' or 'users'
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwner = auth?.user?.email?.toLowerCase() === 'parmeetb2002@gmail.com';

  useEffect(() => {
    if (!isHydrating && (auth?.user?.is_staff || isOwner)) {
      fetchReports();
      if (isOwner) {
        fetchUsers();
      }
    } else if (!isHydrating) {
      setIsLoading(false);
    }
  }, [auth, isHydrating, isOwner]);

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/reports/', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users/', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const toggleStaff = async (userId) => {
    setIsUpdating(true);
    try {
      const response = await axios.post('/api/users/toggle-staff/', { user_id: userId }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, is_staff: response.data.is_staff } : u));
    } catch (error) {
      console.error("Error toggling staff status:", error);
      alert("Failed to update user status. Only the owner can perform this action.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isHydrating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="animate-spin text-primary-container">
          <span className="material-symbols-outlined text-4xl">refresh</span>
        </div>
      </div>
    );
  }

  if (!auth?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">RESTRICTED AREA</h1>
        <p className="text-slate-500 mt-2 mb-8">Please login as a staff member to view analytics.</p>
        <Login />
      </div>
    );
  }

  if (!auth.user.is_staff && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">STAFF ONLY</h1>
        <p className="text-slate-500 mt-2 mb-8">Citizens can track their reports on their personal dashboard.</p>
        <Link to="/my-reports" className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition-all">Go to My Reports</Link>
      </div>
    );
  }

  const getPriorityStyle = (priority) => {
    if (priority === 'High') return 'bg-error text-error';
    if (priority === 'Medium') return 'bg-on-tertiary-container text-on-tertiary-container';
    return 'bg-primary-container text-primary-container';
  };

  // Bareilly, Uttar Pradesh Geofencing
  const BAREILLY_CENTER = [28.3670, 79.4304];
  const BAREILLY_BOUNDS = [
    [28.20, 79.25], // Southwest
    [28.50, 79.60]  // Northeast
  ];

  const defaultCenter = reports.length > 0 && reports[0].latitude && reports[0].longitude 
    ? [parseFloat(reports[0].latitude), parseFloat(reports[0].longitude)] 
    : BAREILLY_CENTER;

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen font-body pb-32">
      {/* SideNavBar - Hidden on small screens */}
      <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-[#eef2f3] dark:bg-slate-900 hidden lg:flex flex-col py-8 z-50 border-r border-outline-variant/10 shadow-2xl">
        <div className="px-8 mb-12">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
            <h1 className="text-xl font-black text-primary uppercase tracking-tighter font-headline leading-none">Civic Admin</h1>
          </div>
          <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">City Governance Portal</p>
        </div>
        
        <nav className="flex-1 space-y-2 px-4">
          <button 
            onClick={() => setView('map')}
            className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all ${
              view === 'map' 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-on-surface-variant font-bold hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-xl">analytics</span>
            <span className="font-headline font-bold tracking-tight text-sm uppercase">Statistics</span>
          </button>

          {isOwner && (
            <button 
              onClick={() => setView('users')}
              className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all ${
                view === 'users' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-on-surface-variant font-bold hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-xl">manage_accounts</span>
              <span className="font-headline font-bold tracking-tight text-sm uppercase">User Access</span>
            </button>
          )}

          <div className="pt-4 border-t border-outline-variant/10 mt-4">
            <Link to="/" className="w-full flex items-center space-x-3 px-6 py-4 rounded-2xl text-on-surface-variant font-bold hover:bg-surface-container-low transition-all">
              <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
              <span className="font-headline font-bold tracking-tight text-sm uppercase">New Report</span>
            </Link>
          </div>
        </nav>

        <div className="px-6 mt-auto pt-8 border-t border-outline-variant/10">
          <div className="bg-white/50 rounded-3xl p-4 border border-outline-variant/5 shadow-inner">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black">
                {auth?.user?.email?.[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-on-surface truncate">{auth?.user?.email}</p>
                <p className="text-[9px] font-black text-primary uppercase tracking-widest">{isOwner ? 'Root Owner' : 'Inspector'}</p>
              </div>
            </div>
            <Login />
          </div>
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="w-full sticky top-0 z-40 bg-surface/80 backdrop-blur-3xl border-b border-outline-variant/10 shadow-sm">
        <div className="flex justify-between items-center h-20 px-6 lg:ml-64 ml-0">
          <div className="flex items-center gap-4">
            <div className="lg:hidden flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl font-black">account_balance</span>
            </div>
            <h2 className="text-xl font-black text-primary font-headline tracking-tighter leading-none">Console <span className="text-on-surface-variant/30 font-light">/</span> {view === 'map' ? 'Stats' : 'Users'}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest leading-none mb-1">Live Feed</span>
              <div className="flex items-center gap-1.5 font-black text-xs text-primary">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                BAREILLY ACTIVE
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 ml-0 p-4 lg:p-12 animate-in fade-in duration-700">
        {view === 'map' ? (
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-4">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3 block">Reporting Operations</span>
                <h2 className="text-4xl lg:text-5xl font-black text-on-surface tracking-tighter leading-none font-headline">Infrastructure Overview</h2>
              </div>
              
              <div className="flex gap-4">
                <div className="bg-white rounded-3xl px-8 py-4 shadow-xl border border-outline-variant/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl font-black">pending_actions</span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-on-surface leading-none tracking-tighter">{reports.length}</p>
                    <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mt-1">Active Cases</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 bg-white rounded-[40px] overflow-hidden shadow-2xl border border-outline-variant/5 group transition-all">
                <div className="p-8 border-b border-outline-variant/5 flex items-center justify-between">
                  <h3 className="text-xl font-black text-on-surface flex items-center font-headline tracking-tighter uppercase">
                    <span className="material-symbols-outlined mr-3 text-primary text-3xl font-black">satellite_alt</span>
                    Geo-Spatial Visualization
                  </h3>
                  <div className="hidden sm:block text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">District: Bareilly, UP</div>
                </div>
                <div className="h-[450px] lg:h-[600px] w-full relative z-0">
                  <MapContainer center={defaultCenter} zoom={13} minZoom={11} maxBounds={BAREILLY_BOUNDS} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapController />
                    {reports.map(report => report.latitude && (
                      <Marker key={report.id} position={[parseFloat(report.latitude), parseFloat(report.longitude)]}>
                        <Popup>
                          <div className="p-3 font-body min-w-[200px]">
                            <div className="flex justify-between items-start mb-2">
                              <strong className="text-primary font-headline text-lg">#{report.id}</strong>
                              <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                                report.priority_level === 'High' ? 'bg-red-100 text-red-600' : 
                                report.priority_level === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {report.priority_level}
                              </span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-on-surface mb-3 line-clamp-3">{report.ai_description}</p>
                            <div className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Detected: {new Date(report.created_at).toLocaleDateString()}</div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>

              {/* Responsive Table/List */}
              <div className="col-span-12 bg-white rounded-[40px] shadow-2xl border border-outline-variant/5 overflow-hidden">
                <div className="px-8 py-8 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-on-surface font-headline tracking-tighter uppercase mb-1 flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-3xl font-black">list_alt</span>
                      Incident Log
                    </h3>
                    <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Real-time submission stream</p>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-surface-container-low border-y border-outline-variant/5">
                        {['Case ID', 'Analysis Description', 'Urgency', 'Triage Score', 'Timestamp'].map(h => (
                          <th key={h} className="px-10 py-5 text-[10px] font-black text-on-surface-variant/50 uppercase tracking-[0.2em] font-headline">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {isLoading ? (
                        <tr><td colSpan="5" className="px-10 py-20 text-center text-on-surface-variant animate-pulse font-black italic uppercase tracking-widest text-sm">Initializing System Feed...</td></tr>
                      ) : reports.length === 0 ? (
                        <tr><td colSpan="5" className="px-10 py-20 text-center text-on-surface-variant font-bold italic tracking-widest text-sm">No active reports detected in sector.</td></tr>
                      ) : reports.map(report => (
                        <tr key={report.id} className="hover:bg-surface-container-low/50 transition-all group cursor-pointer border-l-4 border-transparent hover:border-primary">
                          <td className="px-10 py-6 font-['Inter'] text-sm font-black text-primary">#{report.id}</td>
                          <td className="px-10 py-6 text-sm text-on-surface font-medium max-w-sm">
                            <span className="line-clamp-2">{report.ai_description || 'Pending Analysis...'}</span>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                                report.priority_level === 'High' ? 'bg-red-500' : 
                                report.priority_level === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}></div>
                              <span className="text-xs font-black uppercase tracking-tighter text-on-surface">{report.priority_level}</span>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <div className="flex items-end gap-1">
                              <span className="text-xl font-black text-on-surface leading-none">{report.severity_score}</span>
                              <span className="text-[10px] font-black text-on-surface-variant/30 uppercase mb-0.5">/10</span>
                            </div>
                          </td>
                          <td className="px-10 py-6 text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest">{new Date(report.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* User Management View - Refined */
          <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-4">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3 block">Security Center</span>
                <h2 className="text-4xl lg:text-5xl font-black text-on-surface tracking-tighter leading-none font-headline">Access Control</h2>
                <p className="text-on-surface-variant/60 font-medium text-lg mt-3 max-w-lg">Manage administrative privileges and oversee citizen participation across the Bareilly sector.</p>
              </div>
              
              <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl mb-2">lock_person</span>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Root Protection Active</p>
              </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl border border-outline-variant/10 overflow-hidden transform hover:scale-[1.005] transition-all">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px] border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/5">
                      <th className="px-10 py-6 text-[10px] font-black text-on-surface uppercase tracking-[0.2em] font-headline">Identity (Email)</th>
                      <th className="px-10 py-6 text-[10px] font-black text-on-surface uppercase tracking-[0.2em] font-headline text-center">Authorization</th>
                      <th className="px-10 py-6 text-[10px] font-black text-on-surface uppercase tracking-[0.2em] font-headline text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {users.map(user => {
                      const isTargetOwner = user.email?.toLowerCase() === 'parmeetb2002@gmail.com';
                      return (
                        <tr key={user.id} className="hover:bg-surface-container-low transition-all group">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg ${isTargetOwner ? 'bg-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                                {user.email?.[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-black text-on-surface tracking-tight text-sm mb-1">{user.email}</p>
                                {isTargetOwner && (
                                  <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px] text-primary">verified</span>
                                    <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-black">System Root</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-center uppercase tracking-widest font-black text-xs">
                            <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-2xl border ${
                              user.is_staff 
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                                : 'bg-surface-container-low text-on-surface-variant/40 border-outline-variant/10'
                            }`}>
                              <span className="material-symbols-outlined text-sm">{user.is_staff ? 'admin_panel_settings' : 'person'}</span>
                              {user.is_staff ? 'Officer' : 'Citizen'}
                            </div>
                          </td>
                          <td className="px-10 py-8 text-right">
                            {!isTargetOwner && (
                              <button 
                                disabled={isUpdating}
                                onClick={() => toggleStaff(user.id)}
                                className={`group/btn relative px-8 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all overflow-hidden ${
                                  user.is_staff 
                                    ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' 
                                    : 'bg-primary text-white hover:opacity-90 hover:scale-105 active:scale-95'
                                } ${isUpdating ? 'opacity-30 cursor-not-allowed' : ''}`}
                              >
                                <span className={isUpdating ? 'animate-pulse' : ''}>
                                  {user.is_staff ? 'Revoke Power' : 'Grant Power'}
                                </span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation for Staff - Bottom Bar (Mobile Only) */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 flex justify-around items-center h-20 bg-primary rounded-[30px] shadow-2xl z-[100] border border-white/10 px-4">
        <Link to="/" className="flex flex-col items-center justify-center text-white/50 hover:text-white p-2">
          <span className="material-symbols-outlined text-2xl">add_box</span>
        </Link>
        <Link to="/my-reports" className="flex flex-col items-center justify-center text-white/50 hover:text-white p-2">
          <span className="material-symbols-outlined text-2xl">person_pin</span>
        </Link>
        <button 
          onClick={() => setView('map')} 
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${view === 'map' ? 'bg-white text-primary shadow-lg' : 'text-white/50'}`}
        >
          <span className="material-symbols-outlined text-2xl font-black">dashboard</span>
        </button>
        {isOwner && (
          <button 
            onClick={() => setView('users')} 
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${view === 'users' ? 'bg-white text-primary shadow-lg' : 'text-white/50'}`}
          >
            <span className="material-symbols-outlined text-2xl font-black">groups</span>
          </button>
        )}
      </nav>
    </div>
  );
}

export default Dashboard;
