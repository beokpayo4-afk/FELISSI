import { apiClient } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { HealthResponse } from "@/types/api";

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>(endpoints.health);
  return data;
}
