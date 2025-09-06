"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import useReveal from "../hooks/useReveal";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const { ref, visible } = useReveal();

  async function loadRecaptcha(siteKey: string) {
    if (!siteKey)
      throw new Error(
        "Missing reCAPTCHA site key (NEXT_PUBLIC_RECAPTCHA_SITE_KEY)."
      );

    if (
      (globalThis as any).grecaptcha &&
      (globalThis as any).grecaptcha.execute
    ) {
      return (globalThis as any).grecaptcha;
    }

    const existing = document.querySelector(
      'script[src*="recaptcha"]'
    ) as HTMLScriptElement | null;
    if (existing) {
      await new Promise<void>((resolve, reject) => {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("Failed to load reCAPTCHA script"))
        );
      });
      if ((globalThis as any).grecaptcha) return (globalThis as any).grecaptcha;
      throw new Error("grecaptcha did not initialize after script load");
    }

    return new Promise<any>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      s.async = true;
      s.defer = true;
      s.onload = () => {
        if ((globalThis as any).grecaptcha)
          resolve((globalThis as any).grecaptcha);
        else reject(new Error("grecaptcha not available after script load"));
      };
      s.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
      document.head.appendChild(s);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim();

    // Dev fallback: allow submit without reCAPTCHA on localhost when no site key configured
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    if (!siteKey) {
      if (isLocal) {
        console.warn(
          "No reCAPTCHA site key configured — submitting without token (dev only)."
        );
      } else {
        toast.error(
          "reCAPTCHA site key not configured. Contact the site admin."
        );
        setLoading(false);
        return;
      }
    }

    try {
      if (siteKey) {
        // ensure script is loaded and grecaptcha ready
        await loadRecaptcha(siteKey);
        await new Promise<void>((resolve, reject) => {
          try {
            (globalThis as any).grecaptcha.ready(async () => {
              try {
                const token = await (globalThis as any).grecaptcha.execute(
                  siteKey,
                  { action: "submit" }
                );
                formData.append("g-recaptcha-response", token);
                resolve();
              } catch (err) {
                reject(err);
              }
            });
          } catch (err) {
            reject(err);
          }
        });
      }

      const res = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        toast.success("You're on the list — welcome!");
        form.reset();
      } else {
        toast.error("Submission failed. Please try again.");
        console.error("Form submit non-OK:", await res.text());
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("reCAPTCHA failed to load or unexpected error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-200/30 to-transparent dark:from-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-200/30 to-transparent dark:from-purple-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left column - Content */}
            <div className="space-y-8">
              {/* <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
                🔄 Skill Marketplace • Cash-Free Trading
              </div> */}

              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  Trade Skills,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
                    Build Community
                  </span>
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
                  A modern barter marketplace where neighbors trade services,
                  skills, and creations. No money required - just fair exchanges
                  between community members.
                </p>
              </div>

              {/* CTA Form */}
              <div className="space-y-4">
                <form
                  onSubmit={handleSubmit}
                  // action="https://formspree.io/f/movlkddd"
                  action="api/signup"
                  method="POST"
                  className="flex flex-col sm:flex-row gap-3 max-w-md"
                  data-captcha="true"
                >
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    aria-label="Email for early access"
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Joining..." : "Get Early Access"}
                  </button>
                </form>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Join the beta • No spam, just updates when we launch
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <StatCard number="0%" label="Transaction Fees" />
                <StatCard number="100%" label="Community Driven" />
                <StatCard number="∞" label="Skill Possibilities" />
              </div>
            </div>

            {/* Right column - Demo/Preview */}
            <div className="lg:pl-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Featured Swaps
                  </h3>
                  <span className="text-xs text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    • Live
                  </span>
                </div>

                <div className="space-y-4">
                  <SwapCard
                    offering="Logo Design"
                    seeking="Guitar Lessons"
                    user="Sarah M."
                    location="Downtown"
                    category="creative"
                  />
                  <SwapCard
                    offering="Plumbing Repair"
                    seeking="Tax Preparation"
                    user="Mike R."
                    location="Northside"
                    category="service"
                  />
                  <SwapCard
                    offering="Handmade Pottery"
                    seeking="Web Development"
                    user="Emma L."
                    location="Eastside"
                    category="craft"
                  />
                  <SwapCard
                    offering="Dog Training"
                    seeking="Photography Session"
                    user="Alex K."
                    location="West End"
                    category="service"
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() =>
                      toast("Coming soon! Join the early access waitlist.")
                    }
                    className="w-full py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm transition-colors"
                  >
                    Browse all swaps →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How TradeMySkills Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Simple, fair, and community-focused. Create your profile, list
              what you offer, and start making meaningful connections through
              skill exchanges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              step="1"
              title="Create Your Profile"
              description="Sign up and showcase your skills, services, or creations. Add photos, set your location, and describe what makes your offerings special."
              icon="👤"
            />
            <StepCard
              step="2"
              title="List & Browse"
              description="Post what you're offering and what you're seeking. Browse other members' skills and find perfect matches in your area."
              icon="🔍"
            />
            <StepCard
              step="3"
              title="Connect & Trade"
              description="Message potential trade partners, agree on terms, and make the exchange. Rate each other to build community trust."
              icon="🤝"
            />
          </div>
        </div>
      </section>

      {/* What You Can Trade Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Can You Trade?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              The possibilities are endless when creativity meets community
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-fr items-stretch">
            <CategoryCard
              title="Professional Services"
              description="Trade your professional expertise with neighbors who need specialized skills."
              examples={[
                "Web Design",
                "Tax Prep",
                "Legal Advice",
                "Marketing",
                "Consulting",
                "Accounting",
              ]}
              color="blue"
            />
            <CategoryCard
              title="Creative Works"
              description="Share your artistic talents and creative projects with the community."
              examples={[
                "Logo Design",
                "Photography",
                "Writing",
                "Video Editing",
                "Graphic Design",
                "Music Production",
              ]}
              color="purple"
            />
            <CategoryCard
              title="Handmade Items"
              description="Exchange unique handcrafted items and artisanal creations."
              examples={[
                "Pottery",
                "Jewelry",
                "Woodwork",
                "Baked Goods",
                "Textiles",
                "Art Pieces",
              ]}
              color="green"
            />
            <CategoryCard
              title="Skills & Lessons"
              description="Teach what you know and learn something new from your neighbors."
              examples={[
                "Guitar Lessons",
                "Fitness Training",
                "Cooking",
                "Languages",
                "Tutoring",
                "Crafts",
              ]}
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Build Real Connections
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                More than just trades - TradeMySkills helps you discover
                talented neighbors, learn new skills, and contribute to a
                thriving local economy built on trust and reciprocity.
              </p>

              <div className="space-y-6">
                <TestimonialCard
                  quote="Traded my logo design skills for amazing guitar lessons. Made a great friend in the process!"
                  author="Sarah M."
                />
                <TestimonialCard
                  quote="Fixed a neighbor's plumbing in exchange for tax help. Both saved money and time."
                  author="Mike R."
                />
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-50 dark:from-blue-950/10 dark:to-blue-950/5 rounded-2xl p-8 border-2 border-gray-200 dark:border-green-500/20">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Community Benefits
                </h3>
                <div className="space-y-4">
                  <BenefitItem text="Save money on services you need" />
                  <BenefitItem text="Monetize skills you already have" />
                  <BenefitItem text="Meet interesting people in your area" />
                  <BenefitItem text="Build a reputation in your community" />
                  <BenefitItem text="Support local talent over big corporations" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-2">TradeMySkills</h3>
            <p className="text-gray-400">
              Your local skill-swapping marketplace
            </p>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} TradeMySkills • Building communities
              through skill sharing
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Components
function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-gray-900 dark:text-white">
        {number}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}

function SwapCard({
  offering,
  seeking,
  user,
  location,
  category,
}: {
  offering: string;
  seeking: string;
  user: string;
  location: string;
  category: "creative" | "service" | "craft";
}) {
  const categoryColors = {
    creative:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    service: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    craft:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white">
            {offering}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Seeking: {seeking}
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded ${categoryColors[category]}`}
        >
          {category}
        </span>
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{user}</span>
        <span>{location}</span>
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="text-center">
      <div className="w-25 h-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
        {step}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function CategoryCard({
  title,
  description,
  examples,
  color = "blue",
}: {
  title: string;
  description: string;
  examples: string[];
  color?: "blue" | "purple" | "green" | "orange";
}) {
  const { ref, visible } = useReveal();
  const colorStyles = {
    blue: {
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      accent: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200/20 dark:border-blue-500/20",
    },
    purple: {
      gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
      accent: "bg-purple-500",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-200/20 dark:border-purple-500/20",
    },
    green: {
      gradient: "from-green-500/10 via-green-500/5 to-transparent",
      accent: "bg-green-500",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-200/20 dark:border-green-500/20",
    },
    orange: {
      gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
      accent: "bg-orange-500",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-200/20 dark:border-orange-500/20",
    },
  };

  const style = colorStyles[color];

  return (
    // <div className="group relative h-full">
    <div
      ref={ref as any}
      className={`group relative h-full transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div
        className={`
        h-full min-w-60 rounded-2xl border-2 ${style.border}
        bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl
        p-6 transition-all duration-500 ease-out
        hover:shadow-xl hover:-translate-y-2
      `}
      >
        {/* Gradient Background */}
        <div
          className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${style.gradient} opacity-60 rounded-2xl`}
        />

        {/* Header */}
        <div className="relative mb-4">
          <div
            className={`w-12 h-3 ${style.accent} rounded-full mb-4 transform group-hover:scale-110 transition-transform duration-300`}
          />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Examples Grid */}
        <div className="relative space-y-3 flex-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Popular Examples
          </div>
          <div className="grid grid-cols-2 gap-2">
            {examples.slice(0, 6).map((example, i) => (
              <div
                key={i}
                className="text-sm text-gray-700 dark:text-gray-300 py-1.5 px-3 rounded-lg bg-white/60 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 transform group-hover:scale-101 transition-transform duration-200"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {example}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {/* <div className="relative mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {examples.length} categories
            </span>
            <div
              className={`w-2 h-2 ${style.accent} rounded-full transform group-hover:scale-125 transition-transform duration-300`}
            />
          </div>
        </div> */}

        {/* Subtle Hover Glow */}
        <div
          className={`
          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
          bg-gradient-to-r ${style.gradient} blur-xl -z-10
          transition-opacity duration-500
        `}
        />
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author }: { quote: string; author: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
      <p className="text-gray-700 dark:text-gray-300 italic">"{quote}"</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        — {author}
      </p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-6 bg-gradient-to-r from-green-500/60 to-green-400 bg-green-500/60 border border-green-500 rounded-full flex items-center justify-center flex-shrink-0">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <span className="text-gray-700 dark:text-gray-300">{text}</span>
    </div>
  );
}
