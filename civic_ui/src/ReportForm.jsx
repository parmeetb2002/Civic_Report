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
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface px-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-primary shadow-inner">
          <span className="material-symbols-outlined text-4xl">lock</span>
        </div>
        <div>
          <h2 className="text-2xl font-black text-on-surface font-headline">Authentication Required</h2>
          <p className="text-on-surface-variant mt-2 max-w-xs mx-auto">Please sign in with your Google account to help Bareilly stay safe and beautiful.</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-outline-variant/30">
          <Login />
        </div>
      </div>
    );
  }

  const isOwner = auth?.user?.email?.toLowerCase() === 'parmeetb2002@gmail.com';
  const showAdminLink = auth?.user?.is_staff || isOwner;

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="px-6 pt-10 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-primary">Bareilly Civic</h1>
          <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">Report Infrastructure Issues</p>
        </div>
        {showAdminLink && (
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined">analytics</span>
          </Link>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-6 space-y-8">
        
        {statusMsg && (
          <div className="bg-primary/10 text-primary border border-primary/20 p-4 rounded-2xl font-bold flex items-center gap-3 animate-pulse">
            <span className="material-symbols-outlined">check_circle</span>
            {statusMsg}
          </div>
        )}

        <section>
          <div className="relative group" onClick={() => document.getElementById('fileInput').click()}>
            <div className="aspect-[4/3] w-full rounded-3xl bg-surface-container-lowest flex flex-col items-center justify-center border-4 border-dashed border-outline-variant/40 overflow-hidden cursor-pointer hover:bg-surface-container-low transition-colors shadow-inner">
              {imageFile ? (
                <img className="absolute inset-0 w-full h-full object-cover" alt="Selected issue" src={URL.createObjectURL(imageFile)} />
              ) : (
                <div className="relative z-10 flex flex-col items-center animate-bounce">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <span className="material-symbols-outlined text-4xl">photo_camera</span>
                  </div>
                  <p className="text-on-surface-variant font-black uppercase tracking-tighter">Capture Issue</p>
                  <p className="text-on-surface-variant/60 text-xs mt-1">Tap to capture live photo</p>
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
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h2 className="text-primary font-black text-xl tracking-tighter uppercase">AI Review</h2>
              {isAnalyzing && <span className="text-xs font-bold text-primary animate-pulse">Processing with AI...</span>}
            </div>
            <div className="bg-surface-container-highest rounded-3xl p-6 shadow-md border border-outline-variant/20">
              {isAnalyzing ? (
                <div className="flex flex-col items-center py-4 space-y-3">
                  <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-on-surface-variant">Gemini is describing the issue...</p>
                </div>
              ) : (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-transparent border-none text-on-surface font-medium text-sm leading-relaxed focus:ring-0 p-0"
                  placeholder="Review AI description here..."
                  rows={4}
                />
              )}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-primary font-black text-xl tracking-tighter uppercase">Incident Location</h2>
          <div onClick={handleDetectLocation} className="bg-surface-container-low rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-all shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary shadow-lg group-active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-3xl">location_on</span>
              </div>
              <div>
                <p className="font-black text-on-surface tracking-tight uppercase text-lg leading-none">Detect Location</p>
                <p className="text-on-surface-variant text-sm font-medium mt-1">
                  {location.lat ? `Bareilly: ${location.lat}, ${location.lon}` : 'Click to pinpoint coordinates'}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-3xl">gps_fixed</span>
          </div>
          <div className="w-full h-56 rounded-3xl overflow-hidden relative shadow-lg border-4 border-white z-0">
            <MapContainer 
              center={[location.lat, location.lon]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {hasDetected && <Marker position={[location.lat, location.lon]} />}
              <MapUpdater center={hasDetected ? [location.lat, location.lon] : null} />
            </MapContainer>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-10 pb-8 pt-4 bg-white/80 backdrop-blur-xl rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
        <button onClick={handleDiscard} className="flex flex-col items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
          <span className="material-symbols-outlined text-3xl">delete_sweep</span>
          <span className="font-bold text-[10px] uppercase mt-1">Discard</span>
        </button>
        
        <button 
          onClick={handleSubmit}
          disabled={isLoading || isAnalyzing}
          className={`flex flex-col items-center justify-center rounded-full w-20 h-20 shadow-2xl transition-all active:scale-90 -mt-14 ${isLoading || isAnalyzing ? 'bg-slate-300' : 'bg-primary text-white'}`}
        >
          {isLoading ? (
            <span className="material-symbols-outlined text-3xl animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined text-4xl">send</span>
          )}
        </button>

        <button onClick={() => setShowGuide(true)} className="flex flex-col items-center justify-center text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-3xl">auto_stories</span>
          <span className="font-bold text-[10px] uppercase mt-1">Guide</span>
        </button>
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
