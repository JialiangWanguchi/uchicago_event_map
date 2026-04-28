import { SignIn } from "@clerk/nextjs";
import { EmptyState } from "@/components/empty-state";
import { hasClerkConfig } from "@/lib/env";

export default function SignInPage() {
  if (!hasClerkConfig()) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          title="Clerk is not configured"
          description="Add Clerk publishable and secret keys to enable hosted sign-in."
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <SignIn />
    </main>
  );
}
