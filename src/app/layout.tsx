import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/Toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "BizMatch — Verified B2B Networking", template: "%s · BizMatch" },
  description:
    "A private network of real business owners. Sign up in a minute, swipe to discover businesses by industry and city, and unlock chat the moment you match.",
  keywords: ["B2B networking", "business matching", "swipe to connect", "business owners network"],
  openGraph: {
    title: "BizMatch — Verified B2B Networking",
    description: "Swipe. Match. Do business. A private network of real business owners.",
    type: "website",
    siteName: "BizMatch",
  },
  twitter: {
    card: "summary",
    title: "BizMatch — Verified B2B Networking",
    description: "Swipe. Match. Do business. A private network of real business owners.",
  },
};

export const viewport: Viewport = {
  themeColor: "#07060d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
