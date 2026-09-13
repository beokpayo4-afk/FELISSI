import { Link } from "react-router-dom";
import { ContentPage } from "@/components/layout/ContentPage";
import { company } from "@/constants/company";
import { env } from "@/lib/env";

const policies = {
  privacy: {
    title: "Privacy Policy",
    body: (
      <>
        <p>
          {company.legalName} operates this {env.appName} storefront. When you
          create an account, place an order, or write to us, we use the contact
          and order details you submit to fulfill that request.
        </p>
        <p>
          For privacy questions, email{" "}
          <a className="text-sky-700 hover:text-sky-800" href={`mailto:${company.email}`}>
            {company.email}
          </a>{" "}
          or write to {company.address}.
        </p>
        <p>{company.gstinLabel}</p>
      </>
    ),
  },
  terms: {
    title: "Terms & Conditions",
    body: (
      <>
        <p>
          This storefront is operated by {company.legalName}, registered at{" "}
          {company.address}. Use of the shop, cart, and account features is
          subject to the product details, prices, and policies shown on the
          site at the time of purchase.
        </p>
        <p>
          Questions about these terms can be sent to{" "}
          <a className="text-sky-700 hover:text-sky-800" href={`mailto:${company.email}`}>
            {company.email}
          </a>{" "}
          or {company.phone}.
        </p>
        <p>{company.gstinLabel}</p>
      </>
    ),
  },
  refund: {
    title: "Refund & Cancellation Policy",
    body: (
      <>
        <p>
          Unused items may be returned within 7 days with a pickup request, as
          already stated on this storefront. Refunds and cancellations are
          handled by {company.legalName}.
        </p>
        <p>
          Write to{" "}
          <a className="text-sky-700 hover:text-sky-800" href={`mailto:${company.email}`}>
            {company.email}
          </a>{" "}
          or call{" "}
          <a className="text-sky-700 hover:text-sky-800" href={`tel:${company.phoneTel}`}>
            {company.phone}
          </a>
          .
        </p>
      </>
    ),
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    body: (
      <>
        <p>
          Standard delivery is offered across major Indian cities. This
          storefront already states that shipping is free on orders over ₹499.
        </p>
        <p>
          Delivery questions can be sent to {company.legalName} at{" "}
          <a className="text-sky-700 hover:text-sky-800" href={`mailto:${company.email}`}>
            {company.email}
          </a>{" "}
          or{" "}
          <a className="text-sky-700 hover:text-sky-800" href={`tel:${company.phoneTel}`}>
            {company.phone}
          </a>
          .
        </p>
      </>
    ),
  },
} as const;

export function PolicyPage({ slug }: { slug: keyof typeof policies }) {
  const policy = policies[slug];

  return (
    <ContentPage title={policy.title}>
      {policy.body}
      <p>
        <Link to="/contact" className="font-medium text-sky-700 hover:text-sky-800">
          Contact Us
        </Link>
      </p>
    </ContentPage>
  );
}
