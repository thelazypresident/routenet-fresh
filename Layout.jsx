import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import OfflineIndicator from './components/OfflineIndicator';

const detectNativeApp = () => {
  const isCapacitor = window.Capacitor?.isNativePlatform || window.Capacitor?.platform;
  const isWebView = /wv|Android.*AppleWebKit/.test(navigator.userAgent);
  return isCapacitor || isWebView;
};

function LayoutContent() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (detectNativeApp()) {
      document.documentElement.classList.add('native-app');
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const deepLink = e.detail?.deepLink;
      if (!deepLink) return;

      let targetPath = deepLink;

      if (deepLink.startsWith('#/')) {
        targetPath = deepLink.slice(1);
      } else if (deepLink.startsWith('#')) {
        targetPath = deepLink.slice(1);
      } else if (!deepLink.startsWith('/')) {
        targetPath = `/${deepLink}`;
      }

      targetPath = targetPath.toLowerCase();

      if (
        targetPath === '/' ||
        targetPath === '/dashboard' ||
        location.pathname === targetPath
      ) {
        return;
      }

      navigate(targetPath);
    };

    window.addEventListener('pushNotificationTap', handler);
    return () => window.removeEventListener('pushNotificationTap', handler);
  }, [navigate, location.pathname]);

  const isOnboarding = location.pathname === '/onboarding';

  if (isOnboarding) {
    return <Outlet />;
  }

  return (
    <>
      <Header />
      <OfflineIndicator />
      <main
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-20"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}

export default function Layout() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600&display=swap');

        html.theme-switching,
        html.theme-switching *,
        html.theme-switching *::before,
        html.theme-switching *::after {
          transition: none !important;
          animation: none !important;
        }

        html.native-app,
        html.native-app body {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        html.native-app ::-webkit-scrollbar {
          width: 0 !important;
          height: 0 !important;
          display: none !important;
        }

        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
        }

        html::-webkit-scrollbar,
        body::-webkit-scrollbar,
        *::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          display: none;
        }

        html,
        body,
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        html {
          background: #001a0a;
        }

        html.light-mode {
          background: #F0F7E8;
        }

        body, #root {
          background: #001a0a;
          min-height: 100vh;
          overflow-x: hidden;
        }

        body.light-mode, #root.light-mode {
          background: #F0F7E8;
        }

        .page-container {
          background: #001a0a;
          overflow-x: hidden;
        }

        .page-container-light {
          background: #F0F7E8;
          overflow-x: hidden;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        * {
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        button, a, input, textarea, select {
          -webkit-user-select: auto;
        }

        .stat-card-net {
          background: linear-gradient(135deg, #1a3a1a 0%, #4CAF50 30%, #66BB6A 50%, #4CAF50 70%, #1a3a1a 100%);
          border: 1px solid rgba(102, 187, 106, 0.4);
        }

        .stat-card-income {
          background: linear-gradient(135deg, #0a2540 0%, #2196F3 30%, #42A5F5 50%, #2196F3 70%, #0a2540 100%);
          border: 1px solid rgba(33, 150, 243, 0.4);
        }

        .stat-card-expense {
          background: linear-gradient(135deg, #3d0a0a 0%, #EF5350 30%, #F44336 50%, #EF5350 70%, #3d0a0a 100%);
          border: 1px solid rgba(244, 67, 54, 0.4);
        }

        .btn-primary {
          background: linear-gradient(to right, #66BB6A, #A5D6A7, #FACC15) !important;
          box-shadow: 0 4px 20px rgba(102, 187, 106, 0.4);
          color: #000000 !important;
          font-weight: 700;
        }

        .btn-primary:hover {
          box-shadow: 0 6px 28px rgba(102, 187, 106, 0.6);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: transparent;
          border: 2px solid #66BB6A;
          color: #66BB6A !important;
        }

        .btn-secondary:hover {
          background: rgba(102, 187, 106, 0.1);
        }

        .nav-blur {
          backdrop-filter: blur(12px);
          background: rgba(10, 10, 10, 0.85);
          border-top: 1px solid rgba(102, 187, 106, 0.15);
        }

        .card-dark {
          background: linear-gradient(135deg, rgba(10, 30, 15, 0.4) 0%, rgba(5, 20, 10, 0.6) 100%);
          border: 1px solid rgba(102, 187, 106, 0.15);
          border-radius: 16px;
          box-shadow: 0 0 20px rgba(102, 187, 106, 0.1), 0 4px 16px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
        }

        .card-light {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .card-light:hover {
          background: rgba(255, 255, 255, 0.8);
        }

        .header-bar {
          background: linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(15, 30, 15, 0.9) 100%);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(102, 187, 106, 0.15);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .period-btn-active {
          background: linear-gradient(135deg, #FACC15 0%, #FDE68A 100%);
          color: #0a0a0a !important;
          font-weight: 700;
          box-shadow: 0 0 20px rgba(250, 204, 21, 0.6), 0 4px 16px rgba(253, 230, 138, 0.4);
        }

        .period-btn-inactive {
          background: rgba(20, 20, 20, 0.6);
          border: 1px solid rgba(102, 187, 106, 0.2);
          color: rgba(255, 255, 255, 0.7);
        }

        .period-btn-inactive:hover {
          background: rgba(30, 30, 30, 0.8);
          border-color: rgba(102, 187, 106, 0.4);
        }

        .dark-select-trigger {
          background: #0A0F0A !important;
          border: 1px solid #2F2F2F !important;
          color: #FFFFFF !important;
        }

        .dark-select-trigger:focus {
          border-color: #66BB6A !important;
          box-shadow: 0 0 0 2px rgba(102, 187, 106, 0.2) !important;
        }

        .dark-select-trigger [data-placeholder] {
          color: #B5B5B5 !important;
        }

        .dark-select-content {
          background: linear-gradient(180deg, #0A0F0A 0%, #0C130C 50%, #0F1A10 100%) !important;
          border: 1px solid rgba(102, 187, 106, 0.08) !important;
        }

        .dark-select-content [role="option"] {
          color: #FFFFFF !important;
          background: transparent !important;
        }

        .dark-select-content [role="option"]:hover,
        .dark-select-content [role="option"]:focus,
        .dark-select-content [role="option"][data-highlighted] {
          background: rgba(102, 187, 106, 0.15) !important;
          color: #FFFFFF !important;
        }

        .light-select-content {
          background: linear-gradient(180deg, #FFFFFF 0%, #F9F9F9 100%) !important;
          border: 1px solid #E5E7EB !important;
        }

        .modal-light {
          background: linear-gradient(135deg, #f0f9f0 0%, #ffffff 50%, #e8f5e9 100%) !important;
          border: 1px solid #E5E7EB !important;
        }

        .light-select-content [role="option"] {
          color: #1A1A1A !important;
          background: transparent !important;
        }

        .light-select-content [role="option"]:hover,
        .light-select-content [role="option"]:focus,
        .light-select-content [role="option"][data-highlighted] {
          background: rgba(102, 187, 106, 0.12) !important;
          color: #000000 !important;
        }

        .welcome-card {
          background: linear-gradient(135deg, rgba(10, 30, 15, 0.5) 0%, rgba(5, 20, 10, 0.7) 100%);
          border: 1px solid rgba(102, 187, 106, 0.2);
          box-shadow: 0 0 30px rgba(102, 187, 106, 0.15), 0 8px 32px rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(12px);
        }

        .expense-list-card {
          background: linear-gradient(135deg, rgba(10, 30, 15, 0.4) 0%, rgba(5, 20, 10, 0.6) 100%);
          border: 1px solid rgba(102, 187, 106, 0.15);
          box-shadow: 0 0 25px rgba(102, 187, 106, 0.12), 0 8px 28px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
        }

        button[aria-label="Close"],
        button[title="Close"],
        [role="dialog"] > button:last-child:not([type]):not(.btn-primary):not(.btn-secondary) {
          display: none !important;
        }

        button svg[data-icon*="arrow"],
        button svg[class*="arrow"],
        button svg[class*="chevron-left"],
        button svg[class*="back"],
        button [class*="arrow-left"],
        button [class*="chevron-left"],
        button [aria-label*="back"],
        button[aria-label*="Back"],
        button[title*="Back"],
        button[title*="back"] {
          display: none !important;
        }

        header button:first-child {
          display: none !important;
        }

        [role="dialog"] header button:first-child,
        [data-modal] header button:first-child,
        [data-sheet] header button:first-child {
          display: none !important;
        }

        header {
          padding-left: 16px !important;
        }
      `}</style>

      <div className="h-screen flex flex-col">
        <LayoutContent />
      </div>
    </>
  );
}