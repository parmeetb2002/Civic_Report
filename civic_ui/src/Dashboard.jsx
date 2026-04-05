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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isHydrating && auth?.user?.is_staff) {
      fetchReports();
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

  if (!auth.user.is_staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">STAFF ONLY</h1>
        <p className="text-slate-500 mt-2 mb-8">Citizens can track their reports on their personal dashboard.</p>
        <Link to="/my-reports" className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition-all">Go to My Reports</Link>
      </div>
    );
  }

  const activeCount = reports.length;
  
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

  // Determine Map Center
  const defaultCenter = reports.length > 0 && reports[0].latitude && reports[0].longitude 
    ? [parseFloat(reports[0].latitude), parseFloat(reports[0].longitude)] 
    : BAREILLY_CENTER;

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen font-body">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-[#d4e5ea] dark:bg-slate-800 flex flex-col py-6 z-50">
        <div className="px-6 mb-10">
          <h1 className="text-xl font-black text-[#002630] dark:text-white uppercase tracking-widest font-headline">Civic Admin</h1>
          <p className="text-[10px] font-bold text-[#002630]/60 uppercase tracking-widest mt-1">City Governance</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center space-x-3 border-l-4 border-[#003d4c] bg-transparent font-bold text-[#002630] dark:text-white px-4 py-3 transition-transform duration-150 translate-x-1" href="#dashboard">
            <span className="material-symbols-outlined text-xl">dashboard</span>
            <span className="font-headline font-bold tracking-tight text-sm uppercase">Dashboard</span>
          </a>
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
              <p className="text-[10px] font-medium text-[#002630]/60 uppercase">Tier 1 Auditor</p>
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
                <p className="text-2xl font-black text-on-surface font-headline">{activeCount}</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-xl flex items-center space-x-4 min-w-[220px]">
              <div className="w-12 h-12 rounded-lg bg-on-primary-fixed-variant/10 flex items-center justify-center text-on-primary-fixed-variant">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-secondary-container uppercase tracking-wider">Resolved Weekly</p>
                <p className="text-2xl font-black text-on-surface font-headline">12</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Real Map View */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm relative group">
            <div className="p-6 border-b border-surface-container">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-on-surface flex items-center font-headline">
                  <span className="material-symbols-outlined mr-2 text-primary">location_on</span>
                  Interactive Civic Map
                </h3>
              </div>
            </div>
            <div className="h-[450px] w-full relative z-0">
              <MapContainer 
                center={defaultCenter} 
                zoom={13} 
                minZoom={11}
                maxBounds={BAREILLY_BOUNDS}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController />
                {reports.map(report => {
                  if (report.latitude && report.longitude) {
                    return (
                      <Marker key={report.id} position={[parseFloat(report.latitude), parseFloat(report.longitude)]}>
                        <Popup>
                          <div className="p-1 font-body">
                            <strong className="text-primary font-headline">Issue #{report.id}</strong>
                            <p className="text-xs mt-1 text-on-surface-variant">{report.ai_description}</p>
                            <div className="mt-2 text-[10px] font-bold uppercase text-error">Priority: {report.priority_level}</div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                  return null;
                })}
              </MapContainer>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="bg-primary p-8 rounded-xl text-on-primary flex-1 flex flex-col justify-between overflow-hidden relative">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <span className="material-symbols-outlined text-[160px]">architecture</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 font-headline">Architecture of Action</h3>
                <p className="text-on-primary-container text-sm leading-relaxed mb-6">Your city's infrastructure health is currently at <span className="text-white font-bold">88% efficiency</span>.</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="col-span-12 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-on-surface font-headline">Recent Civic Reports</h3>
                <p className="text-xs text-on-surface-variant">Real-time submission ledger</p>
              </div>
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
        <Link to="/dashboard" className="flex flex-col items-center justify-center text-primary p-2">
          <span className="material-symbols-outlined">analytics</span>
          <span className="text-[10px] font-bold mt-1">Admin</span>
        </Link>
      </nav>
    </div>
  );
}

export default Dashboard;
