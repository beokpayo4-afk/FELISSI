import { useEffect, useState } from "react";
import { getHealth } from "@/api/health";
import type { HealthResponse } from "@/types/api";

export type HealthState =
  | { status: "loading" }
  | { status: "ready"; data: HealthResponse }
  | { status: "error"; message: string };

export function useHealth(): HealthState {
  const [state, setState] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "ready", data });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Unable to reach the API";
        setState({ status: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
