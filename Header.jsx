import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './contexts/AppContext';
import NotificationBell from './NotificationBell';
import { createPageUrl } from '../utils';
import { Preferences } from '@capacitor/preferences';

// FIX: The original Header read avatar only from user.profile_photo_url.
// When offline, that is a remote URL that cannot load — the avatar silently
// disappears and the User icon placeholder shows instead.
//
// The fix: on mount, also load the locally cached photo_data_url from
// Capacitor Preferences (saved by ProfileSettings.jsx when the user uploads
// a photo). Display priority:
//   1. Local cached photo (Preferences) — always available offline
//   2. Remote profile_photo_url — available online only
//   3. User icon placeholder
//
// This is the only way the avatar shows correctly when offline.

const PROFILE_PHOTO_PREF_KEY = 'routenet_profile_photo';

export default function Header() {
  const navigate = useNavigate();
  const { theme, user } = useApp();
  const isDark = theme === 'dark';
  const username = user?.full_name?.split(' ')[0] || 'Account';

  // Remote URL from the user object (online source)
  const remotePhoto = user?.profile_photo_url || '';

  // Local cached photo from Preferences (offline-safe source)
  const [localPhoto, setLocalPhoto] = useState('');

  // Track whether the remote URL failed to load
  const [remotePhotoFailed, setRemotePhotoFailed] = useState(false);

  // Load local cached photo on mount and whenever user changes
  useEffect(() => {
    setRemotePhotoFailed(false); // reset on user change
    Preferences.get({ key: PROFILE_PHOTO_PREF_KEY })
      .then(({ value }) => {
        if (value) setLocalPhoto(value);
      })
      .catch(() => {});
  }, [user?.email]);

  // Determine which photo source to display
  // Priority: local cache → remote URL → placeholder
  const displayPhoto = localPhoto || (!remotePhotoFailed ? remotePhoto : '');

  return (
    <div
      className="text-white shadow-lg"
      style={{
        backgroundColor: isDark ? '#001A00' : '#F0F7E8',
        width: '100vw',
        left: 0,
        right: 0,
        margin: 0,
        paddingTop: 'env(safe-area-inset-top)',
        borderRadius: 0,
        zIndex: 9999
      }}
    >
      <div className="relative flex items-center justify-between px-1.5 py-4 min-h-[60px] max-w-screen-xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(createPageUrl('Me'))}
          className="transition-opacity hover:opacity-80 px-1.5 py-1 ml-3"
          style={{ pointerEvents: 'auto', zIndex: 10000, position: 'relative', touchAction: 'manipulation' }}
        >
          <div className="flex items-center">
            {displayPhoto ? (
              <img
                src={displayPhoto}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover"
                onError={() => {
                  // Remote URL failed to load — mark it so we fall through
                  // to localPhoto or placeholder on next render.
                  // If localPhoto is already set, the display will switch
                  // to it automatically via the displayPhoto calculation above.
                  setRemotePhotoFailed(true);
                }}
              />
            ) : (
              <User className="w-6 h-6" style={{ color: isDark ? '#F0F7E8' : '#001A00' }} />
            )}
          </div>
        </button>

        <div
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ pointerEvents: 'none' }}
        >
          <h1
            className="text-[22px] font-semibold"
            style={{ color: isDark ? '#F0F7E8' : '#001A00' }}
          >
            RouteNet
          </h1>
        </div>

        <div
          className="flex items-center gap-2 mr-3"
          style={{ pointerEvents: 'auto', zIndex: 10000, position: 'relative', touchAction: 'manipulation' }}
        >
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}
