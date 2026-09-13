import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/errors";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { safeNextPath } from "@/lib/navigation";
import { useAuth } from "@/store/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = "Create account · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") || "");
    const confirm = String(data.get("confirm_password") || "");
    if (password !== confirm) {
      setFieldErrors({ confirm_password: "Passwords do not match." });
      setError(null);
      return;
    }
    setPending(true);
    setError(null);
    setFieldErrors({});
    try {
      await register({
        full_name: String(data.get("full_name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        password,
      });
      form.reset();
      navigate(next, { replace: true });
    } catch (err) {
      setFieldErrors(getApiFieldErrors(err));
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Create account"
      description="Use a 10-digit Indian mobile number. Passwords stay on the server and are never stored in the browser."
    >
      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)} autoComplete="on">
        <AuthField
          id="full_name"
          label="Full name"
          name="full_name"
          autoComplete="name"
          error={fieldErrors.full_name}
          required
        />
        <AuthField
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          error={fieldErrors.email}
          required
        />
        <AuthField
          id="phone"
          label="Mobile number"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          error={fieldErrors.phone}
          required
        />
        <AuthField
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          error={fieldErrors.password}
          required
        />
        <AuthField
          id="confirm_password"
          label="Confirm password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          error={fieldErrors.confirm_password}
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          to={`/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-sky-700 hover:text-sky-800"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
