import type { Metadata, Viewport } from "next";
import { Merriweather } from "next/font/google"; // Use the optimizer
import "./globals.css";

// 1. Configure the font securely
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather", // Adds a CSS variable
});

export const metadata: Metadata = {
  title: "Pipecleaner Flowers",
  description: "Custom hand-crafted bouquets",
};

// 2. Explicitly set the viewport to prevent zooming issues
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        // 3. Apply the font class + Tailwind utilities
        className={`${merriweather.className} antialiased bg-stone-50 text-zinc-900`}
      >
        {children}
      </body>
    </html>
  );
}