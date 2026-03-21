import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import {
  HashRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect } from "react";
import { base44 } from '@/api/base44Client';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>;

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin
  } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (authError?.type === 'auth_required') {
      navigateToLogin();
    }
  }, [authError, navigateToLogin]);

  // Native OneSignal notification click routing
  useEffect(() => {
    const oneSignal = window?.plugins?.OneSignal;
    if (!oneSignal?.Notifications?.addClickListener) return;

    const clickHandler = (event) => {
      try {
        const data = event?.notification?.additionalData || {};
        const targetUrl = data.deep_link || data.targetUrl || data.launchURL || '/Notifications';
        const raw = localStorage.getItem('routenet_notification_history');
        const items = raw ? JSON.parse(raw) : [];
        items.unshift({
          id: String(Date.now()),
          title: event?.notification?.title || 'Notification',
          body: event?.notification?.body || '',
          targetUrl,
          type: data.type || '',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('routenet_notification_history', JSON.stringify(items));

        if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
          const url = new URL(targetUrl);
          navigate(url.pathname + url.search + url.hash);
        } else {
          navigate(targetUrl);
        }
      } catch (err) {
        console.error('OneSignal click handling failed', err);
      }
    };

    oneSignal.Notifications.addClickListener(clickHandler);
    return () => {
      try {
        oneSignal.Notifications.removeClickListener(clickHandler);
      } catch (e) {}
    };
  }, [navigate]);

  // FIX: Deep link redirect for Capacitor native app login.
  // Waits for auth to finish loading before checking.
  // Only fires in browser (Chrome Custom Tab) — never inside Capacitor WebView.
  useEffect(() => {
    if (isLoadingAuth) return;

    const isCapacitor = window.Capacitor?.isNativePlatform?.();
    if (isCapacitor) return;

    const tryRedirect = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) return;
        const token = localStorage.getItem('base44_access_token');
        if (token) {
          window.location.href = `routenet://auth?token=${encodeURIComponent(token)}`;
        }
      } catch (e) {
        console.warn('[Base44App] Deep link redirect failed:', e);
      }
    };

    tryRedirect();
  }, [isLoadingAuth]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0" style={{ backgroundColor: '#F0F7E8' }} />
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  if (authError?.type === 'auth_required') {
    return <LayoutWrapper currentPageName="Login"><Pages.Login /></LayoutWrapper>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        }
      />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        {import.meta.env.DEV && <VisualEditAgent />}
      </QueryClientProvider>
    </AuthProvider>
  )
}
