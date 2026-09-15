import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { peekAuthExpired } from "@/lib/authStorage";
import { safeNextPath } from "@/lib/navigation";
import { useAuth } from "@/store/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [expired] = useState(() => peekAuthExpired());
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = "Sign in · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const result = await login({
        email: String(data.get("email") || "").trim(),
        password: String(data.get("password") || ""),
      });
      if (result.is_staff || result.customer.is_staff) {
        navigate(next.startsWith("/admin") ? next : "/admin", { replace: true });
        return;
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      description="One sign-in for everyone. Shoppers open their account; store staff open the FELISSI admin workspace — no separate admin login."
    >
      {expired ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your session expired. Sign in again to continue.
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <AuthField
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <AuthField
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-sky-700 hover:text-sky-800">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        New to FELISSI?{" "}
        <Link
          to={`/register?next=${encodeURIComponent(next)}`}
          className="font-medium text-sky-700 hover:text-sky-800"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
