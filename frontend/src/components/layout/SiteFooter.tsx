import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { company } from "@/constants/company";
import { categoryNav, companyNav, helpNav, shopNav, storeContact } from "@/constants/navigation";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-white print:hidden">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo className="[&_img]:h-24" />
          <p className="max-w-xs text-sm leading-6 text-muted">
            {company.legalName} — audio, charging, accessories, and storage.
          </p>
          <address className="max-w-xs text-sm leading-6 text-muted not-italic">
            {company.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </div>
        <FooterColumn title="Shop" items={shopNav} />
        <FooterColumn title="Categories" items={categoryNav} />
        <div>
          <FooterColumn title="Company" items={companyNav} />
          <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">Help</h2>
          <ul className="space-y-2 text-sm">
            {helpNav.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="text-muted hover:text-sky-700">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-5 space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <a className="hover:text-sky-700" href={`tel:${storeContact.phoneTel}`}>
                {storeContact.phone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <a className="hover:text-sky-700" href={`mailto:${storeContact.email}`}>
                {storeContact.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {storeContact.address}
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {company.legalName}. All rights reserved.
          </p>
          <p>Electronics only. No clothing or groceries.</p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; to: string }>;
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="text-muted hover:text-sky-700">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
