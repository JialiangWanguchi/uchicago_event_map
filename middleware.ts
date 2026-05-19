import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

const hasClerkKeys =
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  Boolean(process.env.CLERK_SECRET_KEY);

const clerkHandler = clerkMiddleware();

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!hasClerkKeys) {
    return NextResponse.next();
  }

  try {
    return clerkHandler(request, event);
  } catch (error) {
    console.error("[middleware] Clerk error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|ttf|woff2?|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
