import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
// import Link from "next/link";
// import { signOut } from "next-auth/react";
import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import Navbar from "@/components/ui/Navbar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "TradeMySkills",
  description: "Local skill swapping network",
};

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body
      // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <header className="bg-gray-800 text-white">
            <Navbar />
          </header>
          <main className="max-w-5xl mx-auto p-6">{children}</main>
        </Providers>
        <Toaster position="top-right" reverseOrder={false} />
      </body>
    </html>
  );
}
