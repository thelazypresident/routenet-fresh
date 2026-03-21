import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ FIX: Changed from false to true.
      // On Android, when the user closes and reopens the app, the WebView fires a
      // window focus event. With false, all queries served stale data forever after
      // the first load — savings goals, reminders, expense limits, transactions all
      // appeared to vanish because the cached empty state from app boot was never
      // replaced. With true, every page re-queries Base44 when the app is resumed.
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
