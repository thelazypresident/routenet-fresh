import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Star, Settings, Bell, Trash2,
  Share2, FileText, Shield, Info, LogOut, ChevronRight, DollarSign, Download
} from 'lucide-react';
import { useApp } from '../components/contexts/AppContext';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Me() {
  const navigate = useNavigate();
  const { theme, user } = useApp();
  const { logout, isLoggingOut } = useAuth();
  const isDark = theme === 'dark';
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const premium = user?.subscription_tier === 'pro';
  const photo = user?.profile_photo_url || '';

  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      toast.success('Cache cleared.');
      setShowClearCacheModal(false);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear cache.');
    }
  };

  const handleRecommend = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const storeLink = isIOS
      ? "https://apps.apple.com/app/idYOUR_APP_ID"
      : "https://play.google.com/store/apps/details?id=com.routenet.app";

    const shareText =
      "I've been using RouteNet to track my delivery income, expenses, and real profit.\n\nDownload here:\n" +
      storeLink;

    if (window.median?.share?.sharePage) {
      window.median.share.sharePage({
        title: "RouteNet",
        text: shareText,
        url: storeLink,
      });
      return;
    }

    try {
      const el = document.createElement('textarea');
      el.value = shareText;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast.success("Link copied to clipboard");
    } catch (e) {
      toast.error("Could not copy link");
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setShowLogoutModal(false);
      await logout(false);
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout. Please try again.');
      setShowLogoutModal(true);
    }
  };

  const MenuItem = ({ icon: Icon, label, onClick, badge }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
        isDark
          ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10 hover:border-[#66BB6A]/20'
          : 'bg-white/60 hover:bg-white/80 border border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </span>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isDark ? 'bg-[#66BB6A]/20 text-[#66BB6A]' : 'bg-gray-200 text-gray-700'
          }`}>
            {badge}
          </span>
        )}
      </div>
      <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
    </button>
  );

  const ProfileIcon = () => {
    if (photo) {
      return (
        <img
          src={photo}
          alt="Profile"
          className="w-6 h-6 rounded-full object-cover"
          onError={(e) => { e.currentTarget.src = ''; }}
        />
      );
    }
    return <User className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />;
  };

  const ProfileRow = ({ label, badge, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
        isDark
          ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10 hover:border-[#66BB6A]/20'
          : 'bg-white/60 hover:bg-white/80 border border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <ProfileIcon />
        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </span>
        {badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isDark ? 'bg-[#66BB6A]/20 text-[#66BB6A]' : 'bg-gray-200 text-gray-700'
          }`}>
            {badge}
          </span>
        )}
      </div>
      <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
    </button>
  );

  return (
    <div className={`min-h-screen pb-24 ${
      isDark
        ? 'bg-gradient-to-br from-[#000000] via-[#0a1a0a] to-[#001a0a]'
        : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'
    }`}>
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        <ProfileRow
          label={user?.full_name || 'User'}
          badge={premium ? 'Premium' : 'Free'}
          onClick={() => navigate(createPageUrl('ProfileSettings'))}
        />

        <div className="space-y-3">
          <h3 className={`text-xs font-semibold uppercase tracking-wide px-1 ${
            isDark ? 'text-white/50' : 'text-gray-500'
          }`}>
            Account
          </h3>
          <MenuItem
            icon={Star}
            label="Subscription"
            onClick={() => navigate(createPageUrl('Subscription'))}
          />
          <MenuItem
            icon={Share2}
            label="Recommend to Friends"
            onClick={handleRecommend}
          />
          <MenuItem
            icon={Settings}
            label="Settings"
            onClick={() => navigate(createPageUrl('Settings'))}
          />
          <MenuItem
            icon={Bell}
            label="Notifications"
            onClick={() => navigate(createPageUrl('NotificationsAutomation'))}
          />
          <MenuItem
            icon={DollarSign}
            label="Spending Limit"
            onClick={() => navigate(createPageUrl('Transactions'))}
          />
          <MenuItem
            icon={Download}
            label="Exports & Data"
            onClick={() => navigate(createPageUrl('ExportsData'))}
          />
        </div>

        <div className="space-y-3">
          <h3 className={`text-xs font-semibold uppercase tracking-wide px-1 ${
            isDark ? 'text-white/50' : 'text-gray-500'
          }`}>
            Legal & Support
          </h3>
          <MenuItem
            icon={Trash2}
            label="Clear Cache"
            onClick={() => setShowClearCacheModal(true)}
          />
          <MenuItem
            icon={FileText}
            label="Terms of Use"
            onClick={() => navigate(createPageUrl('TermsOfUse'))}
          />
          <MenuItem
            icon={Shield}
            label="Privacy Policy"
            onClick={() => navigate(createPageUrl('PrivacyPolicy'))}
          />
          <MenuItem
            icon={Info}
            label="About"
            onClick={() => navigate(createPageUrl('About'))}
          />
          <MenuItem
            icon={LogOut}
            label="Logout"
            onClick={() => setShowLogoutModal(true)}
          />
        </div>
      </div>

      <Dialog open={showClearCacheModal} onOpenChange={setShowClearCacheModal}>
        <DialogContent className={isDark ? 'bg-[#0a1a0a] border-[#66BB6A]/20' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Clear cache?
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-white/60' : 'text-gray-600'}>
              This refreshes temporary data. Your records will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearCacheModal(false)}
              className={isDark ? 'bg-white text-gray-900 border-[#66BB6A]/20 hover:bg-white/90 hover:text-gray-900' : ''}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearCache}
              className="bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black hover:opacity-90"
            >
              Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className={isDark ? 'bg-[#0a1a0a] border-[#66BB6A]/20' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>
              Logout?
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-white/60' : 'text-gray-600'}>
              Are you sure you want to logout?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutModal(false)}
              className={isDark ? 'bg-white text-gray-900 border-[#66BB6A]/20 hover:bg-white/90 hover:text-gray-900' : ''}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black hover:opacity-90"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}