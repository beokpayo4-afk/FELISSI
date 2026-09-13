import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { AddressDraft } from "@/lib/address";
import type { ApiAddress } from "@/types/auth";

export function listAddresses(): Promise<ApiAddress[]> {
  return apiClient.get<ApiAddress[]>(endpoints.addresses).then((response) => response.data);
}

export function createAddress(payload: AddressDraft & { is_default?: boolean }): Promise<ApiAddress> {
  return apiClient.post<ApiAddress>(endpoints.addresses, payload).then((response) => response.data);
}

export function updateAddress(
  id: string,
  payload: Partial<AddressDraft> & { is_default?: boolean },
): Promise<ApiAddress> {
  return apiClient.patch<ApiAddress>(endpoints.address(id), payload).then((response) => response.data);
}

export function deleteAddress(id: string): Promise<void> {
  return apiClient.delete(endpoints.address(id)).then(() => undefined);
}

export function validateAddressRemote(payload: AddressDraft): Promise<{ valid: boolean }> {
  return apiClient
    .post<{ valid: boolean }>(endpoints.addressValidate, payload)
    .then((response) => response.data);
}
