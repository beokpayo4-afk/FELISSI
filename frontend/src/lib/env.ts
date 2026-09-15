// Static key so Vite inlines this in production; dynamic import.meta.env[name] is stripped.
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (!configuredApiBaseUrl) {
  throw new Error("Missing required environment variable: VITE_API_BASE_URL");
}
const apiBaseUrl = configuredApiBaseUrl.replace(/\/$/, "");

function resolveAdminUrl(apiUrl: string): string {
  if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
    return `${new URL(apiUrl).origin}/admin/`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/admin/`;
  }
  return "/admin/";
}

/** Frontend public files must stay on the storefront origin. `/uploads/` is API media. */
const FRONTEND_MEDIA_PREFIXES = ["/placeholders/", "/catalog/", "/brand/"];

function isFrontendMedia(path: string): boolean {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return FRONTEND_MEDIA_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/** Resolve API-relative upload paths (e.g. /uploads/products/x.webp) against the API origin. */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }
  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }
  if (isFrontendMedia(url)) {
    return url.startsWith("/") ? url : `/${url}`;
  }

  const normalized = url.startsWith("/") ? url : `/${url}`;

  // Same-origin relative API (`/api`) — Vite proxies `/uploads` in local dev.
  if (apiBaseUrl.startsWith("/")) {
    return normalized;
  }

  try {
    const apiOrigin = new URL(apiBaseUrl).origin;
    return `${apiOrigin}${normalized}`;
  } catch {
    return normalized;
  }
}

export const env = {
  apiBaseUrl,
  adminUrl: resolveAdminUrl(apiBaseUrl),
  resolveMediaUrl,
  appName: import.meta.env.VITE_APP_NAME ?? "FELISSI",
  appEnv: import.meta.env.VITE_APP_ENV ?? "development",
} as const;
