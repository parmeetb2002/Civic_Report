import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import Login from './Login';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons
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

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16);
    }
  }, [center, map]);
  return null;
}

function ReportForm() {
  const { auth, isHydrating } = useContext(AuthContext);
  const [imageFile, setImageFile] = useState(null);
  const [location, setLocation] = useState({ lat: 28.3670, lon: 79.4304 }); // Default Bareilly
  const [hasDetected, setHasDetected] = useState(false);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(5);
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (auth?.token) {
        try {
          const res = await axios.get('/api/notifications/', {
            headers: { Authorization: `Bearer ${auth.token}` }
          });
          const unread = res.data.filter(n => !n.is_read).length;
          setUnreadNotifications(unread);
        } catch (err) {
          console.error("Notification fetch failed", err);
        }
      }
    };
    fetchNotifications();
  }, [auth]);

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Start AI Analysis immediately
      setIsAnalyzing(true);
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const res = await axios.post('/api/analyze/', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data'
          }
        });
        setDescription(res.data.description);
        setSeverity(res.data.severity);
        if (res.data.error) {
          console.warn("AI Warning:", res.data.error);
        }
      } catch (err) {
        console.error("AI Analysis failed", err);
        const detailedError = err.response?.data?.error || err.message || "Unknown error";
        setDescription(`AI Analysis unavailable. (${detailedError}). Please describe the issue manually.`);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleDetectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        setLocation({
          lat: position.coords.latitude.toFixed(6),
          lon: position.coords.longitude.toFixed(6)
        });
        setHasDetected(true);
        setStatusMsg('Location detected successfully.');
      });
    } else {
      setStatusMsg("Geolocation is not available.");
    }
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      setStatusMsg('Please provide an image.');
      return;
    }

    setIsLoading(true);
    setStatusMsg('');

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('latitude', location.lat || '0.00');
    formData.append('longitude', location.lon || '0.00');
    formData.append('ai_description', description);
    formData.append('severity_score', severity);

    try {
      const response = await axios.post('/api/reports/', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      setStatusMsg(`Success! Incident reported with priority: ${response.data.priority_level}`);
      setImageFile(null);
      setDescription('');
      setHasDetected(false);
    } catch (err) {
      console.error(err);
      const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      setStatusMsg(`Failed to submit: ${errorDetail}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard this report?")) {
      setImageFile(null);
      setLocation({ lat: 28.3670, lon: 79.4304 });
      setDescription('');
      setHasDetected(false);
      setStatusMsg('Report discarded.');
    }
  };

  if (isHydrating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface text-primary/30">
        <span className="material-symbols-outlined animate-spin text-4xl">refresh</span>
      </div>
    );
  }

  if (!auth?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface px-6 text-center space-y-8 animate-in fade-in duration-700">
        <div className="w-24 h-24 rounded-[32px] bg-primary flex items-center justify-center text-white shadow-2xl rotate-3">
          <span className="material-symbols-outlined text-5xl font-black">lock</span>
        </div>
        <div>
          <h2 className="text-3xl font-black text-on-surface font-headline tracking-tighter">Sign In Required</h2>
          <p className="text-on-surface-variant mt-3 max-w-xs mx-auto font-medium">Please authenticate to help the Bareilly Administration keep our city infrastructure robust.</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-outline-variant/10">
          <Login />
        </div>
      </div>
    );
  }

  const isOwner = auth?.user?.email?.toLowerCase() === 'parmeetb2002@gmail.com';
  const showAdminLink = auth?.user?.is_staff || isOwner;

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32 selection:bg-primary/10">
      <header className="px-6 pt-12 pb-8 flex items-center justify-between max-w-2xl mx-auto">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-primary leading-none mb-1">Bareilly Civic</h1>
          <p className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-[0.2em]">Infrastructure Audit Unit</p>
        </div>
        {showAdminLink && (
          <Link to="/dashboard" data-tooltip="Admin Dashboard" className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-2xl font-black">dashboard</span>
          </Link>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-10">
        
        {statusMsg && (
          <div className="bg-primary text-white p-5 rounded-[24px] font-black text-sm flex items-center gap-4 shadow-xl animate-in slide-in-from-top-4 duration-500">
            <span className="material-symbols-outlined text-2xl">verified</span>
            {statusMsg}
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-primary font-black text-xs tracking-[0.2em] uppercase">Visual Evidence</h2>
          </div>
          <div className="relative group" onClick={() => document.getElementById('fileInput').click()}>
            <div className="aspect-square sm:aspect-[16/9] w-full rounded-[40px] bg-white flex flex-col items-center justify-center border-4 border-dashed border-outline-variant/20 overflow-hidden cursor-pointer hover:bg-surface-container-low transition-all shadow-2xl group-active:scale-[0.98]">
              {imageFile ? (
                <>
                  <img className="absolute inset-0 w-full h-full object-cover" alt="Selected issue" src={URL.createObjectURL(imageFile)} />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-black uppercase tracking-widest text-xs bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">Change Photo</span>
                  </div>
                </>
              ) : (
                <div className="relative z-10 flex flex-col items-center space-y-4 animate-bounce">
                  <div className="w-20 h-20 rounded-[30px] bg-primary/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-4xl font-black">photo_camera</span>
                  </div>
                  <div className="text-center">
                    <p className="text-on-surface font-black uppercase tracking-tighter text-lg">Tap to Capture</p>
                    <p className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-widest mt-1">Live Evidence Submission</p>
                  </div>
                </div>
              )}
            </div>
            <input 
              type="file" 
              id="fileInput" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        </section>

        {(imageFile || isAnalyzing) && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-primary font-black text-xs tracking-[0.2em] uppercase">AI Triage Analysis</h2>
              {isAnalyzing && <span className="text-[10px] font-black text-primary animate-pulse uppercase tracking-widest">Processing...</span>}
            </div>
            <div className="bg-white rounded-[32px] p-6 shadow-2xl border border-outline-variant/5">
              {isAnalyzing ? (
                <div className="flex flex-col items-center py-8 space-y-4">
                  <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-on-surface-variant/60 uppercase tracking-widest">Gemini is auditing payload...</p>
                </div>
              ) : (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-transparent border-none text-on-surface font-bold text-lg leading-tight focus:ring-0 p-0 placeholder:text-on-surface-variant/20"
                  placeholder="Reviewing AI metadata..."
                  rows={4}
                />
              )}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-primary font-black text-xs tracking-[0.2em] uppercase">Location Context</h2>
          </div>
          <div onClick={handleDetectLocation} className="bg-white rounded-[32px] p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container-low transition-all shadow-xl border border-outline-variant/5">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[24px] bg-primary flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-3xl font-black">my_location</span>
              </div>
              <div className="min-w-0">
                <p className="font-black text-on-surface tracking-tighter uppercase text-xl leading-none mb-1">Detect GPS</p>
                <p className="text-on-surface-variant/40 text-[10px] font-black uppercase tracking-widest truncate">
                  {location.lat ? `${location.lat}, ${location.lon}` : 'Sector Coordinate Lock'}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary text-3xl font-black opacity-20 group-hover:opacity-100 transition-opacity">gps_fixed</span>
          </div>
          <div className="w-full h-64 rounded-[40px] overflow-hidden relative shadow-2xl border-4 border-white z-0 transform hover:scale-[1.01] transition-transform">
            <MapContainer 
              center={[location.lat, location.lon]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController />
              {hasDetected && <Marker position={[location.lat, location.lon]} />}
              <MapUpdater center={hasDetected ? [location.lat, location.lon] : null} />
            </MapContainer>
          </div>
        </section>
      </main>


      <nav className="fixed bottom-6 left-6 right-6 flex justify-around items-center h-20 bg-primary/95 backdrop-blur-3xl rounded-[30px] shadow-2xl z-[100] border border-white/10 px-6 max-w-2xl mx-auto">
        <button onClick={handleDiscard} data-tooltip="Clear Draft" className="flex flex-col items-center justify-center text-white/50 hover:text-white p-2 transition-all">
          <span className="material-symbols-outlined text-2xl">delete_sweep</span>
        </button>
        
        <Link to="/my-reports" data-tooltip="Participation Feed" className="flex flex-col items-center justify-center text-white/50 hover:text-white p-2 transition-all relative">
          <span className="material-symbols-outlined text-2xl">person_pin</span>
          {unreadNotifications > 0 && <span className="notification-dot"></span>}
        </Link>
        
        <button 
          onClick={handleSubmit}
          disabled={isLoading || isAnalyzing || !imageFile}
          data-tooltip={imageFile ? "Submit Findings" : "Camera Required"}
          className={`flex flex-col items-center justify-center rounded-[20px] w-16 h-16 shadow-2xl transition-all active:scale-90 -mt-10 border-4 border-surface ${isLoading || isAnalyzing || !imageFile ? 'bg-white/10 text-white/20' : 'bg-white text-primary'}`}
        >
          <span className="material-symbols-outlined text-3xl font-black">{isLoading ? 'refresh' : 'send'}</span>
        </button>

        <button onClick={() => setShowGuide(true)} data-tooltip="Field Guide" className="flex flex-col items-center justify-center text-white/50 hover:text-white p-2 transition-all">
          <span className="material-symbols-outlined text-2xl">help</span>
        </button>

        {auth?.user?.is_staff && (
          <Link to="/dashboard" data-tooltip="Staff Portal" className="flex flex-col items-center justify-center text-white/50 hover:text-white p-2 transition-all">
            <span className="material-symbols-outlined text-2xl">dashboard</span>
          </Link>
        )}
      </nav>

      {/* Modern Static Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl relative">
            <button onClick={() => setShowGuide(false)} className="absolute top-6 right-6 z-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full p-2 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="bg-primary/5 p-8">
              <h3 className="text-3xl font-black text-primary tracking-tighter mb-2">Instructions</h3>
              <p className="text-on-surface-variant font-medium">Follow these steps to submit a perfect report:</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center text-primary font-black text-xl shrink-0">1</div>
                <div>
                  <p className="font-bold text-on-surface">Snap Evidence</p>
                  <p className="text-sm text-on-surface-variant">Tap the upload area to take a clear, well-lit photo of the infrastructure issue.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center text-primary font-black text-xl shrink-0">2</div>
                <div>
                  <p className="font-bold text-on-surface">Detect Location</p>
                  <p className="text-sm text-on-surface-variant">Tap 'Detect Location' to automatically grab the exact GPS coordinates for the inspectors.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center text-primary font-black text-xl shrink-0">3</div>
                <div>
                  <p className="font-bold text-on-surface">Review & Send</p>
                  <p className="text-sm text-on-surface-variant">Review the AI-generated description (edit if needed) and tap the middle Send button.</p>
                </div>
              </div>
              <button onClick={() => setShowGuide(false)} className="w-full bg-primary text-white py-4 rounded-3xl font-black uppercase text-sm shadow-lg active:scale-95 transition-transform mt-4">Got it!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportForm;
