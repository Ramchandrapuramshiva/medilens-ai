const AUTH_PATHS = new Set(['/login', '/signup', '/forgot-password']);

export function normalizeReturnPath(value, fallback = '/analyze') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback;
  const pathname = value.split(/[?#]/, 1)[0];
  return AUTH_PATHS.has(pathname) ? fallback : value;
}

export function getReturnPath(search, fallback = '/analyze') {
  const requestedPath = new URLSearchParams(search).get('redirect');
  return normalizeReturnPath(requestedPath, fallback);
}

export function withReturnPath(authPath, returnPath) {
  return `${authPath}?redirect=${encodeURIComponent(normalizeReturnPath(returnPath))}`;
}

export function getLocationPath(location) {
  return `${location.pathname}${location.search}${location.hash}`;
}
