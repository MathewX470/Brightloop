"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: typeof errors = {};

    if (!token) {
      newErrors.general = "Invalid or missing password reset token.";
    }
    if (!password) {
      newErrors.password = "New password is required";
    } else if (password.length <= 8) {
      newErrors.password = "Password must be more than 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Must contain at least one lowercase letter";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password = "Must contain at least one special character";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors({
            password: data.details.password?.[0],
            general: data.error,
          });
        } else {
          setErrors({ general: data.error || "Failed to reset password." });
        }
        setIsLoading(false);
        return;
      }

      router.push("/login?reset=true");
    } catch {
      setErrors({ general: "Unable to connect to the server. Please try again." });
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
        <div className="w-full max-w-[400px] mx-auto my-auto py-2" data-purpose="reset-password-container">
          {/* Main Title & Description */}
          <header className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-950 mb-1">Set new password</h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto leading-normal">
              {email ? (
                <>
                  Resetting password for <span className="font-semibold text-gray-800">{email}</span>
                </>
              ) : (
                "Create a new, secure password for your account"
              )}
            </p>
          </header>

          {/* Error Banner */}
          {errors.general && (
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
                <span className="font-medium text-red-800">{errors.general}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3" data-purpose="reset-password-form">
            {/* New Password Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="password">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter new password"
                  required
                  className={`w-full px-3.5 py-2 pr-10 text-sm bg-white border ${
                    errors.password ? "border-red-400 focus:ring-red-500" : "border-gray-200 focus:ring-[#0A291E]"
                  } rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition`}
                />
                <button
                  aria-label="Toggle password visibility"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password ? (
                <p className="mt-0.5 text-[11px] text-red-600">{errors.password}</p>
              ) : (
                <p className="mt-0.5 text-[10px] text-gray-400">
                  &gt;8 chars with uppercase, lowercase &amp; special character.
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  placeholder="Repeat new password"
                  required
                  className={`w-full px-3.5 py-2 pr-10 text-sm bg-white border ${
                    errors.confirmPassword ? "border-red-400 focus:ring-red-500" : "border-gray-200 focus:ring-[#0A291E]"
                  } rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition`}
                />
                <button
                  aria-label="Toggle confirm password visibility"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-0.5 text-[11px] text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit CTA Button */}
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
                {isLoading ? "Updating password..." : "Update Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
