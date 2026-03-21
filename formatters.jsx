// Shared formatting utilities for the entire app

// Exactly 17 currencies — one per supported language region
export const CURRENCY_SYMBOLS = {
  USD: '$',      // English (US)
  GBP: '£',      // English (UK)
  CAD: 'C$',     // English (Canada)
  AUD: 'A$',     // English (Australia)
  PHP: '₱',      // Filipino / Tagalog
  EUR: '€',      // Spanish, French, German, Portuguese (Europe)
  BRL: 'R$',     // Portuguese (Brazil)
  IDR: 'Rp',     // Indonesian
  MYR: 'RM',     // Malay
  THB: '฿',      // Thai
  VND: '₫',      // Vietnamese
  JPY: '¥',      // Japanese
  KRW: '₩',      // Korean
  INR: '₹',      // Hindi & Tamil
  AED: 'د.إ',    // Arabic (UAE)
  SAR: '﷼',      // Arabic (Saudi Arabia)
  TRY: '₺',      // Turkish
  RUB: '₽',      // Russian
};

const LOCALE_TO_CURRENCY = {
  // English regions
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD',
  // Filipino
  PH: 'PHP',
  // Spanish / French / German / Portuguese(EU)
  ES: 'EUR', FR: 'EUR', DE: 'EUR', PT: 'EUR',
  // Eurozone extras (fallback)
  IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR',
  IE: 'EUR', GR: 'EUR', LU: 'EUR', SI: 'EUR', SK: 'EUR',
  EE: 'EUR', LV: 'EUR', LT: 'EUR', CY: 'EUR', MT: 'EUR',
  // Portuguese (Brazil)
  BR: 'BRL',
  // Indonesian
  ID: 'IDR',
  // Malay
  MY: 'MYR',
  // Thai
  TH: 'THB',
  // Vietnamese
  VN: 'VND',
  // Japanese
  JP: 'JPY',
  // Korean
  KR: 'KRW',
  // Hindi & Tamil (India)
  IN: 'INR',
  // Arabic
  AE: 'AED', SA: 'SAR', QA: 'SAR', BH: 'SAR', KW: 'SAR', OM: 'SAR',
  // Turkish
  TR: 'TRY',
  // Russian
  RU: 'RUB',
};

// FIX: Key names changed from 'riderpro_pref_*' to 'routenet_pref_*'.
// AppContext.jsx and GeneralSettings.jsx both use 'routenet_pref_*' but this
// file used 'riderpro_pref_*' — a leftover from the app's old name. Because
// the keys didn't match, getPreferences() always returned the detected locale
// currency instead of the user's saved choice, and setPreferences() wrote to
// a key that nothing ever read. Currency and date format preferences were
// effectively broken for all users.
const PREF_CURRENCY_KEY = 'routenet_pref_currency';
const PREF_DATE_FORMAT_KEY = 'routenet_pref_date_format';

const detectCurrencyFromLocale = () => {
  try {
    const locale =
      Intl?.DateTimeFormat?.().resolvedOptions?.().locale ||
      navigator?.language ||
      'en-US';

    const normalized = String(locale).toUpperCase();
    const parts = normalized.split(/[-_]/);
    const region = parts[1];

    if (region && LOCALE_TO_CURRENCY[region]) {
      return LOCALE_TO_CURRENCY[region];
    }

    for (const code of Object.keys(LOCALE_TO_CURRENCY)) {
      if (normalized.includes(`-${code}`) || normalized.includes(`_${code}`) || normalized.endsWith(code)) {
        return LOCALE_TO_CURRENCY[code];
      }
    }

    return 'USD';
  } catch {
    return 'USD';
  }
};

export const getPreferences = () => {
  // FIX: Read from 'routenet_pref_currency' — consistent with AppContext
  const savedCurrency = localStorage.getItem(PREF_CURRENCY_KEY);
  const detectedCurrency = savedCurrency || detectCurrencyFromLocale();

  if (!savedCurrency) {
    localStorage.setItem(PREF_CURRENCY_KEY, detectedCurrency);
  }

  return {
    currency: detectedCurrency,
    // FIX: Read from 'routenet_pref_date_format' — consistent with AppContext
    dateFormat: localStorage.getItem(PREF_DATE_FORMAT_KEY) || 'MM/DD/YYYY',
    thousandSeparator: ',',
    decimalPrecision: 2,
  };
};

export const setPreferences = (prefs) => {
  // FIX: Write to 'routenet_pref_*' keys — consistent with AppContext
  if (prefs.currency) localStorage.setItem(PREF_CURRENCY_KEY, prefs.currency);
  if (prefs.dateFormat) localStorage.setItem(PREF_DATE_FORMAT_KEY, prefs.dateFormat);
};

export const formatMoney = (amount, prefs = null) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '';

  const p = prefs || getPreferences();
  const symbol = CURRENCY_SYMBOLS[p.currency] || '$';
  const precision = p.decimalPrecision;
  const separator = p.thousandSeparator;

  const isNegative = Number(amount) < 0;
  const absAmount = Math.abs(Number(amount));
  let formatted = absAmount.toFixed(precision);

  const parts = formatted.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  if (separator) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }

  formatted = decimalPart && precision > 0 ? `${integerPart}.${decimalPart}` : integerPart;

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
};

export const formatNumber = (num, prefs = null) => {
  if (num === undefined || num === null || isNaN(num)) return '';

  const p = prefs || getPreferences();
  const precision = p.decimalPrecision;
  const separator = p.thousandSeparator;

  const absNum = Math.abs(Number(num));
  let formatted = absNum.toFixed(precision);

  const parts = formatted.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  if (separator) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }

  formatted = decimalPart && precision > 0 ? `${integerPart}.${decimalPart}` : integerPart;

  return formatted;
};

export const formatDate = (dateInput, prefs = null) => {
  if (!dateInput) return '';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    const p = prefs || getPreferences();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');
    const year  = date.getFullYear();

    switch (p.dateFormat) {
      case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY':
      default:           return `${month}/${day}/${year}`;
    }
  } catch {
    return '';
  }
};
