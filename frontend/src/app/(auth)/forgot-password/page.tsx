"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset instructions.");
        setIsLoading(false);
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen max-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-gray-900 antialiased selection:bg-lime-300 selection:text-black overflow-hidden">
      {/* BEGIN: LeftBrandShowcase (50% wide desktop panel) */}
      <aside
        className="hidden lg:flex w-full h-full max-h-screen bg-pickle-dark text-white flex-col justify-between p-8 xl:p-12 relative overflow-hidden select-none"
        data-purpose="brand-sidebar"
      >
        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center" data-purpose="brand-header">
          <Link href="/" className="focus:outline-none inline-flex items-center gap-2 group">
            <h1 className="font-brand-logo text-2xl xl:text-3xl font-extrabold uppercase tracking-tight text-pickle-lime group-hover:opacity-90 transition-opacity">
              BRIGHTLOOP
            </h1>
          </Link>
        </div>

        {/* Center Hero Graphic & Slogan */}
        <div className="my-auto py-2 relative flex flex-col items-start z-10 max-w-xl" data-purpose="hero-composition">
          {/* Curved Graphic & Slogan Header */}
          <div className="relative w-full max-w-[300px] h-[130px] mb-1">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 340 180">
              <path className="curved-text-path" d="M 38 155 C 50 68, 125 35, 230 68" id="curve" />
              <text className="curved-text-content">
                <textPath href="#curve" startOffset="4%">
                  Scale your
                </textPath>
              </text>
              {/* Stylized Hand / Launch Icon Illustration */}
              <path d="M 0 115 L 75 160 L 58 190 L 0 148 Z" fill="#ffffff" />
              <line stroke="#0A291E" strokeLinecap="round" strokeWidth="3" x1="72" x2="57" y1="156" y2="186" />
              <path
                d="M 75 160 C 86 166, 102 160, 115 142 L 142 108 C 145 104, 142 98, 137 98 C 133 98, 130 101, 127 106 L 115 122 L 128 85 C 131 78, 124 74, 118 76 C 114 78, 110 82, 107 90 L 99 110 L 98 86 C 98 80, 91 78, 86 82 C 82 85, 82 91, 84 98 L 88 116 L 82 106 C 78 101, 71 102, 69 108 C 67 114, 70 120, 74 126 L 82 142 Z"
                fill="#ffffff"
                stroke="#ffffff"
                strokeLinejoin="round"
              />
              <path d="M 103 118 L 118 97" stroke="#0A291E" strokeLinecap="round" strokeWidth="1.8" />
              <path d="M 94 122 L 95 102" stroke="#0A291E" strokeLinecap="round" strokeWidth="1.8" />
              <path d="M 85 130 L 80 118" stroke="#0A291E" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </div>
          {/* Main Headline Typography */}
          <div className="leading-[0.95] text-left">
            <div className="text-[52px] xl:text-[64px] font-extrabold italic tracking-tight text-pickle-lime inline-block transform -skew-x-3">
              recurring
            </div>
            <div className="text-[48px] xl:text-[58px] font-extrabold tracking-tight text-white block mt-1">
              billing flow
            </div>
          </div>
        </div>

        {/* Bottom Feature Cards Row */}
        <div className="grid grid-cols-3 gap-3 pt-4 z-10 border-t border-white/10" data-purpose="feature-highlights">
          <div className="bg-pickle-card border border-pickle-card rounded-xl p-3 flex flex-col items-start transition-all hover:bg-opacity-80">
            <span aria-label="receipt icon" className="text-xl mb-1.5" role="img">
              ⚡
            </span>
            <h2 className="text-xs font-bold text-white mb-1 leading-snug">Automated Invoicing</h2>
            <p className="text-[11px] text-gray-300 leading-snug font-normal line-clamp-2">
              Auto-generate recurring invoices and eliminate manual errors.
            </p>
          </div>
          <div className="bg-pickle-card border border-pickle-card rounded-xl p-3 flex flex-col items-start transition-all hover:bg-opacity-80">
            <span aria-label="layers icon" className="text-xl mb-1.5" role="img">
              🔄
            </span>
            <h2 className="text-xs font-bold text-white mb-1 leading-snug">Multi-Tier Plans</h2>
            <p className="text-[11px] text-gray-300 leading-snug font-normal line-clamp-2">
              Configure flexible billing cycles and custom pricing rules.
            </p>
          </div>
          <div className="bg-pickle-card border border-pickle-card rounded-xl p-3 flex flex-col items-start transition-all hover:bg-opacity-80">
            <span aria-label="chart icon" className="text-xl mb-1.5" role="img">
              📈
            </span>
            <h2 className="text-xs font-bold text-white mb-1 leading-snug">Real-Time MRR</h2>
            <p className="text-[11px] text-gray-300 leading-snug font-normal line-clamp-2">
              Monitor recurring metrics, cash flow, and overdue accounts.
            </p>
          </div>
        </div>
      </aside>
      {/* END: LeftBrandShowcase */}

      {/* BEGIN: RightAuthArea (50% crisp white panel) */}
      <main
        className="w-full h-full max-h-screen bg-white flex flex-col justify-between p-6 sm:p-8 lg:p-10 relative overflow-y-auto lg:overflow-hidden"
        data-purpose="authentication-panel"
      >
        {/* Top Navigation: Return to landing page + Sign In switcher */}
        <nav className="flex justify-between items-center text-xs sm:text-sm" data-purpose="top-navigation">
          <div className="flex items-center gap-2">
            <div className="lg:hidden mr-1">
              <Link href="/" className="font-brand-logo text-xl font-extrabold uppercase tracking-tight text-pickle-dark">
                BRIGHTLOOP
              </Link>
            </div>
            {/* Button to redirect back to landing page */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black transition-colors rounded-full border border-gray-200 px-3 py-1.5 hover:bg-gray-50 hover:border-gray-300 shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to home</span>
            </Link>
          </div>

          <div className="flex items-center text-xs sm:text-sm">
            <span className="text-neutral-500 hidden sm:inline">Remember your password?</span>
            <Link
              className="ml-1.5 font-bold text-black hover:underline focus:outline-none focus:ring-1 focus:ring-black rounded"
              href="/login"
            >
              Sign in
            </Link>
          </div>
        </nav>

        {/* Center Auth Form Container */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-2" data-purpose="forgot-password-container">
          {isSubmitted ? (
            <div className="text-center py-2">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 mb-3">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-950 mb-1">Check your email</h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed mb-6">
                If an account exists with <span className="font-semibold text-gray-800">{email}</span>, you will receive password reset instructions shortly.
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-2.5 px-6 rounded-full text-sm border border-gray-200 transition-all duration-150 cursor-pointer"
                  onClick={() => setIsSubmitted(false)}
                >
                  Try another email
                </button>
                <Link
                  href="/login"
                  className="block text-center text-xs font-semibold text-gray-500 hover:text-black hover:underline pt-1"
                >
                  &larr; Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Main Title & Description */}
              <header className="text-center mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-950 mb-1">Forgot password?</h2>
                <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto leading-normal">
                  Enter your email address and we&apos;ll send you instructions to reset your password.
                </p>
              </header>

              {/* Error Banner */}
              {error && (
                <div className="mb-3 rounded-lg bg-red-50 p-2.5 border border-red-200 text-xs">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 text-red-500 mr-2 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium text-red-800">{error}</span>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3" data-purpose="forgot-password-form">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="alex@company.com"
                    required
                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A291E] focus:border-transparent transition"
                  />
                </div>

                <div className="pt-1.5">
                  <button
                    className="w-full bg-black hover:bg-neutral-900 active:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-6 rounded-full text-sm transition-all duration-150 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black flex items-center justify-center cursor-pointer"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <svg
                        className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    {isLoading ? "Sending link..." : "Send Reset Link"}
                  </button>
                </div>
              </form>

              {/* Back to sign in link */}
              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-gray-500 hover:text-black hover:underline inline-flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Legal Footer */}
        <footer className="text-center text-[11px] text-gray-400 py-1" data-purpose="terms-and-privacy">
          By continuing, you agree to our{" "}
          <a className="text-gray-700 font-semibold underline underline-offset-2 hover:text-black" href="#terms">
            Terms
          </a>{" "}
          and{" "}
          <a className="text-gray-700 font-semibold underline underline-offset-2 hover:text-black" href="#privacy">
            Privacy Policy
          </a>
        </footer>
      </main>
      {/* END: RightAuthArea */}
    </div>
  );
}
