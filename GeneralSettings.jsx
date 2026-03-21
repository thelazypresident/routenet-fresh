import React, { useState } from 'react';
import { ArrowLeft, Key, Moon, Sun, Shield, DollarSign, Calendar, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../components/contexts/AppContext';
import { base44 } from '@/api/base44Client';

const CURRENCIES = [
  { value: 'USD', label: '$ USD (US Dollar)'          },
  { value: 'GBP', label: '£ GBP (British Pound)'      },
  { value: 'CAD', label: 'C$ CAD (Canadian Dollar)'   },
  { value: 'AUD', label: 'A$ AUD (Australian Dollar)' },
  { value: 'PHP', label: '₱ PHP (Philippine Peso)'    },
  { value: 'EUR', label: '€ EUR (Euro)'                },
  { value: 'BRL', label: 'R$ BRL (Brazilian Real)'    },
  { value: 'IDR', label: 'Rp IDR (Indonesian Rupiah)' },
  { value: 'MYR', label: 'RM MYR (Malaysian Ringgit)' },
  { value: 'THB', label: '฿ THB (Thai Baht)'          },
  { value: 'VND', label: '₫ VND (Vietnamese Dong)'   },
  { value: 'JPY', label: '¥ JPY (Japanese Yen)'       },
  { value: 'KRW', label: '₩ KRW (South Korean Won)'  },
  { value: 'INR', label: '₹ INR (Indian Rupee)'       },
  { value: 'AED', label: 'د.إ AED (UAE Dirham)'       },
  { value: 'SAR', label: '﷼ SAR (Saudi Riyal)'        },
  { value: 'TRY', label: '₺ TRY (Turkish Lira)'       },
  { value: 'RUB', label: '₽ RUB (Russian Ruble)'      },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY  (01/09/2026)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY  (09/01/2026)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD  (2026-01-09)' },
];

// ── Inline picker — no floating, no portal, no fixed positioning ──────────────
// Opens a list BELOW the trigger button, inside normal page flow.
// Works 100% on Android WebView, iOS WebView, and browser.
function InlinePicker({ value, options, onChange, isDark }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-sm font-medium transition-colors ${
          isDark
            ? 'bg-white/10 border-white/20 text-white'
            : 'bg-gray-50 border-gray-300 text-gray-900'
        }`}
      >
        <span>{selected?.label || value}</span>
        {open
          ? <ChevronUp  className={`w-4 h-4 shrink-0 ${isDark ? 'text-white/50' : 'text-gray-400'}`} />
          : <ChevronDown className={`w-4 h-4 shrink-0 ${isDark ? 'text-white/50' : 'text-gray-400'}`} />
        }
      </button>

      {/* Inline list — flows naturally BELOW the trigger, never floats */}
      {open && (
        <div className={`mt-1 rounded-xl border overflow-hidden ${
          isDark
            ? 'bg-[#0a1a0a] border-[#388E3C]/30'
            : 'bg-white border-gray-200'
        }`}>
          {options.map(opt => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left border-b last:border-b-0 transition-colors ${
                  isDark ? 'border-white/5' : 'border-gray-50'
                } ${
                  isSelected
                    ? isDark ? 'bg-[#66BB6A]/15 text-[#66BB6A] font-semibold' : 'bg-green-50 text-green-700 font-semibold'
                    : isDark ? 'text-white/80 active:bg-white/5'              : 'text-gray-700 active:bg-gray-50'
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

export default function GeneralSettings() {
  const navigate = useNavigate();
  const { t, theme, toggleTheme, formatPrefs, updateFormatPrefs } = useApp();

  const [currency, setCurrency]   = useState(formatPrefs.currency);
  const [dateFormat, setDateFormat] = useState(formatPrefs.dateFormat);

  const isDark       = theme === 'dark';
  const isGoogleUser = false;

  const handleCurrencyChange = (v) => { setCurrency(v);   updateFormatPrefs({ currency: v });    };
  const handleDateChange     = (v) => { setDateFormat(v); updateFormatPrefs({ dateFormat: v }); };

  const cardClass = `rounded-2xl p-4 shadow-lg mb-4 ${
    isDark
      ? 'bg-gradient-to-br from-[#0a0a0a] via-[#0d1a0d] to-[#0a0a0a] border border-[#388E3C]/30'
      : 'bg-white border border-gray-200'
  }`;

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-black' : 'bg-white'}`}>

      {/* Header */}
      <div className="sticky top-0 z-40 text-white shadow-lg bg-gradient-to-r from-[#0B3D2E] via-[#66BB6A] to-[#A5D6A7]">
        <div className="flex items-center px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold ml-3">{t('GENERAL_SETTINGS')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ACCOUNT */}
        <div>
          <h2 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-gray-500'}`}>
            {t('ACCOUNT')}
          </h2>
          <div className={`rounded-2xl shadow-lg overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-[#0a0a0a] via-[#0d1a0d] to-[#0a0a0a] border border-[#388E3C]/30'
              : 'bg-white border border-gray-200'
          }`}>
            <button
              onClick={() => { if (!isGoogleUser) base44.auth.redirectToLogin(); }}
              disabled={isGoogleUser}
              className={`w-full flex items-center justify-between p-4 transition-all ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
              } ${isGoogleUser ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Key className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('RESET_PASSWORD')}
                </p>
              </div>
              {!isGoogleUser && <Shield className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />}
            </button>
          </div>
        </div>

        {/* PREFERENCES */}
        <div>
          <h2 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-gray-500'}`}>
            {t('PREFERENCES')}
          </h2>

          {/* Theme */}
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-3">
              {theme === 'dark'
                ? <Moon className="w-5 h-5 text-[#66BB6A]" />
                : <Sun  className="w-5 h-5 text-gray-700"  />
              }
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>{t('THEME')}</span>
            </div>
            <div className="flex gap-2 ml-8">
              <button onClick={toggleTheme} className={`flex-1 py-2.5 px-3 rounded-full font-bold text-sm transition-all ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black shadow-lg'
                  : isDark ? 'bg-white/5 text-white border border-[#66BB6A]/20' : 'bg-gray-200 text-gray-700'
              }`}>{t('LIGHT_MODE')}</button>
              <button onClick={toggleTheme} className={`flex-1 py-2.5 px-3 rounded-full font-bold text-sm transition-all ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-[#66BB6A] via-[#A5D6A7] to-[#FACC15] text-black shadow-lg'
                  : isDark ? 'bg-white/5 text-white border border-[#66BB6A]/20' : 'bg-gray-200 text-gray-700'
              }`}>{t('DARK_MODE')}</button>
            </div>
          </div>

          {/* Currency */}
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>{t('CURRENCY')}</span>
            </div>
            <div className="ml-8">
              <InlinePicker value={currency} options={CURRENCIES} onChange={handleCurrencyChange} isDark={isDark} />
            </div>
          </div>

          {/* Date Format */}
          <div className={`rounded-2xl p-4 shadow-lg ${
            isDark
              ? 'bg-gradient-to-br from-[#0a0a0a] via-[#0d1a0d] to-[#0a0a0a] border border-[#388E3C]/30'
              : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <Calendar className={`w-5 h-5 ${isDark ? 'text-[#66BB6A]' : 'text-gray-700'}`} />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>{t('DATE_FORMAT')}</span>
            </div>
            <div className="ml-8">
              <InlinePicker value={dateFormat} options={DATE_FORMATS} onChange={handleDateChange} isDark={isDark} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
