export const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005').replace(/\/$/, '');

/**
 * Resolve an asset path possibly stored as a relative '/assets/..' path in the DB.
 * If the path already looks absolute (starts with http) it is returned unchanged.
 * If it starts with '/assets' we prefix it with the backend base URL so the
 * browser requests the file from the backend server (where ServeStatic serves them).
 */
export function resolveAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  const trimmed = String(path).trim();
  if (!trimmed) return undefined;
  // Already absolute: if it's https, return as-is. If it's an http absolute that points
  // to localhost/dev backend, rewrite the origin to BACKEND_BASE so production pages
  // won't attempt to load insecure http://localhost:3005 resources (causing mixed
  // content / blocked requests).
  if (/^https:\/\//i.test(trimmed)) return trimmed;

  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const base = BACKEND_BASE.replace(/\/api\/?$/i, '');
      return `${base}${url.pathname}${url.search}${url.hash}`;
    } catch {
      return trimmed;
    }
  }

  if (trimmed.startsWith('/assets')) {
    // If NEXT_PUBLIC_API_URL includes a trailing /api, strip it so we don't end up with /api/assets
    const base = BACKEND_BASE.replace(/\/api\/?$/i, '');
    return `${base}${trimmed}`;
  }

  // For other relative paths leave as-is; caller may want to handle them differently
  return trimmed;
}
