const TOKEN_KEY = "voltcart.authToken";
const EXPIRED_KEY = "voltcart.authExpired";
export const AUTH_CHANGED_EVENT = "voltcart:auth-changed";

export function readAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function markAuthExpired(): void {
  try {
    sessionStorage.setItem(EXPIRED_KEY, "1");
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function clearAuthExpired(): void {
  try {
    sessionStorage.removeItem(EXPIRED_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function peekAuthExpired(): boolean {
  try {
    return sessionStorage.getItem(EXPIRED_KEY) === "1";
  } catch {
    return false;
  }
}
