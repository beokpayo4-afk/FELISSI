import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/api/errors";
import { fetchStaffSettings, patchStaffSettings } from "@/api/staff";
import { env } from "@/lib/env";

export function AdminSettingsPage() {
  const [inclusive, setInclusive] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.title = "Settings · FELISSI admin";
    fetchStaffSettings()
      .then((settings) => {
        setInclusive(settings.gst_inclusive_pricing);
        setError(null);
      })
      .catch((err) => setError(getApiErrorMessage(err)));
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  async function saveMode(next: boolean) {
    setPending(true);
    setSaved(false);
    setError(null);
    try {
      const settings = await patchStaffSettings({ gst_inclusive_pricing: next });
      setInclusive(settings.gst_inclusive_pricing);
      setSaved(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Settings</h1>
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
      {saved ? <p className="text-sm text-emerald-700">GST pricing mode saved. New quotes use this setting.</p> : null}

      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">GST pricing</h2>
        <p className="mt-1 text-sm text-slate-600">
          Each product still has its own GST rate. This setting only decides whether catalog prices
          already include that GST.
        </p>
        <div className="mt-4 space-y-3 text-sm">
          <label
            htmlFor="gst_mode_exclusive"
            className="flex items-start gap-3 rounded-xl border border-slate-200 p-3"
          >
            <input
              id="gst_mode_exclusive"
              type="radio"
              name="gst_mode"
              value="exclusive"
              checked={!inclusive}
              disabled={pending}
              onChange={() => void saveMode(false)}
            />
            <span>
              <strong className="block text-slate-950">GST exclusive</strong>
              Product price + GST − Discount + Shipping = final amount. GST is added at checkout.
            </span>
          </label>
          <label
            htmlFor="gst_mode_inclusive"
            className="flex items-start gap-3 rounded-xl border border-slate-200 p-3"
          >
            <input
              id="gst_mode_inclusive"
              type="radio"
              name="gst_mode"
              value="inclusive"
              checked={inclusive}
              disabled={pending}
              onChange={() => void saveMode(true)}
            />
            <span>
              <strong className="block text-slate-950">GST inclusive</strong>
              Catalog prices already include GST. Discount and shipping apply to that price; GST is
              shown but not added again.
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Store operations</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Timezone</dt>
            <dd className="font-medium">Asia/Kolkata</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Currency</dt>
            <dd className="font-medium">INR</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Legal entity</dt>
            <dd className="font-medium">FELISSI PRIVATE LIMITED</dd>
          </div>
        </dl>
        <a
          href={env.adminUrl}
          className="mt-6 inline-flex h-10 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-800"
        >
          Open Django admin
        </a>
      </section>
    </div>
  );
}
