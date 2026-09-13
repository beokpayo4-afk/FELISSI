import { BadgeCheck, Headset, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  {
    icon: BadgeCheck,
    title: "Checked listings",
    copy: "Every SKU is reviewed for specs, stock, and GST-ready invoices.",
  },
  {
    icon: ShieldCheck,
    title: "Brand warranty",
    copy: "Manufacturer cover stays on the box — we do not void support.",
  },
  {
    icon: Truck,
    title: "Free shipping over ₹499",
    copy: "Standard delivery across major Indian cities.",
  },
  {
    icon: Headset,
    title: "Human support",
    copy: "Talk to FELISSI from 9 AM to 9 PM IST, all week.",
  },
];

export function BenefitsSection() {
  return (
    <section>
      <p className="page-kicker">Why FELISSI</p>
      <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Built like a store you can trust
      </h2>
      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title}>
              <Icon className="size-5 text-sky-700" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.copy}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
