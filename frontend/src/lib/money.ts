export function formatInr(amount: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatInrMoney(amount: number): string {
  return formatInr(amount, 2);
}

export function discountPercent(price: number, salePrice?: number): number | null {
  if (!salePrice || salePrice >= price) {
    return null;
  }
  return Math.round(((price - salePrice) / price) * 100);
}
