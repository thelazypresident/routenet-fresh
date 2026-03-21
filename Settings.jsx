import React, { useState } from 'react';
import { Key, Globe, Moon, Sun, DollarSign, Calendar, ChevronRight, ChevronDown, ChevronUp, Search, Trash2, Check } from 'lucide-react';
import { useApp } from '../components/contexts/AppContext';
import { base44 } from '@/api/base44Client';
import {
  deleteAllLocalTransactions,
  deleteAllLocalSavingsGoals,
  deleteAllLocalExpenseLimits,
  deleteAllLocalRenewals,
  deleteAllLocalMaintenance,
  deleteAllLocalProfile,
  clearAllNotificationLogs,
} from '@/database/genericRepository';
import { useAuth } from '@/lib/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const LANGUAGES = [
  { code: 'en',    name: 'English',              nativeName: 'English' },
  { code: 'tl',    name: 'Tagalog',              nativeName: 'Tagalog' },
  { code: 'es',    name: 'Spanish',              nativeName: 'Español' },
  { code: 'pt',    name: 'Portuguese',           nativeName: 'Português' },
  { code: 'fr',    name: 'French',               nativeName: 'Français' },
  { code: 'de',    name: 'German',               nativeName: 'Deutsch' },
  { code: 'ru',    name: 'Russian',              nativeName: 'Русский' },
  { code: 'ar',    name: 'Arabic',               nativeName: 'العربية' },
  { code: 'hi',    name: 'Hindi',                nativeName: 'हिन्दी' },
  { code: 'ta',    name: 'Tamil',                nativeName: 'தமிழ்' },
  { code: 'tr',    name: 'Turkish',              nativeName: 'Türkçe' },
  { code: 'vi',    name: 'Vietnamese',           nativeName: 'Tiếng Việt' },
  { code: 'id',    name: 'Indonesian',           nativeName: 'Bahasa Indonesia' },
  { code: 'ms',    name: 'Malay',                nativeName: 'Bahasa Melayu' },
  { code: 'th',    name: 'Thai',                 nativeName: 'ไทย' },
  { code: 'ja',    name: 'Japanese',             nativeName: '日本語' },
  { code: 'ko',    name: 'Korean',               nativeName: '한국어' },
  { code: 'zh-CN', name: 'Mandarin (Simplified)', nativeName: '简体中文' },
  { code: 'zh-HK', name: 'Cantonese (Traditional)', nativeName: '繁體中文' },
];

