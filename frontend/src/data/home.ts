import type { CatalogCategory } from "@/types/catalog";

function catalogImage(slug: string): string {
  return `/catalog/${slug}.jpg`;
}

export const featuredCategories: CatalogCategory[] = [
  {
    id: "audio",
    name: "Audio",
    to: "/shop?category=audio",
    image: catalogImage("nimbus-air-buds"),
    description: "Earbuds, headphones, and speakers",
  },
  {
    id: "charging",
    name: "Charging",
    to: "/shop?category=charging",
    image: catalogImage("voltpack-10k"),
    description: "Adapters, cables, and power banks",
  },
  {
    id: "accessories",
    name: "Accessories",
    to: "/shop?category=accessories",
    image: catalogImage("portlink-7"),
    description: "Hubs, stands, and everyday add-ons",
  },
  {
    id: "storage",
    name: "Storage",
    to: "/shop?category=storage",
    image: catalogImage("fluxdrive-512"),
    description: "Drives and memory for every setup",
  },
];
