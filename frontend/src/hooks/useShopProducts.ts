import { useEffect, useState } from "react";
import { listProducts } from "@/api/catalog";
import { getApiErrorMessage } from "@/api/errors";
import { toCatalogProduct } from "@/lib/catalog";
import { shopQueryKey, type ShopQuery } from "@/lib/shopQuery";
import type { CatalogProduct } from "@/types/catalog";

export type ShopProductsState =
  | { status: "loading" }
  | { status: "ready"; products: CatalogProduct[]; count: number }
  | { status: "empty"; count: number }
  | { status: "error"; message: string };

export function useShopProducts(
  query: ShopQuery,
  options?: { enabled?: boolean },
): ShopProductsState & { reload: () => void } {
  const [state, setState] = useState<ShopProductsState>({ status: "loading" });
  const [tick, setTick] = useState(0);
  const enabled = options?.enabled ?? true;
  const key = shopQueryKey(query);

  useEffect(() => {
    if (!enabled) {
      setState({ status: "empty", count: 0 });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });

    listProducts(query, { signal: controller.signal })
      .then((page) => {
        const products = page.results.map(toCatalogProduct);
        setState(
          products.length
            ? { status: "ready", products, count: page.count }
            : { status: "empty", count: 0 },
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({ status: "error", message: getApiErrorMessage(error) });
      });

    return () => controller.abort();
  }, [enabled, key, tick]);

  return { ...state, reload: () => setTick((value) => value + 1) };
}
