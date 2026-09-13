import { useEffect } from "react";
import { Link } from "react-router-dom";

export function AdminStorefrontPage() {
  useEffect(() => {
    document.title = "Storefront · FELISSI admin";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Storefront</h1>
      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <p className="text-slate-600">
          Review the public shop, then come back here to publish products and update orders.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-full bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"
          >
            View shop
          </Link>
          <Link
            to="/admin/products"
            className="inline-flex h-10 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-800"
          >
            Manage products
          </Link>
        </div>
      </section>
    </div>
  );
}
