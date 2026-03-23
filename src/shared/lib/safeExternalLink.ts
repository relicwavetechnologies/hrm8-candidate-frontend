/**
 * Safe external link utilities – block javascript:, data:, vbscript: and other unsafe schemes.
 * Allow: https:, http:, mailto:, tel:, and relative paths (/, /path).
 */

const BLOCKED_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:'];
const ALLOWED_SCHEMES = ['https:', 'http:', 'mailto:', 'tel:'];

function getScheme(href: string | null | undefined): string | null {
  if (typeof href !== 'string' || !href.trim()) return null;
  const trimmed = href.trim();
  const lower = trimmed.toLowerCase();
  if (BLOCKED_SCHEMES.some((s) => lower.startsWith(s))) return null;
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return 'relative';
  }
  try {
    const parsed = new URL(trimmed, 'https://dummy.com');
    return parsed.protocol ? parsed.protocol.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Returns true if the URL is safe to open or use as href. */
export function isSafeUrl(href: string | null | undefined): boolean {
  const scheme = getScheme(href);
  if (!scheme) return false;
  if (scheme === 'relative') return true;
  const lower = scheme.toLowerCase();
  if (BLOCKED_SCHEMES.some((s) => lower.startsWith(s))) return false;
  return ALLOWED_SCHEMES.includes(lower);
}

/** Opens URL in new tab if safe. Returns true if opened, false if blocked. */
export function safeOpenExternal(url: string | null | undefined): boolean {
  if (!isSafeUrl(url)) return false;
  const href = String(url).trim();
  window.open(href, '_blank', 'noopener,noreferrer');
  return true;
}
