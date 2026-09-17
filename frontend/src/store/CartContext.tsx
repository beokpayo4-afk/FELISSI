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
import { addCartItem, fetchCart, quoteCart, removeCartItem, updateCartItem } from "@/api/cart";
import { getApiErrorMessage } from "@/api/errors";
import { storefrontProductImage, toNumber } from "@/lib/catalog";
import { isCatalogProductId } from "@/lib/productId";
import { useAuth } from "@/store/AuthContext";
import {
  clearGuestCart,
  readGuestCart,
  readStoredCoupon,
  removeGuestCartItem,
  setGuestCartQuantity,
  upsertGuestCartItem,
  writeGuestCart,
  writeStoredCoupon,
} from "@/store/guestCart";
import type { ApiCartItem, ApiCartQuote, CartLine, CartTotals, QuoteItemInput } from "@/types/cart";

const emptyTotals: CartTotals = {
  itemCount: 0,
  subtotal: 0,
  discount: 0,
  gst: 0,
  gstInclusive: false,
  shipping: 0,
  total: 0,
};

function mapLine(item: ApiCartItem): CartLine {
  const productId = item.product.id;
  const variantId = item.variant_id;
  return {
    key: item.id != null ? `item:${item.id}` : `guest:${productId}:${variantId ?? ""}`,
    cartItemId: item.id,
    productId,
    variantId,
    variantName: item.variant_name,
    name: item.variant_name ? `${item.product.name} — ${item.variant_name}` : item.product.name,
    slug: item.product.slug,
    image: storefrontProductImage(item.product.primary_image?.url),
    imageAlt: item.product.primary_image?.alt_text || item.product.name,
    quantity: item.quantity,
    unitPrice: toNumber(item.unit_price),
    lineTotal: toNumber(item.line_total),
    stockQuantity: item.product.stock_quantity,
  };
}

function mapTotals(quote: ApiCartQuote): CartTotals {
  return {
    itemCount: quote.item_count,
    subtotal: toNumber(quote.subtotal),
    discount: toNumber(quote.discount),
    gst: toNumber(quote.gst),
    gstInclusive: Boolean(quote.gst_inclusive),
    shipping: toNumber(quote.shipping_charge),
    total: toNumber(quote.total),
  };
}

function guestInputs(): QuoteItemInput[] {
  return readGuestCart().map((line) => ({
    product_id: line.productId,
    quantity: line.quantity,
    variant_id: line.variantId ?? null,
  }));
}

