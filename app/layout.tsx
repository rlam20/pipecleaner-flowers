import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Use Inter for better readability
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pipecleaner Flowers",
  description: "Custom hand-crafted bouquets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-stone-50 text-zinc-900`}>
        {children}
      </body>
    </html>
  );
}