import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { confirmPasswordReset, requestPasswordReset } from "@/api/auth";
import { getApiErrorMessage } from "@/api/errors";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";

export function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid")?.trim() ?? "";
  const token = searchParams.get("token")?.trim() ?? "";
  const isConfirm = Boolean(uid && token);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = isConfirm ? "Choose a new password · FELISSI" : "Forgot password · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, [isConfirm]);

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") || "").trim();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await requestPasswordReset(email);
      setMessage(result.detail);
      form.reset();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("new_password") || "");
    const confirm = String(data.get("confirm_password") || "");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await confirmPasswordReset({
        uid,
        token,
        new_password: password,
      });
      setMessage(result.detail);
      form.reset();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      title={isConfirm ? "Choose a new password" : "Forgot password"}
      description={
        isConfirm
          ? "Enter a new password for this account. The reset link can be used only once."
          : "Enter the email on your account. If it matches a FELISSI customer, we send reset instructions."
      }
    >
      {message ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      {isConfirm ? (
        <form className="mt-5 space-y-4" onSubmit={(event) => void handleConfirm(event)}>
          <AuthField
            id="new_password"
            label="New password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <AuthField
            id="confirm_password"
            label="Confirm password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {pending ? "Updating…" : "Update password"}
          </button>
        </form>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={(event) => void handleRequest(event)}>
          <AuthField
            id="email"
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send reset instructions"}
          </button>
        </form>
      )}

      <p className="mt-5 text-sm text-slate-600">
        <Link to="/login" className="font-medium text-sky-700 hover:text-sky-800">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
