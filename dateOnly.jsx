/**
 * Safe local-timezone date-only parsing and formatting.
 * NEVER uses new Date("YYYY-MM-DD") which parses as UTC.
 */

/**
 * Parse a date-only string or Date object into a local Date (no time component).
 * @param {string|Date} value - "YYYY-MM-DD" string or Date object
 * @returns {Date} - Local midnight of that day
 */
export function parseLocalDateOnly(value) {
  if (!value) {
    return stripTime(new Date());
  }

  if (value instanceof Date) {
    return stripTime(value);
  }

  if (typeof value === 'string') {
    // Parse "YYYY-MM-DD" as local date, NOT UTC
    const parts = value.trim().split('-');
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1; // 0-indexed month
      const d = Number(parts[2]);
      
      // Validate
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && d > 0 && d < 32) {
        return new Date(y, m, d); // Local midnight
      }
    }
  }

  // Fallback to today
  return stripTime(new Date());
}

/**
 * Convert a Date to "YYYY-MM-DD" string using local values (NOT UTC).
 * @param {Date} date
 * @returns {string} - "YYYY-MM-DD"
 */
export function toDateOnlyString(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date();
  }
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  
  return `${y}-${m}-${d}`;
}

/**
 * Strip time component from a date, return local midnight.
 * @param {Date} date
 * @returns {Date}
 */
export function stripTime(date) {
  if (!date || !(date instanceof Date)) {
    return new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}