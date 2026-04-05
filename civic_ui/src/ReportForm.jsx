import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import Login from './Login';
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
  const { auth } = useContext(AuthContext);
  const [imageFile, setImageFile] = useState(null);
  const [location, setLocation] = useState({ lat: 28.3670, lon: 79.4304 }); // Default Bareilly
  const [hasDetected, setHasDetected] = useState(false);
  const [category, setCategory] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
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

    try {
      const response = await axios.post('/api/reports/', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      setStatusMsg(`Success! Triage score: ${response.data.severity_score}`);
      setImageFile(null);
      setCategory('');
      setHasDetected(false);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to submit report. Please log in again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard this report?")) {
      setImageFile(null);
      setLocation({ lat: 28.3670, lon: 79.4304 });
      setCategory('');
      setHasDetected(false);
      setStatusMsg('Report discarded.');
    }
  };

  if (!auth?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface px-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-primary shadow-inner">
          <span className="material-symbols-outlined text-4xl">lock</span>
        </div>
        <div>
          <h2 className="text-2xl font-black text-on-surface font-headline">Authentication Required</h2>
          <p className="text-on-surface-variant mt-2 max-w-xs mx-auto">Please sign in with your Google account to start helping your city.</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-outline-variant/30">
          <Login />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <main className="max-w-2xl mx-auto pt-10 px-6 space-y-8">
        
        {statusMsg && (
          <div className="bg-primary-container text-on-primary-container p-4 rounded-lg font-bold">
            {statusMsg}
          </div>
        )}

        <section>
          <div className="relative group" onClick={() => document.getElementById('fileInput').click()}>
            <div className="aspect-[4/3] w-full rounded-xl bg-surface-container-lowest flex flex-col items-center justify-center border-2 border-dashed border-outline-variant overflow-hidden cursor-pointer hover:bg-surface-container-low transition-colors">
              <img className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale" alt="blurred urban street scene" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDq8HupsWUpPcPSFKyUlzkiiU1kV261CS1R786IEI-T-vcqKOKAfzyIOQdaeFn8r61C5zwm4GD5x47HV6Shu-dVt6QbO-lb7m5JXOYaoBqhc0eo4vNnMdZVHuErSDBcLmrr_HrL0-BAXbmehqriQFmh56BySgCUv3eZqPyzsrgWTPq9LhJ5JgoTcrUdIa-2QxxJAsg8nlXdzJOMaHcx7ir_dp3H73bR8Mtia5AVDbklo1ckf1V_KxwwgU5WbfpgrJlxfqIV_yQVwgSo"/>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center mb-4 text-on-secondary-container">
                  <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                </div>
                <p className="text-on-surface-variant font-medium">
                  {imageFile ? imageFile.name : 'Upload Evidence'}
                </p>
                <p className="text-on-surface-variant/60 text-sm mt-1">Tap to capture or select photo</p>
              </div>
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

        <section className="space-y-4">
          <h2 className="text-primary font-bold text-xl tracking-tight">Location Details</h2>
          <div onClick={handleDetectLocation} className="bg-surface-container-low rounded-lg p-4 flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-md">
                <span className="material-symbols-outlined">my_location</span>
              </div>
              <div>
                <p className="font-semibold text-on-surface">Detect My Location</p>
                <p className="text-on-surface-variant text-sm">
                  {location.lat ? `Lat: ${location.lat}, Lon: ${location.lon}` : 'Uses high-precision GPS'}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </div>
          <div className="w-full h-48 rounded-lg overflow-hidden relative shadow-sm border border-outline-variant/10 z-0">
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

        <section className="space-y-4">
          <h2 className="text-primary font-bold text-xl tracking-tight">Issue Category</h2>
          <div className="flex flex-wrap gap-3">
            {['Pothole', 'Street Light', 'Sanitation', 'Water Leak'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategory(cat)}
                className={`px-6 py-2 rounded-full font-semibold text-sm shadow-sm transition-colors ${category === cat ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-6 pb-8 pt-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_30px_rgb(0,38,49,0.06)] z-50">
        <button onClick={handleDiscard} className="flex flex-col items-center justify-center text-slate-400 p-4 hover:opacity-90 transition-opacity active:scale-98 duration-150">
          <span className="material-symbols-outlined text-2xl">cancel</span>
          <span className="font-['Inter'] font-semibold tracking-wide uppercase text-[10px] mt-1">Discard</span>
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex flex-col items-center justify-center bg-gradient-to-br from-[#002631] to-[#003d4d] text-white rounded-full p-4 w-16 h-16 shadow-lg hover:opacity-90 transition-all active:scale-95 -mt-12"
        >
          {isLoading ? <span className="material-symbols-outlined text-xl animate-spin">refresh</span> : <span className="material-symbols-outlined text-3xl">send</span>}
        </button>
        <button onClick={() => setShowGuide(true)} className="flex flex-col items-center justify-center text-slate-400 p-4 hover:opacity-90 transition-opacity active:scale-98 duration-150">
          <span className="material-symbols-outlined text-2xl">help</span>
          <span className="font-['Inter'] font-semibold tracking-wide uppercase text-[10px] mt-1">Guide</span>
        </button>
      </nav>

      {/* Video Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full p-1">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="aspect-video w-full bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0" 
                title="Reporting Guide" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-primary mb-2">How to Report an Issue</h3>
              <p className="text-sm text-on-surface-variant">1. Upload a clear photo of the issue.<br/>2. Detect your GPS location.<br/>3. Choose a category and tap Send.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
        <span className="font-['Inter'] font-semibold tracking-widest uppercase text-xs text-primary-container bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full">Submit Report</span>
      </div>
    </div>
  );
}

export default ReportForm;
