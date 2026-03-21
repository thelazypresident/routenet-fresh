import React, { useEffect } from 'react';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { useApp } from '../components/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

export default function LoggedOut() {
  const { theme, user } = useApp();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const userName = user?.full_name || user?.name || user?.display_name || null;

  // If user is already authenticated after deep link login + reload
  // navigate to dashboard immediately
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
      background: isDark
        ? 'linear-gradient(135deg, #000000 0%, #0a1a0a 50%, #001a0a 100%)'
        : 'linear-gradient(135deg, #f0f9f0 0%, #ffffff 50%, #e8f5e9 100%)',
      padding: '32px 24px',
    }}>

      {/* Logo */}
      <img
        src="/icon-512.png"
        alt="RouteNet"
        style={{
          width: 110,
          height: 110,
          borderRadius: 28,
          marginBottom: 28,
          boxShadow: isDark
            ? '0 8px 32px rgba(102,187,106,0.2)'
            : '0 8px 32px rgba(11,61,46,0.15)',
        }}
      />

      {/* User name or app name */}
      <h1 style={{
        color: isDark ? '#ffffff' : '#0B3D2E',
        fontSize: 26,
        fontWeight: 700,
        marginBottom: 8,
        textAlign: 'center',
      }}>
        {userName ? `Goodbye, ${userName}` : 'RouteNet'}
      </h1>

      <p style={{
        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(11,61,46,0.6)',
        marginBottom: 48,
        textAlign: 'center',
        fontSize: 15,
      }}>
        You have been logged out.
      </p>

      {/* Sign In button — matches app gradient button style */}
      <button
        onClick={handleSignIn}
        style={{
          background: 'linear-gradient(to right, #66BB6A, #A5D6A7, #FACC15)',
          color: '#000000',
          border: 'none',
          borderRadius: 50,
          padding: '16px 56px',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(102,187,106,0.4)',
          letterSpacing: '0.3px',
        }}
      >
        Sign In
      </button>

    </div>
  );
}
