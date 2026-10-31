import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Brightloop - Subscriptions, Simplified",
  description: "Subscription Management & Billing Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full antialiased ${plusJakartaSans.variable}`}>
      <body className="min-h-full flex flex-col bg-[#f8faf9] text-gray-800 font-sans">{children}</body>
    </html>
  );
}
