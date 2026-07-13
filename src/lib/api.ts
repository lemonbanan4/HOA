// Detect if running under Capacitor/native platform
const isCapacitor = typeof window !== "undefined" && (window as any).Capacitor !== undefined;

// Replace this with the actual deployed Cloud Run service URL after deployment
export const BACKEND_URL = "https://hoa-tracker-backend-350407592063.europe-west4.run.app";

export function getApiUrl(path: string): string {
  // If running locally on web via dev server or prod express server, keep relative path
  if (!isCapacitor && typeof window !== "undefined" && !window.location.origin.includes("localhost:5173") && !window.location.origin.includes("localhost:3000")) {
    return path;
  }

  // For mobile app, use absolute URL
  const baseUrl = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
