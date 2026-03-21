import React, { useState, useEffect } from 'react';
import { Bell, Calendar, DollarSign, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../components/contexts/AppContext';
import { useOffline } from '../components/contexts/OfflineContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import NotificationRow from '../components/notifications/NotificationRow';
import {
  getLocalNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationLog,
  clearAllNotificationLogs,
} from '@/database/genericRepository';

export default function Notifications() {
  const { t, theme, user, setUser } = useApp();
  const { isOnline } = useOffline();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [activeFilter, setActiveFilter] = useState('all');
  const [markAllDialogOpen, setMarkAllDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [mutedTypes, setMutedTypes] = useState(user?.notification_mutes || []);
  const [pinnedIds, setPinnedIds] = useState(user?.pinned_notifications || []);

  useEffect(() => {
    setMutedTypes(user?.notification_mutes || []);
    setPinnedIds(user?.pinned_notifications || []);
  }, [user?.notification_mutes, user?.pinned_notifications]);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    enabled: true,
    initialData: [],
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // Local-first inbox so the list updates immediately after device delivery.
      return await getLocalNotifications(null, 200);
    }
  });

  const filterOptions = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'unread', label: 'Unread', icon: Bell },
    { id: 'renewals', label: 'Renewals', icon: Calendar },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'savings', label: 'Savings', icon: DollarSign }
  ];

  const filteredNotifications = (
    activeFilter === 'all'
      ? notifications
      : activeFilter === 'unread'
        ? notifications.filter((n) => !n.is_read)
        : notifications.filter((n) => n.category === activeFilter)
  ).sort((a, b) => {
    const aIsPinned = pinnedIds.includes(a.id);
    const bIsPinned = pinnedIds.includes(b.id);
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    return new Date(b.created_date || b.created_at) - new Date(a.created_date || a.created_at);
  });

  const pinnedNotifications = filteredNotifications.filter((n) => pinnedIds.includes(n.id));
  const unpinnedNotifications = filteredNotifications.filter((n) => !pinnedIds.includes(n.id));

  const getRemoteId = (notification) => notification?.remote_id || null;

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) return;
      await markAllNotificationsRead(user.email);
      if (isOnline) {
        const remoteIds = notifications.filter((n) => !n.is_read).map(getRemoteId).filter(Boolean);
        await Promise.all(
          remoteIds.map((id) => base44.entities.Notification.update(id, { is_read: true })
            .catch(e => console.warn('[Notifications] mark read failed for', id, e))
          )
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
      refetch();
      toast.success('All notifications marked as read');
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error('User not authenticated');
      await clearAllNotificationLogs(user.email);
      if (isOnline) {
        const remoteIds = notifications.map(getRemoteId).filter(Boolean);
        await Promise.all(remoteIds.map((id) => base44.entities.Notification.delete(id).catch(() => {})));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
      refetch();
      toast.success('All notifications cleared');
    },
    onError: () => toast.error('Failed to clear notifications. Try again.')
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notification) => {
      await deleteNotificationLog(notification.id).catch(() => {});
      const remoteId = getRemoteId(notification);
      if (isOnline && remoteId) {
        await base44.entities.Notification.delete(remoteId).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
      refetch();
      toast.success('Notification deleted');
    },
    onError: () => toast.error('Failed to delete notification')
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notification) => {
      await markNotificationRead(notification.id).catch(() => {});
      const remoteId = getRemoteId(notification);
      if (isOnline && remoteId) {
        await base44.entities.Notification.update(remoteId, { is_read: true }).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-bell'] });
    }
  });

  const markAllRead = () => setMarkAllDialogOpen(true);
  const confirmMarkAllRead = () => {
    markAllReadMutation.mutate();
    setMarkAllDialogOpen(false);
  };

  const clearAll = () => setClearAllDialogOpen(true);
  const confirmClearAll = () => {
    clearAllMutation.mutate();
    setClearAllDialogOpen(false);
  };

  const deleteNotification = (notification) => {
    deleteNotificationMutation.mutate(notification);
  };

  const togglePin = async (notification) => {
    if (!isOnline) {
      toast.info('Pinning requires an internet connection.');
      return;
    }
    try {
      const isPinned = pinnedIds.includes(notification.id);
      const newPinnedIds = isPinned
        ? pinnedIds.filter((id) => id !== notification.id)
        : [...pinnedIds, notification.id];

      await base44.auth.updateMe({ pinned_notifications: newPinnedIds });
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setPinnedIds(newPinnedIds);
      toast.success(isPinned ? 'Unpinned' : 'Pinned');
    } catch (error) {
      console.error('[Notifications] togglePin failed:', error);
      toast.error('Failed to update pin');
    }
  };

  const toggleMute = async (notification) => {
    if (!isOnline) {
      toast.info('Muting requires an internet connection.');
      return;
    }
    try {
      const currentMutes = user?.notification_mutes || [];
      const isMuted = currentMutes.includes(notification.type);
      const newMutes = isMuted
        ? currentMutes.filter((type) => type !== notification.type)
        : [...currentMutes, notification.type];

      await base44.auth.updateMe({ notification_mutes: newMutes });
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
      setMutedTypes(newMutes);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(isMuted ? 'Unmuted' : 'Muted');
    } catch (error) {
      console.error('[Notifications] toggleMute failed:', error);
      toast.error('Failed to update mute settings');
    }
  };

  const getRouteForNotification = (notification) => {
    const routes = {
      renewal_alert: '/utilities',
      maintenance: '/vehiclemaintenance',
      maintenance_alert: '/vehiclemaintenance',
      savings_goal: '/savings',
      expense_limit: '/transactions',
      transaction: '/transactions'
    };
    return routes[notification?.type] || null;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification);
    }
    const route = getRouteForNotification(notification);
    if (route) navigate(route);
  };

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'page-container' : 'page-container-light'} transition-colors`}>
      <div className="max-w-screen-lg mx-auto px-3 py-4 space-y-3 overflow-x-hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? 'period-btn-active'
                  : isDark
                    ? 'period-btn-inactive'
                    : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('NOTIFICATIONS')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={markAllRead}
              disabled={markAllReadMutation.isPending || notifications.length === 0}
              className={`text-xs font-medium transition-colors ${
                notifications.length === 0
                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                  : isDark
                    ? 'text-[#66BB6A] hover:text-[#5aa5a5]'
                    : 'text-[#0B3D2E] hover:text-[#66BB6A]'
              }`}
            >
              Mark all read
            </button>
            <button
              onClick={clearAll}
              disabled={clearAllMutation.isPending || notifications.length === 0 || !user?.email}
              className={`text-xs font-medium transition-colors ${
                notifications.length === 0 || !user?.email
                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                  : isDark
                    ? 'text-red-400 hover:text-red-300'
                    : 'text-red-600 hover:text-red-500'
              }`}
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-white/60' : 'text-gray-500'} text-sm`}>
              No notifications
            </div>
          ) : (
            <>
              {pinnedNotifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDelete={() => deleteNotification(notification)}
                  onPin={() => togglePin(notification)}
                  onMute={() => toggleMute(notification)}
                  isPinned={pinnedIds.includes(notification.id)}
                  isMuted={mutedTypes.includes(notification.type)}
                />
              ))}
              {unpinnedNotifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onDelete={() => deleteNotification(notification)}
                  onPin={() => togglePin(notification)}
                  onMute={() => toggleMute(notification)}
                  isPinned={pinnedIds.includes(notification.id)}
                  isMuted={mutedTypes.includes(notification.type)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <Dialog open={markAllDialogOpen} onOpenChange={setMarkAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark all as read?</DialogTitle>
            <DialogDescription>
              This will clear the unread badge for all notifications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button className="px-4 py-2" onClick={() => setMarkAllDialogOpen(false)}>Cancel</button>
            <button className="px-4 py-2" onClick={confirmMarkAllRead}>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all notifications?</DialogTitle>
            <DialogDescription>
              This will permanently remove all notifications from this device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button className="px-4 py-2" onClick={() => setClearAllDialogOpen(false)}>Cancel</button>
            <button className="px-4 py-2 text-red-600" onClick={confirmClearAll}>Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
