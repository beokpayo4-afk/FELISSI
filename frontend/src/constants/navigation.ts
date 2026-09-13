import { company } from "@/constants/company";

export interface NavItem {
  label: string;
  to: string;
}

export const categoryNav: NavItem[] = [
  { label: "Audio", to: "/shop?category=audio" },
  { label: "Charging", to: "/shop?category=charging" },
  { label: "Accessories", to: "/shop?category=accessories" },
  { label: "Storage", to: "/shop?category=storage" },
];

export const shopNav: NavItem[] = [
  { label: "All electronics", to: "/shop" },
  { label: "Featured", to: "/shop?featured=true" },
  { label: "Best sellers", to: "/shop?best_seller=true" },
  { label: "Latest arrivals", to: "/shop?ordering=-created_at" },
];

export const helpNav: NavItem[] = [
  { label: "Account", to: "/account" },
  { label: "Orders", to: "/account/orders" },
  { label: "Wishlist", to: "/account/wishlist" },
  { label: "Cart", to: "/cart" },
];

export const companyNav: NavItem[] = [
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Refund & Cancellation Policy", to: "/refund" },
  { label: "Shipping & Delivery Policy", to: "/shipping" },
];

export const storeContact = {
  email: company.email,
  phone: company.phone,
  phoneTel: company.phoneTel,
  hours: "Support 9:00 AM – 9:00 PM IST",
  address: company.address,
} as const;