// ── InlinePicker — replaces Radix <Select> ────────────────────────────────────
// Opens a list BELOW the trigger inside normal page flow.
// No floating, no portal, no fixed/absolute — works on Android & iOS WebView.
function InlinePicker({ value, options, onChange, isDark }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between h-10 px-3 py-2 rounded-md border text-sm transition-colors ${
          isDark
            ? 'bg-transparent border-white/20 text-white'
            : 'bg-transparent border-input text-gray-900'
        }`}
      >
        <span>{selected?.label || value}</span>
        {open
          ? <ChevronUp   className="w-4 h-4 shrink-0 opacity-50" />
          : <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
        }
      </button>

      {open && (
        <div className={`mt-1 rounded-md border shadow-md overflow-hidden ${
          isDark ? 'bg-[#0a1a0a] border-[#66BB6A]/20' : 'bg-white border-gray-200'
        }`}>
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left border-b last:border-b-0 ${
                  isDark ? 'border-white/5' : 'border-gray-50'
                } ${
                  isSelected
                    ? isDark ? 'bg-[#66BB6A]/15 text-[#66BB6A] font-semibold' : 'bg-green-50 text-green-700 font-semibold'
                    : isDark ? 'text-white/80' : 'text-gray-700'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CURRENCIES = [
  { value: 'USD', label: '$ USD (US Dollar)'          },
  { value: 'PHP', label: '₱ PHP (Philippine Peso)'    },
  { value: 'EUR', label: '€ EUR (Euro)'                },
  { value: 'GBP', label: '£ GBP (British Pound)'      },
  { value: 'JPY', label: '¥ JPY (Japanese Yen)'       },
  { value: 'CAD', label: 'C$ CAD (Canadian Dollar)'   },
  { value: 'AUD', label: 'A$ AUD (Australian Dollar)' },
  { value: 'NZD', label: 'NZ$ NZD (New Zealand Dollar)' },
  { value: 'SGD', label: 'S$ SGD (Singapore Dollar)'  },
  { value: 'HKD', label: 'HK$ HKD (Hong Kong Dollar)' },
  { value: 'INR', label: '₹ INR (Indian Rupee)'       },
  { value: 'AED', label: 'د.إ AED (UAE Dirham)'       },
  { value: 'SAR', label: '﷼ SAR (Saudi Riyal)'        },
  { value: 'QAR', label: '﷼ QAR (Qatari Riyal)'      },
  { value: 'MYR', label: 'RM MYR (Malaysian Ringgit)' },
  { value: 'IDR', label: 'Rp IDR (Indonesian Rupiah)' },
  { value: 'THB', label: '฿ THB (Thai Baht)'          },
  { value: 'VND', label: '₫ VND (Vietnamese Dong)'   },
  { value: 'KRW', label: '₩ KRW (South Korean Won)'  },
  { value: 'CNY', label: '¥ CNY (Chinese Yuan)'       },
  { value: 'BRL', label: 'R$ BRL (Brazilian Real)'    },
  { value: 'MXN', label: '$ MXN (Mexican Peso)'       },
  { value: 'ZAR', label: 'R ZAR (South African Rand)' },
  { value: 'CHF', label: 'CHF CHF (Swiss Franc)'      },
  { value: 'SEK', label: 'kr SEK (Swedish Krona)'     },
  { value: 'NOK', label: 'kr NOK (Norwegian Krone)'   },
  { value: 'DKK', label: 'kr DKK (Danish Krone)'      },
  { value: 'PLN', label: 'zł PLN (Polish Zloty)'      },
  { value: 'TRY', label: '₺ TRY (Turkish Lira)'       },
  { value: 'RUB', label: '₽ RUB (Russian Ruble)'      },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (01/09/2026)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (09/01/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-01-09)' },
];

export default function Settings() {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    user,
    formatPrefs,
    updateFormatPrefs,
    t
  } = useApp();
  const { logout } = useAuth();

  const [currency, setCurrency] = useState(formatPrefs.currency);
  const [dateFormat, setDateFormat] = useState(formatPrefs.dateFormat);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDark = theme === 'dark';
  const isGoogleUser = false;

  const handleLanguageChange = async (newLang) => {
    setLanguagePickerOpen(false);
    setLanguageSearch('');
    await setLanguage(newLang);
  };

  const filteredLanguages = LANGUAGES.filter((lang) => {
    if (!languageSearch) return true;
    const search = languageSearch.toLowerCase();
    return (
      lang.nativeName.toLowerCase().includes(search) ||
      lang.name.toLowerCase().includes(search) ||
      lang.code.toLowerCase().includes(search)
    );
  });

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    updateFormatPrefs({ currency: newCurrency });
  };

  const handleDateFormatChange = (newFormat) => {
    setDateFormat(newFormat);
    updateFormatPrefs({ dateFormat: newFormat });
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      // Step 1: Delete local SQLite data first
      await Promise.allSettled([
        deleteAllLocalTransactions && deleteAllLocalTransactions(),
        deleteAllLocalSavingsGoals && deleteAllLocalSavingsGoals(),
        deleteAllLocalExpenseLimits && deleteAllLocalExpenseLimits(),
        deleteAllLocalRenewals && deleteAllLocalRenewals(),
        deleteAllLocalMaintenance && deleteAllLocalMaintenance(),
        deleteAllLocalProfile && deleteAllLocalProfile(),
        clearAllNotificationLogs && clearAllNotificationLogs(user.email),
      ]);

      // Step 2: Delete cloud data (non-blocking if offline)
      await Promise.allSettled([
        base44.entities.Transaction.filter({ created_by: user.email }).then((txs) =>
          Promise.all(txs.map((tx) => base44.entities.Transaction.delete(tx.id)))
        ),
        base44.entities.SavingsGoal.filter({ created_by: user.email }).then((goals) =>
          Promise.all(goals.map((g) => base44.entities.SavingsGoal.delete(g.id)))
        ),
        base44.entities.RenewalReminder.filter({ created_by: user.email }).then((reminders) =>
          Promise.all(reminders.map((r) => base44.entities.RenewalReminder.delete(r.id)))
        ),
        base44.entities.CustomMaintenance.filter({ created_by: user.email }).then((items) =>
          Promise.all(items.map((i) => base44.entities.CustomMaintenance.delete(i.id)))
        ),
        base44.entities.Notification.filter({ created_by: user.email }).then((notifs) =>
          Promise.all(notifs.map((n) => base44.entities.Notification.delete(n.id)))
        ),
        base44.entities.ExpenseLimit.filter({ created_by: user.email }).then((limits) =>
          Promise.all(limits.map((l) => base44.entities.ExpenseLimit.delete(l.id)))
        ),
      ]);

      // Step 3: Clear only base44 auth keys — never clear all localStorage
      try {
        Object.keys(localStorage)
          .filter(k => k.startsWith('base44'))
          .forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
      } catch (e) {}

      // Step 4: Clear Preferences
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key: 'routenet_cached_user' });
        await Preferences.remove({ key: 'routenet_explicit_logout' });
      } catch (e) {}

      toast.success('Your account has been deleted.');
      // Navigate to dashboard (guest mode) after account deletion
      window.location.hash = '#/';
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`min-h-screen pb-20 ${
        isDark
          ? 'bg-gradient-to-br from-[#000000] via-[#0a1a0a] to-[#001a0a]'
          : 'bg-gradient-to-br from-[#f0f9f0] via-white to-[#e8f5e9]'
      }`}
    >
      <div className="max-w-2xl mx-auto px-5 py-8 space-y-4">

        {/* Language */}
        <div
          className={`rounded-2xl overflow-hidden transition-all ${
            isDark
              ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10'
              : 'bg-white/60'
          }`}
        >
          <button
            onClick={() => setLanguagePickerOpen(!languagePickerOpen)}
            className={`w-full flex items-center justify-between p-4 transition-all ${
              isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
              <div className="text-left">
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('LANGUAGE')}
                </p>
                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  {currentLanguage.nativeName}
                </p>
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 transition-transform ${
                languagePickerOpen ? 'rotate-90' : ''
              } ${isDark ? 'text-white/40' : 'text-gray-400'}`}
            />
          </button>

          {languagePickerOpen && (
            <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div className={`p-3 px-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isDark ? 'bg-white/5' : 'bg-gray-100'
                  }`}
                >
                  <Search className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder={t('SEARCH_LANGUAGE')}
                    value={languageSearch}
                    onChange={(e) => setLanguageSearch(e.target.value)}
                    className={`flex-1 bg-transparent outline-none text-sm ${
                      isDark ? 'text-white placeholder-white/40' : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {filteredLanguages.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center justify-between p-3 px-4 transition-all ${
                        isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                      } ${isSelected ? (isDark ? 'bg-white/10' : 'bg-gray-100') : ''}`}
                    >
                      <div className="text-left ml-2">
                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {lang.nativeName}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                          {lang.name}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#66BB6A]" />
                      )}
                    </button>
                  );
                })}

                {filteredLanguages.length === 0 && (
                  <div className={`p-4 text-center text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    {t('NO_LANGUAGES_FOUND')}
                  </div>
                )}
              </div>

              <div
                className={`p-3 px-4 text-xs ${
                  isDark ? 'text-white/50' : 'text-gray-500'
                } border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}
              >
                {t('MISSING_TRANSLATIONS_NOTE')}
              </div>
            </div>
          )}
        </div>

        {/* Theme */}
        <div
          className={`rounded-2xl p-4 ${
            isDark
              ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10'
              : 'bg-white/60'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-[#66BB6A]" />
              ) : (
                <Sun className="w-5 h-5 text-gray-700" />
              )}
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('THEME')}
              </span>
            </div>
          </div>
          <div className="flex gap-2 ml-8">
            <button
              onClick={toggleTheme}
              className={`flex-1 py-2.5 px-3 rounded-full font-bold text-sm transition-all ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black shadow-lg'
                  : isDark
                  ? 'bg-white/5 text-white border border-[#66BB6A]/20'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('LIGHT_MODE')}
            </button>
            <button
              onClick={toggleTheme}
              className={`flex-1 py-2.5 px-3 rounded-full font-bold text-sm transition-all ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black shadow-lg'
                  : isDark
                  ? 'bg-white/5 text-white border border-[#66BB6A]/20'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('DARK_MODE')}
            </button>
          </div>
        </div>

        {/* Currency */}
        <div
          className={`rounded-2xl p-4 ${
            isDark
              ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10'
              : 'bg-white/60'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('CURRENCY')}
            </span>
          </div>
          <div className="ml-8">
            <InlinePicker value={currency} options={CURRENCIES} onChange={handleCurrencyChange} isDark={isDark} />
          </div>
        </div>

        {/* Date Format */}
        <div
          className={`rounded-2xl p-4 ${
            isDark
              ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10'
              : 'bg-white/60'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <Calendar className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('DATE_FORMAT')}
            </span>
          </div>
          <div className="ml-8">
            <InlinePicker value={dateFormat} options={DATE_FORMATS} onChange={handleDateFormatChange} isDark={isDark} />
          </div>
        </div>

        {/* Reset Password */}
        <button
          onClick={() => { if (!isGoogleUser) base44.auth.redirectToLogin(); }}
          disabled={isGoogleUser}
          className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
            isDark
              ? 'bg-gradient-to-r from-[#0a1a0a]/60 to-[#0a2515]/40 border border-[#66BB6A]/10 hover:border-[#66BB6A]/20'
              : 'bg-white/60 hover:bg-white/80'
          } ${isGoogleUser ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-3">
            <Key className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('RESET_PASSWORD')}
            </p>
          </div>
          {!isGoogleUser && (
            <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
          )}
        </button>

        {/* Delete Account */}
        <button
          onClick={() => setShowDeleteAccountModal(true)}
          className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
            isDark
              ? 'bg-gradient-to-r from-[#3d0a0a]/60 to-[#2a0a0a]/40 border border-red-500/20 hover:border-red-500/40'
              : 'bg-red-50/60 hover:bg-red-50/80 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Trash2 className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <div className="text-left">
              <p className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {t('DELETE_ACCOUNT')}
              </p>
              <p className={`text-xs ${isDark ? 'text-red-300/60' : 'text-red-500/70'}`}>
                {t('DELETE_ACCOUNT_DESCRIPTION')}
              </p>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 ${isDark ? 'text-red-400/40' : 'text-red-400'}`} />
        </button>
      </div>

      <Dialog open={showDeleteAccountModal} onOpenChange={setShowDeleteAccountModal}>
        <DialogContent className={isDark ? 'bg-[#0a1a0a] border-red-500/20' : 'bg-white border-red-200'}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-red-400' : 'text-red-600'}>
              {t('DELETE_ACCOUNT')}?
            </DialogTitle>
            <DialogDescription className={isDark ? 'text-white/80' : 'text-gray-700'}>
              {t('DELETE_ACCOUNT_DESCRIPTION')}. {t('CANNOT_UNDO')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteAccountModal(false)}
              disabled={isDeleting}
              className={isDark ? 'bg-white text-gray-900 border-[#66BB6A]/20 hover:bg-white/90 hover:text-gray-900' : ''}
            >
              {t('CANCEL')}
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? t('DELETING') : t('DELETE_ACCOUNT')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
