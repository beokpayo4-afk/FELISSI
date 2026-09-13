import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Paginated } from "@/types/api";
import type {
  StaffDashboard,
  StaffOptions,
  StaffOrder,
  StaffProduct,
  StaffProductImage,
  StaffProductPayload,
  StaffProductQuery,
} from "@/types/staff";

export async function fetchStaffDashboard(): Promise<StaffDashboard> {
  const { data } = await apiClient.get<StaffDashboard>(endpoints.staffDashboard);
  return data;
}

export async function fetchStaffOptions(): Promise<StaffOptions> {
  const { data } = await apiClient.get<StaffOptions>(endpoints.staffOptions);
  return data;
}

export async function listStaffProducts(query: StaffProductQuery = {}): Promise<Paginated<StaffProduct>> {
  const { data } = await apiClient.get<Paginated<StaffProduct>>(endpoints.staffProducts, {
    params: {
      page: query.page ?? 1,
      page_size: 20,
      search: query.search || undefined,
      category: query.category || undefined,
      brand: query.brand || undefined,
      is_published: query.is_published || undefined,
      stock: query.stock || undefined,
      is_featured: query.is_featured || undefined,
      is_best_seller: query.is_best_seller || undefined,
      ordering: query.ordering || "-created_at",
    },
  });
  return data;
}

export async function fetchStaffProduct(id: string): Promise<StaffProduct> {
  const { data } = await apiClient.get<StaffProduct>(endpoints.staffProduct(id));
  return data;
}

export async function deleteStaffProduct(id: string): Promise<void> {
  await apiClient.delete(endpoints.staffProduct(id));
}

export async function createStaffProduct(payload: StaffProductPayload): Promise<StaffProduct> {
  const { data } = await apiClient.post<StaffProduct>(endpoints.staffProducts, payload);
  return data;
}

export async function patchStaffProduct(
  id: string,
  payload: Partial<StaffProductPayload>,
): Promise<StaffProduct> {
  const { data } = await apiClient.patch<StaffProduct>(endpoints.staffProduct(id), payload);
  return data;
}

export async function listStaffProductImages(productId: string): Promise<StaffProductImage[]> {
  const { data } = await apiClient.get<StaffProductImage[]>(endpoints.staffProductImages(productId));
  return data;
}

export async function uploadStaffProductImage(
  productId: string,
  file: File,
  options: { altText?: string; isPrimary?: boolean } = {},
): Promise<StaffProductImage> {
  const body = new FormData();
  body.append("file", file);
  if (options.altText) {
    body.append("alt_text", options.altText);
  }
  if (options.isPrimary) {
    body.append("is_primary", "true");
  }
  const { data } = await apiClient.post<StaffProductImage>(endpoints.staffProductImages(productId), body, {
    timeout: 60_000,
  });
  return data;
}

export async function addStaffProductImageUrl(
  productId: string,
  url: string,
  options: { altText?: string; isPrimary?: boolean } = {},
): Promise<StaffProductImage> {
  const { data } = await apiClient.post<StaffProductImage>(endpoints.staffProductImages(productId), {
    url,
    alt_text: options.altText,
    is_primary: options.isPrimary ?? false,
  });
  return data;
}

export async function patchStaffProductImage(
  productId: string,
  imageId: number,
  payload: { is_primary?: boolean; alt_text?: string; sort_order?: number },
): Promise<StaffProductImage> {
  const { data } = await apiClient.patch<StaffProductImage>(
    endpoints.staffProductImage(productId, imageId),
    payload,
  );
  return data;
}

export async function deleteStaffProductImage(productId: string, imageId: number): Promise<void> {
  await apiClient.delete(endpoints.staffProductImage(productId, imageId));
}

export interface StaffStoreSettings {
  gst_inclusive_pricing: boolean;
}

export async function fetchStaffSettings(): Promise<StaffStoreSettings> {
  const { data } = await apiClient.get<StaffStoreSettings>(endpoints.staffSettings);
  return data;
}

export async function patchStaffSettings(payload: StaffStoreSettings): Promise<StaffStoreSettings> {
  const { data } = await apiClient.patch<StaffStoreSettings>(endpoints.staffSettings, payload);
  return data;
}

export async function listStaffOrders(page = 1, search = ""): Promise<Paginated<StaffOrder>> {
  const { data } = await apiClient.get<Paginated<StaffOrder>>(endpoints.staffOrders, {
    params: { page, search: search || undefined, ordering: "-created_at" },
  });
  return data;
}

export async function patchStaffOrder(
  orderNumber: string,
  payload: { order_status?: string; payment_status?: string },
): Promise<StaffOrder> {
  const { data } = await apiClient.patch<StaffOrder>(endpoints.staffOrder(orderNumber), payload);
  return data;
}
