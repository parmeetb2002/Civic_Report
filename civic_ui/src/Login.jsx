import React, { useContext, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { AuthContext } from './AuthContext';

function Login() {
  const { auth, login, logout } = useContext(AuthContext);
  const [error, setError] = useState(null);

  const handleSuccess = async (credentialResponse) => {
    try {
      setError(null);
      const res = await axios.post('/api/auth/google/', {
        token: credentialResponse.credential
      });
      login(res.data);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.details || err.response?.data?.error || 'Failed to authenticate with backend.';
      setError(`Auth Error: ${msg}`);
    }
  };

  if (auth) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>
          Logged in as {auth.user.email} {auth.user.is_staff && '(Admin)'}
        </span>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--outline-variant)', padding: '0.5rem 1rem', borderRadius: '1rem', cursor: 'pointer' }}>
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {error && <span style={{ color: 'var(--error)' }}>{error}</span>}
      <GoogleLogin 
        onSuccess={handleSuccess}
        onError={() => setError('Google Login Failed')}
        ux_mode="redirect"
        theme="filled_blue"
        shape="pill"
      />
    </div>
  );
}

export default Login;
