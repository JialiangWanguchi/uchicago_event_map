"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-slate-950">Something went wrong</h1>
      <p className="mt-3 text-sm text-slate-600">
        The app hit a server error. This is often caused by missing Vercel environment variables (Supabase, Clerk) or a
        Supabase schema that has not been updated yet. Check the Vercel function logs for details.
      </p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-slate-500">Digest: {error.digest}</p> : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Try again
      </button>
    </main>
  );
}
