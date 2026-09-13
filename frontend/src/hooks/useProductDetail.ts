import { useEffect, useState } from "react";
import { getProduct, listProductReviews, listProducts } from "@/api/catalog";
import { getApiErrorMessage, isNotFoundError } from "@/api/errors";
import { toCatalogProduct } from "@/lib/catalog";
import type { ApiProductDetail, ApiReview } from "@/types/catalog";
import type { CatalogProduct } from "@/types/catalog";

export type ProductDetailState =
  | { status: "loading" }
  | {
      status: "ready";
      product: ApiProductDetail;
      reviews: ApiReview[];
      related: CatalogProduct[];
    }
  | { status: "not_found" }
  | { status: "error"; message: string };

export function useProductDetail(slug: string | undefined): ProductDetailState & { reload: () => void } {
  const [state, setState] = useState<ProductDetailState>({ status: "loading" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!slug) {
      setState({ status: "not_found" });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    getProduct(slug, { signal: controller.signal })
      .then(async (product) => {
        const [reviewsPage, relatedPage] = await Promise.all([
          listProductReviews(slug, { signal: controller.signal }).catch(() => ({
            count: 0,
            next: null,
            previous: null,
            results: [] as ApiReview[],
          })),
          listProducts(
            { category: product.category.slug },
            { signal: controller.signal, pageSize: 8 },
          ).catch(() => ({
            count: 0,
            next: null,
            previous: null,
            results: [],
          })),
        ]);

        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: "ready",
          product,
          reviews: reviewsPage.results,
          related: relatedPage.results
            .filter((item) => item.slug !== product.slug)
            .slice(0, 4)
            .map(toCatalogProduct),
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState(isNotFoundError(error) ? { status: "not_found" } : { status: "error", message: getApiErrorMessage(error) });
      });

    return () => controller.abort();
  }, [slug, tick]);

  return { ...state, reload: () => setTick((value) => value + 1) };
}
