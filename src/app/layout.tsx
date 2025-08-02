import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import Navbar from "@/components/ui/Navbar";
import { Toaster } from "react-hot-toast";

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
