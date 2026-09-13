import { useEffect, useState } from "react";
import { listBrands, listCategories, listSubcategories } from "@/api/catalog";
import type { ApiNamedSlug } from "@/types/catalog";

export function useCatalogFacets(categorySlug?: string) {
  const [categories, setCategories] = useState<ApiNamedSlug[]>([]);
  const [brands, setBrands] = useState<ApiNamedSlug[]>([]);
  const [subcategories, setSubcategories] = useState<ApiNamedSlug[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listCategories({ signal: controller.signal }),
      listBrands({ signal: controller.signal }),
    ])
      .then(([nextCategories, nextBrands]) => {
        setCategories(nextCategories);
        setBrands(nextBrands);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCategories([]);
          setBrands([]);
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!categorySlug) {
      setSubcategories([]);
      return;
    }
    const controller = new AbortController();
    listSubcategories(categorySlug, { signal: controller.signal })
      .then(setSubcategories)
      .catch(() => {
        if (!controller.signal.aborted) {
          setSubcategories([]);
        }
      });
    return () => controller.abort();
  }, [categorySlug]);

  return { categories, brands, subcategories };
}
