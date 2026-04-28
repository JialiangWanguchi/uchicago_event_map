import { auth } from "@clerk/nextjs/server";
import { hasClerkConfig } from "@/lib/env";

export async function getCurrentUserId() {
  if (!hasClerkConfig()) {
    return null;
  }

  try {
    const session = await auth();
    return session.userId ?? null;
  } catch {
    return null;
  }
}
