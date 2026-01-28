import type { Metadata, Viewport } from "next";
import { Merriweather } from "next/font/google";
import "./globals.css";

// 1. Configure the font
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pipecleaner Flowers",
  description: "Custom hand-crafted bouquets",
};

// 2. THIS FIXES THE SCALE ISSUE ON VERCEL/MOBILE
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Apply the font class directly */}
      <body className={`${merriweather.className} antialiased bg-stone-50 text-zinc-900`}>
        {children}
      </body>
    </html>
  );
}