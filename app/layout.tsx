import type { Metadata } from "next";
import "./globals.css";
import { AppClerkProvider } from "@/components/clerk-provider";
import { TopNav } from "@/components/top-nav";
import { AiChat } from "@/components/ai-chat";

export const metadata: Metadata = {
  title: "Campus Event Map",
  description: "Browse UChicago events in a list and on a campus map."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppClerkProvider>
          <div className="min-h-screen bg-slate-50 relative pb-16">
            <TopNav />
            {children}
            <AiChat />
          </div>
        </AppClerkProvider>
      </body>
    </html>
  );
}
