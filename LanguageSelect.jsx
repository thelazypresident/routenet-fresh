import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../components/contexts/AppContext';
import { useOffline } from '../components/contexts/OfflineContext';
import { base44 } from '@/api/base44Client';
import { Preferences } from '@capacitor/preferences';

// FIX: The original only saved language to Base44. If offline, the save
// failed silently — language appeared to change but reverted on next boot.
// Fix: save to Capacitor Preferences immediately (device-local), then
// sync to Base44 only when online. AppContext.jsx already reads from
// Preferences via the user object, so this is consistent.

const LANGUAGE_PREF_KEY = 'routenet_pref_language';

const LANGUAGES = [
  { code: 'en', name: 'English',            nativeName: 'English'          },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Filipino'         },
  { code: 'es', name: 'Spanish',            nativeName: 'Español'          },
  { code: 'fr', name: 'French',             nativeName: 'Français'         },
  { code: 'de', name: 'German',             nativeName: 'Deutsch'          },
  { code: 'pt', name: 'Portuguese',         nativeName: 'Português'        },
  { code: 'id', name: 'Indonesian',         nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay',              nativeName: 'Bahasa Melayu'    },
  { code: 'th', name: 'Thai',               nativeName: 'ภาษาไทย'          },
  { code: 'vi', name: 'Vietnamese',         nativeName: 'Tiếng Việt'       },
  { code: 'ja', name: 'Japanese',           nativeName: '日本語'             },
  { code: 'ko', name: 'Korean',             nativeName: '한국어'              },
  { code: 'hi', name: 'Hindi',              nativeName: 'हिन्दी'              },
  { code: 'ta', name: 'Tamil',              nativeName: 'தமிழ்'              },
  { code: 'ar', name: 'Arabic',             nativeName: 'العربية'           },
  { code: 'tr', name: 'Turkish',            nativeName: 'Türkçe'            },
  { code: 'ru', name: 'Russian',            nativeName: 'Русский'           },
];

export default function LanguageSelect() {
  const navigate = useNavigate();
  const { theme, language, setLanguage, user, setUser } = useApp();
  const { isOnline } = useOffline();
  const isDark = theme === 'dark';

  const handleLanguageSelect = async (langCode) => {
    // Update local React state immediately — checkmark moves right away
    setLanguage(langCode);

    // FIX: Save to Preferences immediately — works offline and survives restarts
    await Preferences.set({ key: LANGUAGE_PREF_KEY, value: langCode }).catch(() => {});

    if (user) {
      if (isOnline) {
        // Online: sync to Base44 then reload so translations apply
        try {
          await base44.auth.updateMe({ language_preference: langCode });
          const updatedUser = await base44.auth.me();
          setUser(updatedUser);
          setTimeout(() => window.location.reload(), 300);
        } catch (error) {
          console.error('[LanguageSelect] Base44 sync failed (non-fatal):', error);
          // Language is still changed locally — reload to apply translations
          setTimeout(() => window.location.reload(), 300);
        }
      } else {
        // Offline: update in-memory user and reload — Base44 will sync on reconnect
        setUser(prev => ({ ...prev, language_preference: langCode }));
        setTimeout(() => window.location.reload(), 300);
      }
    }
  };

  return (
    <div className={`min-h-screen pb-24 ${
      isDark
        ? 'bg-gradient-to-br from-[#000000] via-[#0a1a0a] to-[#001a0a]'
        : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'
    }`}>

      {/* Header */}
      <div className="sticky top-0 z-40 text-white shadow-lg bg-gradient-to-r from-[#0B3D2E] via-[#66BB6A] to-[#A5D6A7]">
        <div className="flex items-center px-4 h-14">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold ml-3">Select Language</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-2">
        {LANGUAGES.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                isSelected
                  ? isDark
                    ? 'bg-gradient-to-r from-[#0a2515]/80 to-[#0a1a0a]/80 border-2 border-[#66BB6A]'
                    : 'bg-white border-2 border-[#66BB6A]'
                  : isDark
                    ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10 hover:border-[#66BB6A]/30'
                    : 'bg-white/60 hover:bg-white/80 border border-transparent'
              }`}
            >
              <div className="text-left">
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {lang.nativeName}
                </p>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  {lang.name}
                </p>
              </div>
              {isSelected && (
                <Check className="w-6 h-6 text-[#66BB6A] shrink-0" />
              )}
            </button>
          );
        })}

        <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
          <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            Note: Missing translations fall back to English.
          </p>
        </div>
      </div>
    </div>
  );
}