interface CartState {
  status: "loading" | "ready" | "error";
  items: CartLine[];
  totals: CartTotals;
  couponCode: string;
  couponError: string | null;
  actionError: string | null;
  busy: boolean;
  addItem: (productId: string, quantity?: number, variantId?: number | null) => Promise<void>;
  setQuantity: (key: string, quantity: number) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  clearCoupon: () => Promise<void>;
  reload: () => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<CartState["status"]>("loading");
  const [items, setItems] = useState<CartLine[]>([]);
  const [totals, setTotals] = useState<CartTotals>(emptyTotals);
  const [couponCode, setCouponCode] = useState(() => readStoredCoupon());
  const [couponError, setCouponError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mergedRef = useRef(false);
  const itemsRef = useRef<CartLine[]>([]);
  itemsRef.current = items;

  const applyQuote = useCallback((quote: ApiCartQuote) => {
    const nextItems = quote.items.map(mapLine);
    setItems(nextItems);
    setTotals(mapTotals(quote));
    setCouponError(quote.coupon_error);
    if (quote.coupon_code) {
      setCouponCode(quote.coupon_code);
      writeStoredCoupon(quote.coupon_code);
    }
    if (!isAuthenticated) {
      writeGuestCart(
        nextItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId,
        })),
      );
    }
  }, [isAuthenticated]);

  const reload = useCallback(async () => {
    const coupon = readStoredCoupon();
    if (isAuthenticated) {
      applyQuote(await fetchCart(coupon || undefined));
      return;
    }
    const guest = guestInputs();
    if (!guest.length) {
      applyQuote({
        items: [],
        item_count: 0,
        subtotal: "0.00",
        discount: "0.00",
        gst: "0.00",
        gst_inclusive: false,
        taxable_subtotal: "0.00",
        shipping_charge: "0.00",
        total: "0.00",
        coupon_code: null,
        coupon_error: null,
      });
      return;
    }
    applyQuote(await quoteCart(guest, coupon || undefined));
  }, [applyQuote, isAuthenticated]);

  useEffect(() => {
    if (authStatus !== "ready") {
      return;
    }

    let cancelled = false;

    async function sync() {
      setStatus("loading");
      setActionError(null);
      try {
        if (isAuthenticated && !mergedRef.current) {
          mergedRef.current = true;
          const guest = guestInputs();
          for (const line of guest) {
            try {
              await addCartItem(line);
            } catch {
              // Keep remaining guest lines if a single merge fails.
            }
          }
          clearGuestCart();
        }
        if (!isAuthenticated) {
          mergedRef.current = false;
        }
        if (!cancelled) {
          await reload();
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setActionError(getApiErrorMessage(error));
          setStatus("error");
        }
      }
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [authStatus, isAuthenticated, reload]);

  const run = useCallback(
    async (task: () => Promise<void>) => {
      setBusy(true);
      setActionError(null);
      try {
        await task();
        await reload();
        setStatus("ready");
      } catch (error) {
        setActionError(getApiErrorMessage(error));
        throw error;
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  const value = useMemo<CartState>(
    () => ({
      status,
      items,
      totals,
      couponCode,
      couponError,
      actionError,
      busy,
      reload,
      addItem: async (productId, quantity = 1, variantId = null) => {
        if (!isCatalogProductId(productId)) {
          const message =
            "This product cannot be added to the cart. Open it from the shop and try again.";
          setActionError(message);
          throw new Error(message);
        }

        setBusy(true);
        setActionError(null);
        try {
          const qty = Math.max(1, quantity);
          if (isAuthenticated) {
            // Apply the POST response directly so the header count updates without a second round-trip.
            applyQuote(await addCartItem(
              { product_id: productId, quantity: qty, variant_id: variantId },
              couponCode || undefined,
            ));
            setStatus("ready");
            return;
          }
          upsertGuestCartItem(productId, qty, variantId);
          await reload();
          setStatus("ready");
        } catch (error) {
          const message = getApiErrorMessage(error);
          setActionError(message);
          throw new Error(message);
        } finally {
          setBusy(false);
        }
      },
      setQuantity: async (key, quantity) => {
        const line = itemsRef.current.find((item) => item.key === key);
        if (!line) {
          return;
        }
        await run(async () => {
          const qty = Math.max(1, Math.min(quantity, line.stockQuantity || quantity));
          if (isAuthenticated && line.cartItemId != null) {
            await updateCartItem(line.cartItemId, qty, couponCode || undefined);
            return;
          }
          setGuestCartQuantity(line.productId, qty, line.variantId);
        });
      },
      removeItem: async (key) => {
        const line = itemsRef.current.find((item) => item.key === key);
        if (!line) {
          return;
        }
        await run(async () => {
          if (isAuthenticated && line.cartItemId != null) {
            await removeCartItem(line.cartItemId);
            return;
          }
          removeGuestCartItem(line.productId, line.variantId);
        });
      },
      applyCoupon: async (code) => {
        const normalized = code.trim().toUpperCase();
        writeStoredCoupon(normalized);
        setCouponCode(normalized);
        await run(async () => undefined);
      },
      clearCoupon: async () => {
        writeStoredCoupon("");
        setCouponCode("");
        setCouponError(null);
        await run(async () => undefined);
      },
    }),
    [
      actionError,
      applyQuote,
      busy,
      couponCode,
      couponError,
      isAuthenticated,
      items,
      reload,
      run,
      status,
      totals,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
