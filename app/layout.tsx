import type { Metadata, Viewport } from "next";
import { Merriweather } from "next/font/google";
import "./globals.css";

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${merriweather.className} antialiased bg-stone-50 text-zinc-900`}>
        {children}
      </body>
    </html>
  );
}