import Link from "next/link";
import { CalendarDays, MapPinned, Radio } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { hasClerkConfig } from "@/lib/env";
const links = [
  { href: "/", label: "Explore" },
  { href: "/saved", label: "Saved" }
];

export function TopNav() {
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 0 }), "yyyy-MM-dd");
  const thisWeekHref = `/?dateFrom=${weekStart}&dateTo=${weekEnd}`;
  const liveHref = "/?happeningNow=1";

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-slate-950">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
            <MapPinned className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-brand-600">UChicago</div>
            <div className="text-base font-semibold">Campus Event Map</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={liveHref} className="hidden items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-100 sm:flex">
            <Radio className="h-4 w-4" />
            Live now
          </Link>
          <Link href={thisWeekHref} className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 md:flex">
            <CalendarDays className="h-4 w-4" />
            This week
          </Link>
          {hasClerkConfig() ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white">Sign in</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">Clerk not configured</div>
          )}
        </div>
      </div>
    </header>
  );
}
