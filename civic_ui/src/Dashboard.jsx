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
  const { auth, logout, isHydrating } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('map'); // 'map' or 'users'
  const [isUpdating, setIsUpdating] = useState(false);
  const [resolvingReport, setResolvingReport] = useState(null);
  const [resolutionImage, setResolutionImage] = useState(null);

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
      setUsers(users.map(u => u.id === userId ? { ...u, is_staff: response.data.is_staff } : u));
    } catch (error) {
      console.error("Error toggling staff status:", error);
      alert("Only the owner can manage power.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolutionImage) return alert("Please upload evidence.");
    
    setIsUpdating(true);
    const formData = new FormData();
    formData.append('status', 'Resolved');
    formData.append('resolved_image', resolutionImage);
    formData.append('resolved_at', new Date().toISOString());

    try {
      await axios.patch(`/api/reports/${resolvingReport.id}/`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${auth.token}` 
        }
      });
      setResolvingReport(null);
      setResolutionImage(null);
      fetchReports();
    } catch (error) {
      console.error("Resolution failed:", error);
      alert("Check connection and try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isHydrating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
      </div>
    );
  }

  if (!auth?.user || (!auth.user.is_staff && !isOwner)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Access Denied</h1>
        <p className="text-slate-500 mt-2 mb-8">This portal is reserved for Bareilly Infrastructure Inspectors.</p>
        <Link to="/my-reports" className="btn-primary max-w-xs">Return to Citizen View</Link>
      </div>
    );
  }

  const getPriorityStyle = (priority) => {
    if (priority === 'High') return 'bg-red-500';
    if (priority === 'Medium') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const BAREILLY_CENTER = [28.3670, 79.4304];
  const BAREILLY_BOUNDS = [[28.20, 79.25], [28.50, 79.60]];
  const defaultCenter = reports.length > 0 ? [parseFloat(reports[0].latitude), parseFloat(reports[0].longitude)] : BAREILLY_CENTER;

  return (
    <div className="bg-surface text-on-surface selection:bg-primary/10 min-h-screen pb-32">
      {/* Sidebar */}
      <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-white hidden lg:flex flex-col py-8 z-50 border-r border-outline-variant/10 shadow-2xl">
        <div className="px-8 mb-12">
          <h1 className="text-xl font-black text-primary tracking-tighter uppercase">Admin Console</h1>
          <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mt-1">Infrastructure Unit</p>
        </div>
        
        <nav className="flex-1 space-y-2 px-4">
          <button onClick={() => setView('map')} data-tooltip="Analytics Dashboard" className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all ${view === 'map' ? 'bg-primary text-white shadow-xl' : 'hover:bg-surface-container-low font-bold text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-xl">analytics</span>
            <span className="text-xs uppercase tracking-widest">Statistics</span>
          </button>
          {isOwner && (
            <button onClick={() => setView('users')} data-tooltip="Management" className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all ${view === 'users' ? 'bg-primary text-white shadow-xl' : 'hover:bg-surface-container-low font-bold text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-xl">groups</span>
              <span className="text-xs uppercase tracking-widest">Users</span>
            </button>
          )}
          <Link to="/" data-tooltip="Submit New Audit" className="w-full flex items-center space-x-3 px-6 py-4 rounded-2xl hover:bg-surface-container-low font-bold text-on-surface-variant transition-all">
            <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
            <span className="text-xs uppercase tracking-widest">New Entry</span>
          </Link>
        </nav>

        <div className="px-6 mt-auto">
          <div className="bg-surface-container-low rounded-[32px] p-4 border border-outline-variant/5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black">{auth.user.email?.[0].toUpperCase()}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">{auth.user.email}</p>
                    <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">{isOwner ? 'Owner' : 'Staff'}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Sign Out
                </button>
              </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-12">
        {view === 'map' ? (
          <div className="max-w-7xl mx-auto space-y-12">
            <header className="flex flex-col lg:flex-row justify-between items-end gap-6 uppercase">
              <div>
                <h2 className="text-4xl lg:text-5xl font-black text-on-surface tracking-tighter leading-none">Sector Overview</h2>
                <p className="text-on-surface-variant/40 text-[10px] font-black tracking-[0.4em] mt-3">Live Infrastructure Monitoring</p>
              </div>
              <div className="bg-white rounded-[32px] px-8 py-4 shadow-xl border border-outline-variant/5 flex items-center gap-4">
                <span className="material-symbols-outlined text-primary text-3xl font-black">pending_actions</span>
                <span className="text-3xl font-black text-on-surface tracking-tighter">{reports.length}</span>
              </div>
            </header>

            <div className="space-y-8">
              <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl border border-outline-variant/5 h-[500px] relative z-0">
                <MapContainer center={BAREILLY_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapController />
                  {reports.map(r => r.latitude && (
                    <Marker key={r.id} position={[parseFloat(r.latitude), parseFloat(r.longitude)]}>
                      <Popup>
                        <div className="p-2 font-black">
                          <p className="text-primary text-xs tracking-widest uppercase mb-1">Issue #{r.id}</p>
                          <p className="text-on-surface-variant text-[10px] uppercase line-clamp-2">{r.ai_description}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              <div className="bg-white rounded-[40px] shadow-2xl border border-outline-variant/5 overflow-hidden overscroll-x-contain">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-surface-container-low/50 border-b border-outline-variant/5 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                      <th className="px-10 py-6">Incident</th>
                      <th className="px-10 py-6">Description</th>
                      <th className="px-10 py-6">Priority</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {reports.map(r => (
                      <tr key={r.id} className="hover:bg-surface-container-low/20 transition-all">
                        <td className="px-10 py-6 font-black text-primary">#{r.id}</td>
                        <td className="px-10 py-6 text-xs font-semibold text-on-surface-variant max-w-sm"><span className="line-clamp-1">{r.ai_description}</span></td>
                        <td className="px-10 py-6">
                          <span className={`w-3 h-3 rounded-full inline-block mr-2 ${getPriorityStyle(r.priority_level)}`}></span>
                          <span className="text-[10px] font-black uppercase tracking-tighter">{r.priority_level}</span>
                        </td>
                        <td className="px-10 py-6">
                           <span className={`text-[9px] font-black px-2 py-1 rounded-full border uppercase ${r.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                             {r.status}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          {r.status !== 'Resolved' && (
                            <button onClick={() => setResolvingReport(r)} data-tooltip="Upload Fix Evidence" className="bg-primary text-white px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Resolve</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* User Management View */
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-black text-on-surface tracking-tighter uppercase">User Access Control</h2>
            <div className="bg-white rounded-[40px] shadow-2xl border border-outline-variant/5 overflow-hidden">
               <table className="w-full text-left">
                  <tbody className="divide-y divide-outline-variant/5">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-surface-container-low/20">
                        <td className="px-10 py-8">
                           <p className="font-black text-on-surface text-sm mb-1">{u.email}</p>
                           <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-black">{u.is_staff ? 'Official Inspector' : 'Sector Citizen'}</p>
                        </td>
                        <td className="px-10 py-8 text-right">
                          {u.email.toLowerCase() !== 'parmeetb2002@gmail.com' && (
                            <button onClick={() => toggleStaff(u.id)} disabled={isUpdating} className={`px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${u.is_staff ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white' : 'bg-primary text-white'}`}>
                              {u.is_staff ? 'Revoke Power' : 'Grant Power'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </main>

      {/* Resolution Modal */}
      {resolvingReport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xl p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[48px] w-full max-w-lg overflow-hidden shadow-2xl glass-modal">
             <div className="p-10 border-b border-black/5">
                <h3 className="text-2xl font-black text-primary tracking-tighter uppercase italic">Resolve Issue #{resolvingReport.id}</h3>
             </div>
             <form onSubmit={handleResolve} className="p-10 space-y-8">
                <div onClick={() => document.getElementById('resImg').click()} className="aspect-video rounded-[32px] border-4 border-dashed border-outline-variant/20 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low transition-all">
                   <input type="file" id="resImg" className="hidden" onChange={(e) => setResolutionImage(e.target.files[0])} accept="image/*" />
                   {resolutionImage ? (
                     <p className="text-xs font-black text-primary uppercase tracking-widest">{resolutionImage.name}</p>
                   ) : (
                     <div className="text-center">
                        <span className="material-symbols-outlined text-4xl text-primary/20">add_a_photo</span>
                        <p className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mt-2">Upload Evidence of Fix</p>
                     </div>
                   )}
                </div>
                <div className="flex gap-4">
                   <button type="button" onClick={() => setResolvingReport(null)} className="flex-1 bg-surface-container-highest py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                   <button type="submit" disabled={!resolutionImage || isUpdating} className="flex-2 bg-primary text-white py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl px-8 disabled:opacity-30">Submit Resolution</button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-20 bg-primary/95 backdrop-blur-xl rounded-[30px] flex justify-around items-center px-4 z-[100] border border-white/10 shadow-2xl">
         <Link to="/" data-tooltip="Report Home" className="text-white/50 hover:text-white p-3"><span className="material-symbols-outlined text-2xl">add_box</span></Link>
         <Link to="/my-reports" data-tooltip="User Feed" className="text-white/50 hover:text-white p-3"><span className="material-symbols-outlined text-2xl">person_pin</span></Link>
         <button onClick={() => setView('map')} data-tooltip="Analytics" className={`p-3 rounded-2xl transition-all ${view === 'map' ? 'bg-white text-primary' : 'text-white/50'}`}><span className="material-symbols-outlined text-2xl">dashboard</span></button>
         {isOwner && (
           <button onClick={() => setView('users')} data-tooltip="Access" className={`p-3 rounded-2xl transition-all ${view === 'users' ? 'bg-white text-primary' : 'text-white/50'}`}><span className="material-symbols-outlined text-2xl">groups</span></button>
         )}
      </nav>
    </div>
  );
}

export default Dashboard;
