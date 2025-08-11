import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import Navbar from "@/components/ui/Navbar";
import { Toaster } from "react-hot-toast";
// import Script from "next/script";

export const metadata: Metadata = {
  title: "TradeMySkills",
  description: "Local skill swapping network",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* <meta name="theme-color" content="#000000" /> */}
        <meta
          name="description"
          content="TradeMySkills - Local skill swapping network"
        />
        {/* <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        /> */}
      </head>
      <body>
        <Providers>
          <header className="bg-gray-800 text-white">
            <Navbar />
          </header>
          <main className="w-full min-h-full">{children}</main>
          <Toaster position="top-right" reverseOrder={false} />
        </Providers>
      </body>
    </html>
  );
}
