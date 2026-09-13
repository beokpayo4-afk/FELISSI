const AUTH_PREFIXES = ["/login", "/register", "/forgot-password"];

export function safeNextPath(value: string | null | undefined, fallback = "/account"): string {
  if (!value) {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  const pathname = value.split(/[?#]/, 1)[0] ?? value;
  if (AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return fallback;
  }
  return value;
}
