import { isCatalogProductId } from "@/lib/productId";

export type GuestCartLine = {
  productId: string;
  quantity: number;
  variantId?: number | null;
};

const GUEST_CART_KEY = "voltcart.guestCart";
const COUPON_KEY = "voltcart.couponCode";

function lineKey(line: GuestCartLine): string {
  return `${line.productId}:${line.variantId ?? ""}`;
}

export function readGuestCart(): GuestCartLine[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as GuestCartLine[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    const valid = parsed.filter(
      (line) => line?.productId && isCatalogProductId(line.productId) && line.quantity > 0,
    );
    if (valid.length !== parsed.length) {
      writeGuestCart(valid);
    }
    return valid;
  } catch {
    return [];
  }
}

export function writeGuestCart(items: GuestCartLine[]): void {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function clearGuestCart(): void {
  localStorage.removeItem(GUEST_CART_KEY);
}

export function upsertGuestCartItem(
  productId: string,
  quantity: number,
  variantId?: number | null,
): GuestCartLine[] {
  if (!isCatalogProductId(productId)) {
    throw new Error("This product cannot be added to the cart. Open it from the shop and try again.");
  }
  const add = Math.max(1, quantity);
  const next = [...readGuestCart()];
  const incoming: GuestCartLine = { productId, quantity: add, variantId: variantId ?? null };
  const index = next.findIndex((line) => lineKey(line) === lineKey(incoming));
  if (index >= 0) {
    next[index] = { ...next[index], quantity: next[index].quantity + add };
  } else {
    next.push(incoming);
  }
  writeGuestCart(next);
  return next;
}

export function setGuestCartQuantity(
  productId: string,
  quantity: number,
  variantId?: number | null,
): GuestCartLine[] {
  const key = lineKey({ productId, quantity, variantId });
  const next = readGuestCart()
    .map((line) => (lineKey(line) === key ? { ...line, quantity: Math.max(1, quantity) } : line))
    .filter((line) => line.quantity > 0);
  writeGuestCart(next);
  return next;
}

export function removeGuestCartItem(productId: string, variantId?: number | null): GuestCartLine[] {
  const key = lineKey({ productId, quantity: 1, variantId });
  const next = readGuestCart().filter((line) => lineKey(line) !== key);
  writeGuestCart(next);
  return next;
}

export function readStoredCoupon(): string {
  try {
    return localStorage.getItem(COUPON_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeStoredCoupon(code: string): void {
  const normalized = code.trim().toUpperCase();
  if (normalized) {
    localStorage.setItem(COUPON_KEY, normalized);
  } else {
    localStorage.removeItem(COUPON_KEY);
  }
}
