import { useState, type FormEvent } from "react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }
    setSent(true);
  }

  return (
    <section className="border-t border-line bg-forest px-4 py-16 text-white sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Drop-in deals, not inbox noise
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#d7e4de] sm:text-base">
          One email a week with restocks, price drops, and new electronics.
        </p>
        {sent ? (
          <p className="mt-8 text-sm text-sky-100">
            Thanks — we will only write when there is something worth opening.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-[#9bb8ac] focus:border-sky-400 sm:max-w-sm"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-sky-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
