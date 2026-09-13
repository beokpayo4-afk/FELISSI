import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type {
  ApiCustomer,
  AuthPayload,
  ChangePasswordPayload,
  LoginPayload,
  PasswordResetConfirmPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from "@/types/auth";

export function registerCustomer(payload: RegisterPayload): Promise<AuthPayload> {
  return apiClient.post<AuthPayload>(endpoints.register, payload).then((response) => response.data);
}

export function loginCustomer(payload: LoginPayload): Promise<AuthPayload> {
  return apiClient.post<AuthPayload>(endpoints.login, payload).then((response) => response.data);
}

export function logoutCustomer(): Promise<void> {
  return apiClient.post(endpoints.logout).then(() => undefined);
}

export function fetchMe(): Promise<ApiCustomer> {
  return apiClient.get<ApiCustomer>(endpoints.me).then((response) => response.data);
}

export function updateProfile(payload: UpdateProfilePayload): Promise<ApiCustomer> {
  return apiClient.patch<ApiCustomer>(endpoints.me, payload).then((response) => response.data);
}

export function changePassword(payload: ChangePasswordPayload): Promise<AuthPayload> {
  return apiClient
    .post<AuthPayload>(endpoints.changePassword, payload)
    .then((response) => response.data);
}

export function requestPasswordReset(email: string): Promise<{ detail: string }> {
  return apiClient
    .post<{ detail: string }>(endpoints.passwordReset, { email })
    .then((response) => response.data);
}

export function confirmPasswordReset(
  payload: PasswordResetConfirmPayload,
): Promise<{ detail: string }> {
  return apiClient
    .post<{ detail: string }>(endpoints.passwordResetConfirm, payload)
    .then((response) => response.data);
}
