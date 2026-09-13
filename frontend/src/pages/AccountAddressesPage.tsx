import { useEffect, useState, type FormEvent } from "react";
import { createAddress, deleteAddress, listAddresses, updateAddress } from "@/api/addresses";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/errors";
import { AddressForm } from "@/components/account/AddressForm";
import { ShopErrorState } from "@/components/shop/ShopErrorState";
import {
  emptyAddress,
  fromSavedAddress,
  validateAddress,
  type AddressDraft,
  type AddressFieldErrors,
} from "@/lib/address";
import { useAuth } from "@/store/AuthContext";
import type { ApiAddress } from "@/types/auth";

export function AccountAddressesPage() {
  const { customer, refreshCustomer } = useAuth();
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AddressFieldErrors>({});
  const [draft, setDraft] = useState<AddressDraft>(() => emptyAddress(customer));
  const [isDefault, setIsDefault] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = "Addresses · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  function load() {
    setStatus("loading");
    setError(null);
    listAddresses()
      .then((items) => {
        setAddresses(items);
        setStatus("ready");
      })
      .catch((err) => {
        setError(getApiErrorMessage(err));
        setStatus("error");
      });
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setDraft(emptyAddress(customer));
    setIsDefault(false);
    setEditingId(null);
    setFieldErrors({});
    setFormError(null);
  }

  function startEdit(address: ApiAddress) {
    setEditingId(address.id);
    setDraft(fromSavedAddress(address));
    setIsDefault(address.is_default);
    setFieldErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const localErrors = validateAddress(draft);
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors);
      return;
    }
    setPending(true);
    setFormError(null);
    setFieldErrors({});
    try {
      if (editingId) {
        await updateAddress(editingId, { ...draft, is_default: isDefault });
      } else {
        await createAddress({ ...draft, is_default: isDefault });
      }
      resetForm();
      await refreshCustomer();
      load();
    } catch (err) {
      setFieldErrors(getApiFieldErrors(err));
      setFormError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this address?")) {
      return;
    }
    try {
      await deleteAddress(id);
      if (editingId === id) {
        resetForm();
      }
      await refreshCustomer();
      load();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    }
  }

  async function handleDefault(address: ApiAddress) {
    try {
      await updateAddress(address.id, { is_default: true });
      await refreshCustomer();
      load();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    }
  }

  if (status === "error") {
    return <ShopErrorState title="Unable to load addresses" message={error ?? ""} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Addresses</h1>
        <p className="mt-2 text-sm text-slate-600">Saved addresses can be selected at checkout.</p>

        {status === "loading" ? <div className="mt-6 h-32 animate-pulse rounded-2xl bg-slate-200" /> : null}

        {status === "ready" && addresses.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">No saved addresses yet.</p>
        ) : null}

        {addresses.length ? (
          <ul className="mt-6 grid gap-3">
            {addresses.map((address) => (
              <li key={address.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">
                      {address.full_name}
                      {address.is_default ? (
                        <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p>
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </p>
                    <p>
                      {address.city}, {address.state} {address.pincode}
                    </p>
                    <p>{address.phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!address.is_default ? (
                      <button
                        type="button"
                        onClick={() => void handleDefault(address)}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                      >
                        Make default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => startEdit(address)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(address.id)}
                      className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          {editingId ? "Edit address" : "Add address"}
        </h2>
        {formError ? <p className="mt-3 text-sm text-rose-700">{formError}</p> : null}
        <form className="mt-4 space-y-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <AddressForm
            draft={draft}
            errors={fieldErrors}
            disabled={pending}
            showDefault
            isDefault={isDefault}
            onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))}
            onDefaultChange={setIsDefault}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center rounded-full bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {pending ? "Saving…" : editingId ? "Update address" : "Save address"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-semibold"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
