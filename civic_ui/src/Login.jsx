import React, { useContext, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { AuthContext } from './AuthContext';

function Login() {
  const { auth, login, logout } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoggingIn(true);
        setError(null);
        // useGoogleLogin returns an access_token, not an id_token (credential)
        // We need to send this to our backend
        const res = await axios.post('/api/auth/google/', {
          token: tokenResponse.access_token
        });
        login(res.data);
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.details || err.response?.data?.error || 'Backend verification failed.';
        setError(`Login Failed: ${msg}`);
      } finally {
        setIsLoggingIn(false);
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setError('Google Popup Blocked or Mismatched.');
    },
  });

  const redirectLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // (This will be called on the callback page if redirect was used)
      // Note: react-oauth handles this automatically if on the same page
    },
    flow: 'auth-code', // Authorization code flow is even more stable for redirects
    ux_mode: 'redirect',
    redirect_uri: window.location.origin + window.location.pathname,
  });

  if (auth) {
    return (
      <div className="flex items-center gap-4 bg-surface-container-low p-2 pr-4 rounded-full border border-outline-variant/10 shadow-sm">
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
          {auth.user.email[0].toUpperCase()}
        </div>
        <span className="text-xs font-bold text-on-surface-variant max-w-[120px] truncate">
          {auth.user.email}
        </span>
        <button 
          onClick={logout} 
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-2xl w-full flex items-start gap-3 animate-bounce">
          <span className="material-symbols-outlined text-red-500">error</span>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-tighter mb-1">Authorization Failed</p>
            <p className="text-sm font-medium leading-tight">{error}</p>
          </div>
        </div>
      )}
      
      <div className="space-y-4 w-full flex flex-col items-center">
        <button
          onClick={() => googleLoginHandler()}
          disabled={isLoggingIn}
          className={`flex items-center justify-center gap-3 w-full max-w-xs px-8 py-4 rounded-full shadow-lg transition-all active:scale-95 group font-bold text-base ${isLoggingIn ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200'}`}
        >
          {isLoggingIn ? (
            <span className="material-symbols-outlined animate-spin text-primary">sync</span>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {isLoggingIn ? 'Verifying Account...' : 'Sign in with Google'}
        </button>

        {!isLoggingIn && (
          <button
            onClick={() => redirectLoginHandler()}
            className="text-xs font-black uppercase tracking-tighter text-on-surface-variant/40 hover:text-primary transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
            Phone/Laptop Fix (Redirect)
          </button>
        )}
      </div>

      {isLoggingIn && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[1000] flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-primary font-black tracking-tighter text-xl">Connecting to Bareilly Civic...</p>
        </div>
      )}
    </div>
  );
}

export default Login;
