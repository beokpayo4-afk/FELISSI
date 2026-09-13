import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { addWishlistItem, fetchWishlist, removeWishlistItem } from "@/api/wishlist";
import { toCatalogProduct } from "@/lib/catalog";
import { useAuth } from "@/store/AuthContext";
import { clearGuestWishlist, readGuestWishlist, toggleGuestWishlist } from "@/store/guestWishlist";
import type { CatalogProduct } from "@/types/catalog";

interface ShopState {
  wishlistIds: string[];
  wishlistItems: CatalogProduct[];
  wishlistCount: number;
  wishlistReady: boolean;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => Promise<void>;
}

const ShopContext = createContext<ShopState | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, status: authStatus } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<CatalogProduct[]>([]);
  const [wishlistReady, setWishlistReady] = useState(false);
  const mergedRef = useRef(false);

  const loadRemote = useCallback(async () => {
    const remote = await fetchWishlist();
    setWishlistItems(remote.map((item) => toCatalogProduct(item.product)));
    setWishlistIds(remote.map((item) => item.product.id));
  }, []);

  useEffect(() => {
    if (authStatus !== "ready") {
      return;
    }

    let cancelled = false;

    if (!isAuthenticated) {
      mergedRef.current = false;
      setWishlistItems([]);
      setWishlistIds(readGuestWishlist());
      setWishlistReady(true);
      return;
    }

    setWishlistReady(false);
    void (async () => {
      const guestIds = readGuestWishlist();
      if (guestIds.length && !mergedRef.current) {
        mergedRef.current = true;
        await Promise.all(guestIds.map((id) => addWishlistItem(id).catch(() => undefined)));
        clearGuestWishlist();
      }
      if (cancelled) {
        return;
      }
      try {
        await loadRemote();
      } catch {
        if (!cancelled) {
          setWishlistItems([]);
          setWishlistIds([]);
        }
      } finally {
        if (!cancelled) {
          setWishlistReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, isAuthenticated, loadRemote]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      const wished = wishlistIds.includes(productId);
      setWishlistIds((current) =>
        wished ? current.filter((id) => id !== productId) : [...current, productId],
      );
      setWishlistItems((current) => (wished ? current.filter((item) => item.id !== productId) : current));

      if (!isAuthenticated) {
        toggleGuestWishlist(productId);
        return;
      }

      void (async () => {
        try {
          if (wished) {
            await removeWishlistItem(productId);
          } else {
            await addWishlistItem(productId);
          }
          await loadRemote();
        } catch {
          setWishlistIds((current) =>
            wished ? [...current, productId] : current.filter((id) => id !== productId),
          );
        }
      })();
    },
    [isAuthenticated, loadRemote, wishlistIds],
  );

  const removeFromWishlist = useCallback(
    async (productId: string) => {
      setWishlistIds((current) => current.filter((id) => id !== productId));
      setWishlistItems((current) => current.filter((item) => item.id !== productId));
      if (!isAuthenticated) {
        toggleGuestWishlist(productId);
        return;
      }
      await removeWishlistItem(productId);
    },
    [isAuthenticated],
  );

  const value = useMemo<ShopState>(
    () => ({
      wishlistIds,
      wishlistItems,
      wishlistCount: wishlistIds.length,
      wishlistReady,
      toggleWishlist,
      removeFromWishlist,
    }),
    [removeFromWishlist, toggleWishlist, wishlistIds, wishlistItems, wishlistReady],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopState {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used inside ShopProvider");
  }
  return context;
}
