"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <nav className="max-w-full mx-auto flex items-center justify-between p-4 border-b">
        <p>Loading...</p>
      </nav>
    );
  }

  return (
    <nav className="max-w-full mx-auto flex items-center justify-between p-4 border-b">
      <Link href="/" className="font-bold text-xl">
        TradeMySkills
      </Link>
      <div className="flex items-center gap-6">
        {session ? (
          <>
            <Link
              className={pathname === "/dashboard" ? "font-bold" : ""}
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className={pathname === "/listings" ? "font-bold" : ""}
              href="/listings"
            >
              Listings
            </Link>
            <Link
              className={pathname === "/messages" ? "font-bold" : ""}
              href="/messages"
            >
              Messages
            </Link>
            <Link
              className={pathname === "/swaps" ? "font-bold" : ""}
              href="/swaps"
            >
              Swaps
            </Link>
            <Link
              className={pathname === "/profile" ? "font-bold" : ""}
              href="/profile"
            >
              Profile
            </Link>
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt="User Avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-red-400"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/api/auth/signin">Sign In</Link>
        )}
      </div>
    </nav>
  );
}
