"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ComingSoonPage() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [loading, setLoading] = useState(false);

  function calculateTimeLeft(): Record<string, number> {
    const launchDate = new Date("2025-09-30");
    const difference = +launchDate - +new Date();
    let timeLeft: Record<string, number> = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (typeof grecaptcha === "undefined") {
      toast.error("reCAPTCHA not ready. Please try again.");
      setLoading(false);
      return;
    }

    // Execute reCAPTCHA
    grecaptcha.ready(async () => {
      try {
        const token = await grecaptcha.execute(
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
          { action: "submit" }
        );

        formData.append("g-recaptcha-response", token);

        // Submit form to Formspree
        const res = await fetch(form.action, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          toast.success("You're on the list!");
          form.reset();
        } else {
          toast.error("Submission failed. Please try again.");
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/geometry.png')] pointer-events-none" />
      <h1 className="text-4xl md:text-6xl font-bold mb-3">
        Trade Skills, Build Community
      </h1>
      <p className="text-lg md:text-2xl mb-8 font-light italic">
        Your local Skill-swap network
      </p>

      {/* Countdown Timer */}
      {Object.keys(timeLeft).length > 0 && (
        <div className="flex space-x-4 mb-8">
          {Object.entries(timeLeft).map(([unit, value]) => (
            <div
              key={unit}
              className="flex flex-col items-center bg-white/10 px-4 py-3 rounded-lg"
            >
              <span className="text-3xl font-bold">{value}</span>
              <span className="uppercase text-sm">{unit}</span>
            </div>
          ))}
        </div>
      )}

      {/* Email Signup */}
      <form
        onSubmit={handleSubmit}
        action="https://formspree.io/f/movlkddd"
        method="POST"
        className="flex flex-col sm:flex-row w-full max-w-md gap-3"
        data-captcha="true"
      >
        <input
          type="email"
          name="email"
          required
          placeholder="Enter your email"
          className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
        >
          {loading ? "Submitting..." : "Notify Me"}
        </button>
      </form>

      <p className="mt-4 text-sm text-white/80">
        Be the first to join our beta and start swapping skills!
      </p>

      <footer className="absolute bottom-6 text-white/70 text-xs">
        © {new Date().getFullYear()} TradeMySkills · Your local Skill-swap
        network
      </footer>
    </div>
  );
}
