// Detect if running under Capacitor native platform (iOS / Android)
const isCapacitor =
  typeof window !== "undefined" && (window as any).Capacitor !== undefined;

// The deployed Cloud Run backend URL — all AI/server calls route here from mobile
export const BACKEND_URL =
  "https://hoa-tracker-backend-350407592063.europe-west4.run.app";

/**
 * Returns the correct full URL for a given API path.
 *
 * - Capacitor (native mobile app) → always uses the absolute BACKEND_URL
 * - Browser on localhost (dev server) → relative path (served by Express/Vite)
 * - Browser in production (Cloud Run) → relative path (served by Express)
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (isCapacitor) {
    // Mobile app must use absolute URL — can't do relative requests
    const base = BACKEND_URL.endsWith("/")
      ? BACKEND_URL.slice(0, -1)
      : BACKEND_URL;
    return `${base}${cleanPath}`;
  }

  // Web (both dev and production) — use relative path
  return cleanPath;
}
