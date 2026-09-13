function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const apiBaseUrl = required("VITE_API_BASE_URL").replace(/\/$/, "");

function resolveAdminUrl(apiUrl: string): string {
  if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
    return `${new URL(apiUrl).origin}/admin/`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/admin/`;
  }
  return "/admin/";
}

/** Resolve API-relative upload paths (e.g. /uploads/products/x.webp) against the API origin. */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }
  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }
  if (url.startsWith("/placeholders/") || url.startsWith("placeholders/")) {
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
