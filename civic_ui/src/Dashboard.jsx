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

  useEffect(() => {
    if (!isHydrating && auth?.user?.is_staff) {
      fetchReports();
      if (auth.user.email?.toLowerCase() === 'parmeetb2002@gmail.com') {
        fetchUsers();
      }
    } else if (!isHydrating) {
      setIsLoading(false);
    }
  }, [auth, isHydrating]);

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

  // Allow the owner to see the dashboard regardless of is_staff flag
  const isOwner = auth.user.email?.toLowerCase() === 'parmeetb2002@gmail.com';
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
    <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen font-body pb-24">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-[#d4e5ea] dark:bg-slate-800 flex flex-col py-6 z-50">
        <div className="px-6 mb-10">
          <h1 className="text-xl font-black text-[#002630] dark:text-white uppercase tracking-widest font-headline">Civic Admin</h1>
          <p className="text-[10px] font-bold text-[#002630]/60 uppercase tracking-widest mt-1">City Governance</p>
        </div>
        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setView('map')}
            className={`w-full flex items-center space-x-3 px-4 py-3 transition-all ${
              view === 'map' 
                ? 'border-l-4 border-[#003d4c] text-[#002630] font-bold bg-[#f3f4f5]/30' 
                : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-[#f3f4f5]/50'
            }`}
          >
            <span className="material-symbols-outlined text-xl">dashboard</span>
            <span className="font-headline font-bold tracking-tight text-sm uppercase text-left">Dashboard</span>
          </button>

          {isOwner && (
            <button 
              onClick={() => setView('users')}
              className={`w-full flex items-center space-x-3 px-4 py-3 transition-all ${
                view === 'users' 
                  ? 'border-l-4 border-[#003d4c] text-[#002630] font-bold bg-[#f3f4f5]/30' 
                  : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-[#f3f4f5]/50'
              }`}
            >
              <span className="material-symbols-outlined text-xl">manage_accounts</span>
              <span className="font-headline font-bold tracking-tight text-sm uppercase text-left">Users</span>
            </button>
          )}

          <Link to="/" className="flex items-center space-x-3 text-slate-600 dark:text-slate-400 font-medium px-4 py-3 hover:bg-[#f3f4f5]/50 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-xl">report_problem</span>
            <span className="font-headline font-bold tracking-tight text-sm uppercase">Make Report</span>
          </Link>
        </nav>
        <div className="px-6 mt-auto pt-6 border-t border-[#003d4c]/10">
          <div className="flex items-center space-x-3">
            <img alt="Admin" className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDh9TjWz3ojgUkisZ2KkwR5cqDtqPRpQCzLLZfA52PgbF3FuDFjUoXlzK27L81m4T27WoYgOEMpzaDJQlqv-WV3_iP7LgTfe19apQe3-tPJQ98OBkG3JN-oVs_GraA5VPbJ78S9MqAtzltkfCHHTfX_WkvMTszYePqobe6V3pK6L8AXb4QaCswVwnAUBKtKmuYhuc0JGl6ddidtGpu2eWwI9NwPb4ATy3B9P312logyS6ZToiWp0ldnxE-Ok0qGdba6H3iAAUo8zX8j"/>
            <div>
              <p className="text-sm font-bold text-[#002630] truncate w-32">{auth?.user?.email}</p>
              <p className="text-[10px] font-medium text-[#002630]/60 uppercase">{auth.user.is_staff ? 'Auditor' : 'Owner'}</p>
            </div>
          </div>
          <div className="mt-4"><Login /></div>
        </div>
      </aside>

      {/* TopNavBar */}
      <header className="w-full sticky top-0 z-40 bg-[#f8f9fa] dark:bg-slate-900 border-b border-[#003d4c]/15 dark:border-slate-800 shadow-[0_20px_40px_rgba(0,31,40,0.06)]">
        <div className="flex justify-between items-center h-16 px-8 ml-64">
          <div className="flex items-center space-x-6">
            <span className="text-lg font-bold text-[#191c1d] dark:text-slate-100 font-headline">Statesman Console</span>
            <div className="relative group lg:block hidden">
              <span className="absolute inset-y-0 left-3 flex items-center text-outline">
                <span className="material-symbols-outlined text-lg">search</span>
              </span>
              <input className="bg-surface-container-high border-none rounded-lg py-2 pl-10 pr-4 text-sm w-80 focus:ring-1 focus:ring-primary-container transition-all text-black" placeholder="Search incidents..." type="text"/>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {view === 'map' ? (
          <>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div>
                <span className="text-[10px] font-bold text-on-primary-fixed-variant uppercase tracking-[0.2em] mb-2 block">System Overview</span>
                <h2 className="text-3xl font-extrabold text-on-surface tracking-tight leading-none font-headline">Administrative Dashboard</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-container-lowest p-5 rounded-xl flex items-center space-x-4 min-w-[220px]">
                  <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-2xl">pending_actions</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-secondary-container uppercase tracking-wider">Active Issues</p>
                    <p className="text-2xl font-black text-on-surface font-headline">{reports.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm relative group">
                <div className="p-6 border-b border-surface-container">
                  <h3 className="text-lg font-bold text-on-surface flex items-center font-headline">
                    <span className="material-symbols-outlined mr-2 text-primary">location_on</span>
                    Interactive Civic Map
                  </h3>
                </div>
                <div className="h-[450px] w-full relative z-0">
                  <MapContainer center={defaultCenter} zoom={13} minZoom={11} maxBounds={BAREILLY_BOUNDS} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapController />
                    {reports.map(report => report.latitude && (
                      <Marker key={report.id} position={[parseFloat(report.latitude), parseFloat(report.longitude)]}>
                        <Popup>
                          <div className="p-1 font-body">
                            <strong className="text-primary font-headline">Issue #{report.id}</strong>
                            <p className="text-xs mt-1 text-on-surface-variant">{report.ai_description}</p>
                            <div className="mt-2 text-[10px] font-bold uppercase text-error">Priority: {report.priority_level}</div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>

              {/* Table */}
              <div className="col-span-12 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                <div className="px-8 py-6">
                  <h3 className="text-lg font-bold text-on-surface font-headline">Recent Civic Reports</h3>
                  <p className="text-xs text-on-surface-variant">Real-time submission ledger</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low">
                      <tr>
                        {['Issue ID', 'Description', 'Priority', 'Severity', 'Created'].map(h => (
                          <th key={h} className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.1em] font-headline">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {isLoading ? (
                        <tr><td colSpan="5" className="px-8 py-5 text-center">Loading...</td></tr>
                      ) : reports.length === 0 ? (
                        <tr><td colSpan="5" className="px-8 py-5 text-center">No reports active.</td></tr>
                      ) : reports.map(report => (
                        <tr key={report.id} className="hover:bg-surface-container-low transition-colors group">
                          <td className="px-8 py-5 font-['Inter'] text-sm font-bold text-primary">#{report.id}</td>
                          <td className="px-8 py-5 text-sm text-on-surface max-w-xs">{report.ai_description || 'Pending...'}</td>
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${getPriorityStyle(report.priority_level).split(' ')[0]}`}></div>
                              <span className={`text-xs font-bold uppercase ${getPriorityStyle(report.priority_level).split(' ')[1]}`}>{report.priority_level}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-sm">{report.severity_score}/10</td>
                          <td className="px-8 py-5 text-xs text-on-surface-variant">{new Date(report.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* User Management View */
          <div className="max-w-5xl mx-auto anime-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-on-surface tracking-tight font-headline">User Permissions</h2>
              <p className="text-on-surface-variant text-sm mt-1">Elevate citizens to staff status or revoke access.</p>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-[#003d4c]/10">
              <table className="w-full text-left">
                <thead className="bg-[#f8f9fa] border-b border-[#003d4c]/10">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-[#002630] uppercase tracking-widest font-headline">User Email</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#002630] uppercase tracking-widest font-headline text-center">Role</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#002630] uppercase tracking-widest font-headline text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#003d4c]/5">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-[#f3f4f5]/30">
                      <td className="px-8 py-6 font-bold text-sm text-[#002630]">{user.email} {user.email?.toLowerCase() === 'parmeetb2002@gmail.com' && <span className="ml-2 text-[8px] bg-primary text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">Owner</span>}</td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.is_staff ? 'bg-[#002630] text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {user.is_staff ? 'Admin' : 'Citizen'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {user.email?.toLowerCase() !== 'parmeetb2002@gmail.com' && (
                          <button 
                            disabled={isUpdating}
                            onClick={() => toggleStaff(user.id)}
                            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
                              user.is_staff 
                                ? 'bg-error-container text-on-error-container hover:bg-error hover:text-white' 
                                : 'bg-primary text-white hover:opacity-90'
                            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {user.is_staff ? 'Revoke Access' : 'Make Admin'}
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

      {/* Navigation for Staff */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-6 pb-8 pt-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_30px_rgb(0,38,49,0.06)] z-[50]">
        <Link to="/" className="flex flex-col items-center justify-center text-slate-400 p-2">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-[10px] font-bold mt-1">Report</span>
        </Link>
        <Link to="/my-reports" className="flex flex-col items-center justify-center text-slate-400 p-2">
          <span className="material-symbols-outlined">list_alt</span>
          <span className="text-[10px] font-bold mt-1">My Reports</span>
        </Link>
        <button onClick={() => setView('map')} className={`flex flex-col items-center justify-center p-2 ${view === 'map' ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">analytics</span>
          <span className="text-[10px] font-bold mt-1">Admin</span>
        </button>
      </nav>
    </div>
  );
}

export default Dashboard;
