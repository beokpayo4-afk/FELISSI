const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export function formatOrderStatus(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function formatPaymentStatus(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function formatPaymentMethod(method: string): string {
  return method === "cod" ? "Cash on delivery" : "Online";
}

export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}
