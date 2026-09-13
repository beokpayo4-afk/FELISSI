import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Paginated } from "@/types/api";
import type { ApiOrder, CreateOrderPayload, PaymentConfig } from "@/types/order";

export function createOrder(payload: CreateOrderPayload): Promise<ApiOrder> {
  return apiClient
    .post<ApiOrder>(endpoints.orders, payload, {
      headers: { "Idempotency-Key": payload.client_request_id },
    })
    .then((response) => response.data);
}

export function listOrders(page = 1): Promise<Paginated<ApiOrder>> {
  return apiClient
    .get<Paginated<ApiOrder>>(endpoints.orders, { params: { page } })
    .then((response) => response.data);
}

export function fetchOrder(orderNumber: string): Promise<ApiOrder> {
  return apiClient.get<ApiOrder>(endpoints.orderDetail(orderNumber)).then((response) => response.data);
}

export function fetchPaymentConfig(): Promise<PaymentConfig> {
  return apiClient.get<PaymentConfig>(endpoints.paymentConfig).then((response) => response.data);
}
