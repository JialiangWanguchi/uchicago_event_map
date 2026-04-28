"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { hasClientClerkConfig } from "@/lib/env";

export function AppClerkProvider({ children }: { children: React.ReactNode }) {
  if (!hasClientClerkConfig()) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
