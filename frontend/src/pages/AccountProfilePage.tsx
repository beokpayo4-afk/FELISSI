import { useEffect, useState, type FormEvent } from "react";
import { getApiErrorMessage, getApiFieldErrors } from "@/api/errors";
import { AuthField } from "@/components/auth/AuthField";
import { useAuth } from "@/store/AuthContext";

export function AccountProfilePage() {
  const { customer, updateProfile, changePassword } = useAuth();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileFields, setProfileFields] = useState<Record<string, string>>({});
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profilePending, setProfilePending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFields, setPasswordFields] = useState<Record<string, string>>({});
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordPending, setPasswordPending] = useState(false);
  const [fullName, setFullName] = useState(customer?.full_name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");

  useEffect(() => {
    document.title = "Profile · FELISSI";
    return () => {
      document.title = "FELISSI PRIVATE LIMITED";
    };
  }, []);

  useEffect(() => {
    setFullName(customer?.full_name ?? "");
    setPhone(customer?.phone ?? "");
  }, [customer]);

  async function handleProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfilePending(true);
    setProfileError(null);
    setProfileFields({});
    setProfileMessage(null);
    try {
      await updateProfile({ full_name: fullName.trim(), phone: phone.trim() });
      setProfileMessage("Profile updated.");
    } catch (err) {
      setProfileFields(getApiFieldErrors(err));
      setProfileError(getApiErrorMessage(err));
    } finally {
      setProfilePending(false);
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextPassword = String(data.get("new_password") || "");
    const confirm = String(data.get("confirm_password") || "");
    if (nextPassword !== confirm) {
      setPasswordFields({ confirm_password: "Passwords do not match." });
      setPasswordError(null);
      return;
    }
    setPasswordPending(true);
    setPasswordError(null);
    setPasswordFields({});
    setPasswordMessage(null);
    try {
      await changePassword({
        current_password: String(data.get("current_password") || ""),
        new_password: nextPassword,
      });
      form.reset();
      setPasswordMessage("Password updated. You stay signed in on this device.");
    } catch (err) {
      setPasswordFields(getApiFieldErrors(err));
      setPasswordError(getApiErrorMessage(err));
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Profile</h1>
        <p className="mt-2 text-sm text-slate-600">Email cannot be changed from this page.</p>
        {profileMessage ? <p className="mt-4 text-sm text-emerald-700">{profileMessage}</p> : null}
        {profileError ? <p className="mt-4 text-sm text-rose-700">{profileError}</p> : null}
        <form className="mt-5 space-y-4" onSubmit={(event) => void handleProfile(event)}>
          <AuthField
            id="full_name"
            label="Full name"
            name="full_name"
            autoComplete="name"
            value={fullName}
            error={profileFields.full_name}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
          <AuthField
            id="email"
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={customer?.email ?? ""}
            disabled
            readOnly
          />
          <AuthField
            id="phone"
            label="Mobile number"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            error={profileFields.phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
          <button
            type="submit"
            disabled={profilePending}
            className="inline-flex h-11 items-center rounded-full bg-sky-600 px-5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {profilePending ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Change password</h2>
        <p className="mt-2 text-sm text-slate-600">
          Other sessions are signed out. Your new password is not saved in the browser.
        </p>
        {passwordMessage ? <p className="mt-4 text-sm text-emerald-700">{passwordMessage}</p> : null}
        {passwordError ? <p className="mt-4 text-sm text-rose-700">{passwordError}</p> : null}
        <form className="mt-5 space-y-4" onSubmit={(event) => void handlePassword(event)}>
          <AuthField
            id="current_password"
            label="Current password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            error={passwordFields.current_password}
            required
          />
          <AuthField
            id="new_password"
            label="New password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            error={passwordFields.new_password}
            required
          />
          <AuthField
            id="confirm_password"
            label="Confirm new password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            error={passwordFields.confirm_password}
            required
          />
          <button
            type="submit"
            disabled={passwordPending}
            className="inline-flex h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-800 disabled:opacity-50"
          >
            {passwordPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
