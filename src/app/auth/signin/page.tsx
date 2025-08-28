"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) setError("Invalid email or password.");
    else window.location.href = "/";
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-gray-800 rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full border px-3 py-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            className="w-full border px-3 py-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
        >
          Sign In
        </button>
        {error && <p className="text-red-600 text-center">{error}</p>}
      </form>
      <button
        onClick={handleGoogleSignIn}
        className="w-full mt-4 bg-green-800 text-white py-2 rounded font-semibold hover:bg-red-800 flex items-center justify-center gap-2"
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <g>
            <path
              fill="#4285F4"
              d="M24 9.5c3.54 0 6.73 1.22 9.24 3.22l6.93-6.93C35.6 2.34 30.13 0 24 0 14.64 0 6.27 5.64 2.13 14.02l8.52 6.62C12.99 14.02 17.09 9.5 24 9.5z"
            />
            <path
              fill="#34A853"
              d="M46.1 24.5c0-1.64-.15-3.22-.44-4.75H24v9.02h12.44c-.54 2.92-2.16 5.39-4.62 7.06l7.19 5.59C43.73 37.02 46.1 31.27 46.1 24.5z"
            />
            <path
              fill="#FBBC05"
              d="M10.65 28.64c-1.13-3.36-1.13-6.98 0-10.34l-8.52-6.62C.73 15.98 0 20.08 0 24c0 3.92.73 8.02 2.13 11.32l8.52-6.68z"
            />
            <path
              fill="#EA4335"
              d="M24 48c6.13 0 11.6-2.02 15.93-5.52l-7.19-5.59c-2.01 1.36-4.58 2.16-8.74 2.16-6.91 0-11.01-4.52-12.35-8.14l-8.52 6.68C6.27 42.36 14.64 48 24 48z"
            />
          </g>
        </svg>
        Sign in with Google
      </button>
      <div className="mt-4 text-center">
        <span>Don't have an account?</span>
        <Link
          href="/auth/signup"
          className="ml-2 text-blue-600 hover:underline font-semibold"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
