import { isCatalogProductId } from "@/lib/productId";

const GUEST_WISHLIST_KEY = "voltcart.guestWishlist";

export function readGuestWishlist(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const valid = [...new Set(parsed.filter(isCatalogProductId))];
    if (valid.length !== parsed.length) {
      writeGuestWishlist(valid);
    }
    return valid;
  } catch {
    return [];
  }
}

export function writeGuestWishlist(ids: string[]): void {
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify([...new Set(ids.filter(isCatalogProductId))]));
}

export function clearGuestWishlist(): void {
  localStorage.removeItem(GUEST_WISHLIST_KEY);
}

export function toggleGuestWishlist(productId: string): string[] {
  if (!isCatalogProductId(productId)) {
    return readGuestWishlist();
  }
  const current = readGuestWishlist();
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  writeGuestWishlist(next);
  return next;
}
