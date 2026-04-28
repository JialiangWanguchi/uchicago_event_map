import type { Metadata } from "next";
import "./globals.css";
import { AppClerkProvider } from "@/components/clerk-provider";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "Campus Event Map",
  description: "Browse UChicago events in a list and on a campus map."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppClerkProvider>
          <div className="min-h-screen bg-slate-50">
            <TopNav />
            {children}
          </div>
        </AppClerkProvider>
      </body>
    </html>
  );
}
