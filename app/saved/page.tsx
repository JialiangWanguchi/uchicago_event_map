import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { getCurrentUserId } from "@/lib/auth";
import { getSavedEvents } from "@/lib/data";
import { hasSavedEventsConfig } from "@/lib/env";

export default async function SavedPage() {
  const userId = await getCurrentUserId();

  if (!hasSavedEventsConfig()) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title="Saved events are disabled"
          description="Configure Clerk and the Supabase service role key to enable user-specific bookmarks."
        />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-panel">
          <h1 className="text-2xl font-semibold text-slate-950">Sign in to see saved events</h1>
          <p className="mt-2 text-sm text-slate-600">Bookmarks are tied to your account.</p>
          <div className="mt-6">
            <SignInButton mode="modal">
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white">Sign in</button>
            </SignInButton>
          </div>
        </div>
      </main>
    );
  }

  const events = await getSavedEvents(userId);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-950">Saved events</h1>
        <p className="mt-2 text-sm text-slate-600">Your personal shortlist for the week.</p>
      </div>

      <div className="space-y-4">
        {events.length ? (
          events.map((event) => <EventCard key={event.id} event={event} isSaved canSave />)
        ) : (
          <EmptyState
            title="No saved events yet"
            description="Go back to the explore view and bookmark events you want to keep."
          />
        )}
      </div>

      <div className="mt-6">
        <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to explore
        </Link>
      </div>
    </main>
  );
}
