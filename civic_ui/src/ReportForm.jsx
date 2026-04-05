import React, { useState } from 'react';
import axios from 'axios';

function ReportForm() {
  const [imageFile, setImageFile] = useState(null);
  const [location, setLocation] = useState({ lat: '', lon: '' });
  const [category, setCategory] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await axios.post('http://127.0.0.1:8000/api/reports/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setStatusMsg(`Success! Triage score: ${response.data.severity_score}`);
      setImageFile(null);
      setCategory('');
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to submit report.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="w-full h-32 rounded-lg overflow-hidden relative shadow-sm border border-outline-variant/10">
            <img className="w-full h-full object-cover" alt="abstract stylized map view" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUi6lfd4kLC1h3Ye3cDesmRWpmPkZSHJzIIt1Hfl12jlZsR_go_Mx4k1cKXVDOxkW_MeHsEClWsXCpFHcwKqHwqjPt9yUpXUt3eO02fwe87cIkllrGcGz_41_fbOapE0K3vkmP_0T2Yk8TQMHBjTPqNIOZznk8V0axwFxueRMcTyZ0ZLDD9KBB2-0MakpR0oz1U9ee1-Z3pLvhEtgApk5z93ZZoyhj3xKVTMZyT9dgZ0P5TZOeeZF86WSH4YF7Sf2OH0KcMcej7Hcp"/>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
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
        <button className="flex flex-col items-center justify-center text-slate-400 p-4 hover:opacity-90 transition-opacity active:scale-98 duration-150">
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
        <button className="flex flex-col items-center justify-center text-slate-400 p-4 hover:opacity-90 transition-opacity active:scale-98 duration-150">
          <span className="material-symbols-outlined text-2xl">help</span>
          <span className="font-['Inter'] font-semibold tracking-wide uppercase text-[10px] mt-1">Guide</span>
        </button>
      </nav>
      
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
        <span className="font-['Inter'] font-semibold tracking-widest uppercase text-xs text-primary-container bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full">Submit Report</span>
      </div>
    </div>
  );
}

export default ReportForm;
