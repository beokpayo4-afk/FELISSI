import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  changePassword as changePasswordRequest,
  fetchMe,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  updateProfile as updateProfileRequest,
} from "@/api/auth";
import {
  AUTH_CHANGED_EVENT,
  clearAuthExpired,
  clearAuthToken,
  readAuthToken,
  writeAuthToken,
} from "@/lib/authStorage";
import type {
  ApiCustomer,
  AuthPayload,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from "@/types/auth";

interface AuthState {
  status: "loading" | "ready";
  token: string | null;
  customer: ApiCustomer | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthPayload>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  refreshCustomer: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [token, setToken] = useState<string | null>(() => readAuthToken());
  const [customer, setCustomer] = useState<ApiCustomer | null>(null);

  const hydrate = useCallback(async () => {
    const stored = readAuthToken();
    setToken(stored);
    if (!stored) {
      setCustomer(null);
      setStatus("ready");
      return;
    }
    try {
      setCustomer(await fetchMe());
    } catch {
      clearAuthToken();
      setToken(null);
      setCustomer(null);
    } finally {
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    void hydrate();
    window.addEventListener(AUTH_CHANGED_EVENT, hydrate);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, hydrate);
  }, [hydrate]);

  const applySession = useCallback((nextToken: string, nextCustomer: ApiCustomer) => {
    clearAuthExpired();
    writeAuthToken(nextToken);
    setToken(nextToken);
    setCustomer(nextCustomer);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      token,
      customer,
      isAuthenticated: Boolean(token && customer),
      login: async (payload) => {
        const result = await loginCustomer(payload);
        applySession(result.token, result.customer);
        const me = await fetchMe().catch(() => result.customer);
        const customer = {
          ...me,
          is_staff: Boolean(result.is_staff || result.customer.is_staff || me.is_staff),
        };
        setCustomer(customer);
        return { ...result, customer, is_staff: customer.is_staff };
      },
      register: async (payload) => {
        const result = await registerCustomer(payload);
        applySession(result.token, result.customer);
      },
      updateProfile: async (payload) => {
        setCustomer(await updateProfileRequest(payload));
      },
      changePassword: async (payload) => {
        const result = await changePasswordRequest(payload);
        applySession(result.token, result.customer);
      },
      refreshCustomer: async () => {
        const stored = readAuthToken();
        if (!stored) {
          return;
        }
        setCustomer(await fetchMe());
      },
      logout: async () => {
        try {
          await logoutCustomer();
        } catch {
          // Token is cleared locally even if the API is unreachable.
        }
        clearAuthExpired();
        clearAuthToken();
        setToken(null);
        setCustomer(null);
      },
    }),
    [applySession, status, token, customer],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
