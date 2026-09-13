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

export const env = {
  apiBaseUrl,
  adminUrl: resolveAdminUrl(apiBaseUrl),
  appName: import.meta.env.VITE_APP_NAME ?? "FELISSI",
  appEnv: import.meta.env.VITE_APP_ENV ?? "development",
} as const;
