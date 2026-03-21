import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, AtSign, Mail, Car, Users, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../components/contexts/AppContext';
import { useOffline } from '../components/contexts/OfflineContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Preferences } from '@capacitor/preferences';
import { setProfileValue, getProfileValue } from '@/database/genericRepository';

const PROFILE_PHOTO_PREF_KEY = 'routenet_profile_photo';
const CLOUD_TIMEOUT_MS = 8000;
const USERNAME_TIMEOUT_MS = 5000;

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { t, theme, user, setUser } = useApp();
  const { isOnline } = useOffline();
  const isDark = theme === 'dark';

  const [saveLoading, setSaveLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [platformsInput, setPlatformsInput] = useState('');

  const fileRef = useRef(null);
  const isBusy = saveLoading || photoLoading || checkingUsername;

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    vehicle_type: '',
    vehicle_type_other: '',
    platforms_used: [],
    profile_photo_url: '',
  });

  const vehicleTypes = useMemo(() => ([
    { value: 'motorbike', label: t('MOTORBIKE') },
    { value: 'car', label: t('CAR') },
    { value: 'truck_van', label: 'Truck/Van' },
    { value: 'ebike', label: t('EBIKE') },
    { value: 'bicycle', label: t('BICYCLE') },
    { value: 'other', label: t('OTHER') },
  ]), [t]);

  useEffect(() => {
    let cancelled = false;

    const hydrateForm = async () => {
      const dbFullName = await getProfileValue('full_name');
      const dbUsername = await getProfileValue('username');
      const dbVehicleType = await getProfileValue('vehicle_type');
      const dbVehicleTypeOther = await getProfileValue('vehicle_type_other');
      const dbPlatforms = await getProfileValue('platforms_used');
      const dbPhoto = await getProfileValue('photo_data_url');
      const prefPhoto = await Preferences.get({ key: PROFILE_PHOTO_PREF_KEY }).catch(() => ({ value: null }));

      const parsedPlatforms = (() => {
        const raw = dbPlatforms || '';
        if (!raw) return Array.isArray(user?.platforms_used) ? user.platforms_used : [];
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return raw.split(',').map(s => s.trim()).filter(Boolean);
        }
      })();

      const next = {
        full_name: user?.full_name || dbFullName || '',
        username: user?.username || dbUsername || '',
        email: user?.email || '',
        vehicle_type: user?.vehicle_type || dbVehicleType || '',
        vehicle_type_other: user?.vehicle_type_other || dbVehicleTypeOther || '',
        platforms_used: parsedPlatforms,
        profile_photo_url: user?.profile_photo_url || dbPhoto || prefPhoto?.value || '',
      };

      if (cancelled) return;

      setFormData(next);
      setPlatformsInput(parsedPlatforms.join(', '));
      setAvatarPreview(next.profile_photo_url || '');
    };

    hydrateForm();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const checkUsernameUnique = async (username) => {
    if (!username || !isOnline) return true;

    setCheckingUsername(true);
    try {
      const allUsers = await withTimeout(base44.entities.User.list(), USERNAME_TIMEOUT_MS);
      const taken = allUsers.some(
        (u) => u.username?.toLowerCase() === username.toLowerCase() && u.email !== user?.email
      );
      return !taken;
    } catch {
      return true;
    } finally {
      setCheckingUsername(false);
    }
  };

  const validateForm = async () => {
    const newErrors = {};

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = t('FULL_NAME_REQUIRED');
    }

    const usernameValue = (formData.username || '').toLowerCase().trim();
    if (!usernameValue) {
      newErrors.username = 'Username is required.';
    } else if (usernameValue.length < 3 || usernameValue.length > 20 || /\s/.test(usernameValue) || !/^[a-z0-9_]+$/.test(usernameValue)) {
      newErrors.username = 'Username must be unique, lowercase, and 3–20 characters.';
    } else {
      const isUnique = await checkUsernameUnique(usernameValue);
      if (!isUnique) {
        newErrors.username = 'Username must be unique, lowercase, and 3–20 characters.';
      }
    }

    if (formData.vehicle_type === 'other' && !formData.vehicle_type_other?.trim()) {
      newErrors.vehicle_type_other = t('SPECIFY_VEHICLE_TYPE');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const persistProfileLocally = async (payload) => {
    const platforms = Array.isArray(payload.platforms_used) ? payload.platforms_used : [];
    await Promise.all([
      setProfileValue('full_name', payload.full_name || ''),
      setProfileValue('username', payload.username || ''),
      setProfileValue('vehicle_type', payload.vehicle_type || ''),
      setProfileValue('vehicle_type_other', payload.vehicle_type_other || ''),
      setProfileValue('platforms_used', JSON.stringify(platforms)),
      setProfileValue('photo_data_url', payload.profile_photo_url || ''),
    ]);
  };

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error('Image too large. Please use an image under 2MB.');
      e.target.value = '';
      return;
    }

    setPhotoLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const localPreview = URL.createObjectURL(file);
      setAvatarPreview(localPreview);

      const nextPayload = {
        ...formData,
        profile_photo_url: dataUrl,
        platforms_used: Array.isArray(formData.platforms_used) ? formData.platforms_used : [],
      };

      await Preferences.set({ key: PROFILE_PHOTO_PREF_KEY, value: dataUrl });
      await persistProfileLocally(nextPayload);

      setFormData(nextPayload);
      setAvatarPreview(dataUrl);
      setUser((prev) => ({ ...prev, ...nextPayload }));

      if (isOnline) {
        try {
          await withTimeout(base44.auth.updateMe({ profile_photo_url: dataUrl }), CLOUD_TIMEOUT_MS);
          toast.success('Profile photo updated.');
        } catch (cloudErr) {
          console.warn('[ProfileSettings] Cloud photo sync failed (non-fatal):', cloudErr);
          toast.success('Photo saved locally. Will sync when reconnected.');
        }
      } else {
        toast.success('Photo saved locally. Will sync when reconnected.');
      }
    } catch (err) {
      console.error('[ProfileSettings] Avatar pick failed:', err);
      toast.error('Failed to process photo.');
    } finally {
      setPhotoLoading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAvatar = async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!window.confirm('Are you sure you want to delete your profile photo?')) return;

    setPhotoLoading(true);
    try {
      const nextPayload = {
        ...formData,
        profile_photo_url: '',
        platforms_used: Array.isArray(formData.platforms_used) ? formData.platforms_used : [],
      };

      await Preferences.remove({ key: PROFILE_PHOTO_PREF_KEY });
      await persistProfileLocally(nextPayload);

      setAvatarPreview('');
      setFormData(nextPayload);
      setUser((prev) => ({ ...prev, profile_photo_url: null }));

      if (isOnline) {
        try {
          await withTimeout(base44.auth.updateMe({ profile_photo_url: null }), CLOUD_TIMEOUT_MS);
        } catch (cloudErr) {
          console.warn('[ProfileSettings] Cloud avatar delete sync failed (non-fatal):', cloudErr);
        }
      }

      toast.success('Profile photo deleted.');
    } catch (err) {
      console.error('[ProfileSettings] Avatar delete failed:', err);
      toast.error('Failed to delete photo.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name?.trim() || !formData.username?.trim()) {
      toast.error('Please fill out all required fields.');
      return;
    }

    const isValid = await validateForm();
    if (!isValid) {
      toast.error(t('PLEASE_FIX_ERRORS'));
      return;
    }

    setSaveLoading(true);
    try {
      const finalPlatforms = platformsInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const profilePayload = {
        full_name: formData.full_name.trim(),
        username: (formData.username || '').toLowerCase().trim() || null,
        vehicle_type: formData.vehicle_type || '',
        vehicle_type_other: formData.vehicle_type === 'other'
          ? (formData.vehicle_type_other || '').trim()
          : '',
        platforms_used: finalPlatforms,
        profile_photo_url: formData.profile_photo_url || null,
      };

      await persistProfileLocally(profilePayload);

      setFormData((prev) => ({ ...prev, ...profilePayload, email: prev.email }));
      setUser((prev) => ({
        ...prev,
        ...profilePayload,
        email: prev?.email || user?.email || formData.email,
      }));

      if (isOnline) {
        try {
          await withTimeout(base44.auth.updateMe(profilePayload), CLOUD_TIMEOUT_MS);
          toast.success(t('PROFILE_UPDATED_SUCCESS'));
        } catch (cloudErr) {
          console.warn('[ProfileSettings] Cloud save failed (non-fatal):', cloudErr);
          toast.success('Profile saved locally. Cloud sync will retry when reconnected.');
        }
      } else {
        toast.success('Profile saved locally. Will sync when reconnected.');
      }

      setTimeout(() => navigate(-1), 500);
    } catch (error) {
      console.error('[ProfileSettings] Save failed:', error);
      toast.error(t('PROFILE_UPDATE_FAILED'));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-black' : 'page-container-light'}`}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div
          className={`rounded-2xl p-6 shadow-lg space-y-5 ${
            isDark
              ? 'bg-gradient-to-br from-[#0a0a0a] via-[#0d1a0d] to-[#0a0a0a] border border-[#388E3C]/30'
              : 'card-light'
          }`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                  onError={() => setAvatarPreview('')}
                />
              ) : (
                <User className="w-6 h-6" style={{ color: isDark ? '#F0F7E8' : '#001A00' }} />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onPointerDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    fileRef.current?.click();
                  }}
                  disabled={isBusy}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                    isDark
                      ? 'bg-white/10 text-white border border-white/15 hover:bg-white/15'
                      : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  <ImageIcon className="w-4 h-4" />
                  {photoLoading ? 'Uploading...' : 'UPLOAD'}
                </button>

                {avatarPreview && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleDeleteAvatar}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-md transition-all disabled:opacity-50"
                    title="Delete photo"
                  >
                    <span className="text-white text-lg font-bold leading-none">×</span>
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarPick}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className={`flex items-center gap-2 mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              <User className="w-4 h-4" />
              {t('FULL_NAME')} <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder={t('ENTER_FULL_NAME')}
              className={isDark ? 'bg-white/10 text-white border-white/20' : ''}
            />
            {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
          </div>

          <div>
            <Label className={`flex items-center gap-2 mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              <AtSign className="w-4 h-4" />
              Username <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  username: e.target.value.toLowerCase(),
                }))
              }
              onBlur={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  username: e.target.value.toLowerCase().trim(),
                }))
              }
              placeholder="e.g., alexrider24"
              maxLength={20}
              className={isDark ? 'bg-white/10 text-white border-white/20' : ''}
            />
            {checkingUsername && (
              <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                Checking availability...
              </p>
            )}
            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
          </div>

          <div>
            <Label className={`flex items-center gap-2 mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              <Mail className="w-4 h-4" />
              {t('EMAIL_ADDRESS')} <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={formData.email}
              placeholder="email@example.com"
              disabled
              className={isDark ? 'bg-white/10 text-white border-white/20' : ''}
            />
            <p className={`text-xs mt-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Email comes from your account sign-in and is not edited here.
            </p>
          </div>

          <div>
            <Label className={`flex items-center gap-2 mb-3 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              <Car className="w-4 h-4" />
              {t('VEHICLE_TYPE')} <span className="text-gray-400 text-xs ml-1">(Optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {vehicleTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      vehicle_type: prev.vehicle_type === type.value ? '' : type.value,
                    }))
                  }
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    formData.vehicle_type === type.value
                      ? isDark
                        ? 'bg-[#66BB6A]/20 border-[#66BB6A] text-white'
                        : 'bg-[#66BB6A]/10 border-[#66BB6A] text-[#1B5E20]'
                      : isDark
                        ? 'bg-white/5 border-white/20 text-white/70'
                        : 'bg-white border-gray-300 text-gray-600'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {formData.vehicle_type === 'other' && (
              <Input
                value={formData.vehicle_type_other}
                onChange={(e) => setFormData((prev) => ({ ...prev, vehicle_type_other: e.target.value }))}
                placeholder={t('SPECIFY_VEHICLE_TYPE')}
                className={`mt-2 ${isDark ? 'bg-white/10 text-white border-white/20' : ''}`}
              />
            )}

            {errors.vehicle_type_other && (
              <p className="text-red-500 text-sm mt-1">{errors.vehicle_type_other}</p>
            )}
          </div>

          <div>
            <Label className={`flex items-center gap-2 mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              <Users className="w-4 h-4" />
              Platforms / Work Apps <span className="text-gray-400 text-xs ml-1">(Optional)</span>
            </Label>

            <Input
              value={platformsInput}
              onChange={(e) => setPlatformsInput(e.target.value)}
              placeholder="e.g., Uber, Grab, Foodpanda"
              className={isDark ? 'bg-white/10 text-white border-white/20' : ''}
            />

            <p className={`text-xs mt-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Enter one or more platforms separated by commas.
            </p>
          </div>

          {!isOnline && (
            <p className="text-xs text-yellow-500 text-center">
              📵 You're offline — profile will save locally and sync when reconnected.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isBusy}
            className={`flex-1 ${isDark ? 'btn-secondary' : ''}`}
          >
            {t('CANCEL')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isBusy}
            className="flex-1 bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black font-semibold"
          >
            {saveLoading ? t('SAVING') : t('SAVE')}
          </Button>
        </div>
      </div>
    </div>
  );
}
