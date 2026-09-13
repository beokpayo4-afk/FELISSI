import { isAxiosError } from "axios";

export function isNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

function firstFieldMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string" && record.detail.trim()) {
    return record.detail;
  }
  if (typeof record.non_field_errors === "string") {
    return record.non_field_errors;
  }
  if (Array.isArray(record.non_field_errors) && record.non_field_errors[0]) {
    return String(record.non_field_errors[0]);
  }
  for (const value of Object.values(record)) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (Array.isArray(value) && value[0]) {
      return String(value[0]);
    }
  }
  return null;
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError(error) || !error.response?.data || typeof error.response.data !== "object") {
    return {};
  }
  const data = error.response.data as Record<string, unknown>;
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "detail" || key === "non_field_errors") {
      continue;
    }
    if (typeof value === "string" && value.trim()) {
      fields[key] = value;
    } else if (Array.isArray(value) && value[0]) {
      fields[key] = String(value[0]);
    }
  }
  return fields;
}

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const fieldMessage = firstFieldMessage(error.response?.data);
    if (fieldMessage) {
      if (/customer account is required/i.test(fieldMessage)) {
        return "Sign in with a customer account to use the cart.";
      }
      return fieldMessage;
    }
    if (error.code === "ERR_CANCELED") {
      return "Request canceled";
    }
    if (error.code === "ERR_NETWORK") {
      return "Unable to reach the FELISSI API. Confirm the backend is running.";
    }
    if (error.response?.status === 401) {
      return "Please sign in again, then add this item to your cart.";
    }
    if (error.response?.status === 403) {
      return "Sign in with a customer account to use the cart.";
    }
    return error.message || "The request failed.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}
