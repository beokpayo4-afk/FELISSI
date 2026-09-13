import { Mail, MapPin, Phone } from "lucide-react";
import { ContentPage } from "@/components/layout/ContentPage";
import { company } from "@/constants/company";

export function ContactPage() {
  return (
    <ContentPage title="Contact Us">
      <p>{company.legalName}</p>
      <ul className="space-y-4">
        <li className="flex items-start gap-3">
          <MapPin className="mt-1 size-4 shrink-0 text-sky-700" aria-hidden="true" />
          <address className="not-italic">
            {company.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </li>
        <li className="flex items-start gap-3">
          <Mail className="mt-1 size-4 shrink-0 text-sky-700" aria-hidden="true" />
          <a className="text-sky-700 hover:text-sky-800" href={`mailto:${company.email}`}>
            {company.email}
          </a>
        </li>
        <li className="flex items-start gap-3">
          <Phone className="mt-1 size-4 shrink-0 text-sky-700" aria-hidden="true" />
          <a className="text-sky-700 hover:text-sky-800" href={`tel:${company.phoneTel}`}>
            {company.phone}
          </a>
        </li>
      </ul>
      <p>{company.gstinLabel}</p>
    </ContentPage>
  );
}
