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
      const res = await axios.post('http://127.0.0.1:8000/api/auth/google/', {
        token: credentialResponse.credential
      });
      login(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to authenticate with backend.');
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
        theme="filled_blue"
        shape="pill"
      />
    </div>
  );
}

export default Login;
