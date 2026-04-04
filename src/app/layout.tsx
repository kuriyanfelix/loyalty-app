// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crumb & Co — Loyalty Rewards",
  description: "Your bakery loyalty card, digital.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen paper-bg">
        {children}
      </body>
    </html>
  );
}
