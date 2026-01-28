import type { Metadata, Viewport } from "next";
import { Merriweather } from "next/font/google";
import "./globals.css";

// 1. Optimize the font (Replacing the manual <link> tags)
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
  variable: "--font-merriweather",
});

export const metadata: Metadata = {
  title: "Pipecleaner Flowers",
  description: "Custom hand-crafted bouquets",
};

// 2. THE CRITICAL FIX: Viewport Configuration
// This forces the browser to match the device width (fixing the 67% zoom issue)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Apply the font class directly to the body */}
      <body className={`${merriweather.className} antialiased bg-stone-50 text-zinc-900`}>
        {children}
      </body>
    </html>
  );
}