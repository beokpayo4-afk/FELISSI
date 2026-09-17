import { Link } from "react-router-dom";
import { company } from "@/constants/company";
import { isStorefrontProductImage } from "@/lib/catalog";

export function HeroBanner({ image = "" }: { image?: string }) {
  const photo = isStorefrontProductImage(image) ? image : "";
  return (
    <section className="home-hero relative isolate min-h-[min(88vh,52rem)] overflow-hidden bg-forest text-white">
      <div className="absolute inset-0 lg:left-[38%]">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="home-hero-media size-full object-contain bg-forest p-8 lg:object-cover lg:p-0"
          />
        ) : null}
        <div className="absolute inset-0 bg-linear-to-t from-forest via-forest/70 to-forest/25 lg:bg-linear-to-r lg:from-forest lg:from-15% lg:via-forest/50 lg:via-35% lg:to-transparent lg:to-70%" />
      </div>

      <div className="relative mx-auto flex min-h-[min(88vh,52rem)] max-w-6xl items-end px-4 pb-14 pt-24 sm:px-6 sm:pb-16 lg:items-center lg:py-20">
        <div className="home-hero-copy max-w-lg lg:max-w-xl">
          <p className="home-hero-line home-hero-line-1 font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            FELISSI
          </p>
          <p className="home-hero-line home-hero-line-2 mt-2 text-xs font-semibold tracking-[0.22em] text-[#c4a46a] uppercase sm:text-sm">
            Private Limited
          </p>
          <h1 className="home-hero-line home-hero-line-3 mt-5 max-w-md text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[2.5rem] lg:leading-tight">
            Everyday electronics, priced clearly
          </h1>
          <p className="home-hero-line home-hero-line-4 mt-4 max-w-md text-sm leading-7 text-[#d7e4de] sm:text-base">
            Audio, charging, accessories, and storage from {company.legalName} — one original
            catalog with no copied listings.
          </p>
          <div className="home-hero-line home-hero-line-5 mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to="/shop"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white transition-colors duration-200 hover:bg-sky-700"
            >
              Shop the catalog
            </Link>
            <Link
              to="/shop?featured=true"
              className="text-sm font-semibold text-sky-200 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              See featured picks
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
