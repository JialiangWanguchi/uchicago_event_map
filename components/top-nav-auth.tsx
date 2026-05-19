"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function TopNavAuth() {
  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white">
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}
