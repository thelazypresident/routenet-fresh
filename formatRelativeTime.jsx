/**
 * Formats a timestamp into a human-readable relative time string.
 * @param {string|Date} createdAt - ISO date string (UTC) or Date object from the entity
 * @returns {string} - Relative time like "Just now", "5 min ago", "2 h ago", "3 d ago"
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return "";

  // If timestamp has no timezone (no Z or +/-HH:MM), treat it as UTC.
  const hasTimeZone = /[zZ]|[+-]\d\d:?\d\d$/.test(dateString);
  const normalized = hasTimeZone ? dateString : dateString + "Z";

  const date = new Date(normalized);
  const now = new Date();

  let diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) diffMs = 0;

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Seconds
  if (diffSeconds < 5) return "Just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  // Minutes
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  // Hours
  if (diffHours < 24) return `${diffHours}h ago`;

  // Days (up to 6d)
  if (diffDays < 7) return `${diffDays}d ago`;

  // Older than a week → show simple date
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}