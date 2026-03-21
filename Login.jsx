import React, { useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { useApp } from '../components/contexts/AppContext';

export default function Login() {
  const { user } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleResume = () => {
      try {
        const keys = Object.keys(localStorage);
        const hasToken = keys.some(k => k.startsWith('base44') && localStorage.getItem(k));
        if (hasToken) {
          window.location.reload();
        }
      } catch (e) {}
    };

    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) handleResume();
    });

    return () => {
      listener.then(l => l.remove()).catch(() => {});
    };
  }, []);

  const handleSignIn = async () => {
    await Browser.open({ url: 'https://myroutenet.com' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F0F7E8',
      padding: '32px 24px',
    }}>
      <div style={{
        width: 110,
        height: 110,
        borderRadius: '50%',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        boxShadow: '0 8px 32px rgba(11,61,46,0.12)',
        overflow: 'hidden',
      }}>
        <img
          src="/icon-512.png"
          alt="RouteNet"
          style={{ width: 90, height: 90, objectFit: 'contain' }}
        />
      </div>

      <h1 style={{
        color: '#0B3D2E',
        fontSize: 32,
        fontWeight: 700,
        marginBottom: 8,
        letterSpacing: '-0.5px',
      }}>
        RouteNet
      </h1>

      <p style={{
        color: 'rgba(11,61,46,0.6)',
        marginBottom: 56,
        textAlign: 'center',
        fontSize: 15,
      }}>
        Track your routes, income and expenses
      </p>

      <button
        onClick={handleSignIn}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: 'white',
          color: '#0B3D2E',
          border: '1.5px solid #e0e0e0',
          borderRadius: 50,
          padding: '14px 32px',
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%',
          maxWidth: 320,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continue with Google
      </button>

      {/* Continue as Guest */}
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'transparent',
          color: 'rgba(11,61,46,0.5)',
          border: 'none',
          padding: '12px',
          fontSize: 14,
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        Continue as Guest
      </button>

    </div>
  );
}
