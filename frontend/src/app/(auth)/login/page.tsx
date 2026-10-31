"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side quick checks
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) {
      newErrors.email = "Email address is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors({
            email: data.details.email?.[0],
            password: data.details.password?.[0],
            general: data.error,
          });
        } else {
          setErrors({ general: data.error || "Login failed. Please check your credentials." });
        }
        setIsLoading(false);
        return;
      }

      // Successful login -> Navigate to respective dashboard/portal
      router.push(data.redirectUrl || "/dashboard");
    } catch (err: any) {
      setErrors({ general: "Unable to connect to the server. Please try again." });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/20 mb-4">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Brightloop
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Unified Subscription & Recurring Billing Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-white/20 sm:px-10">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Sign in to your account</h3>
            <p className="text-xs text-slate-500 mt-1">
              Access the management dashboard or customer portal
            </p>
          </div>

          {errors.general && (
            <div className="mb-5 rounded-lg bg-red-50 p-3.5 border border-red-200">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-500 mr-2 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-red-800">{errors.general}</span>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="admin@brightloop.com or customer@company.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full py-2.5 text-base shadow-indigo-600/30"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="text-sm text-center text-slate-600">
              New customer?{" "}
              <Link
                href="/signup"
                className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>

        {/* Demo credentials hint for testing */}
        <div className="mt-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-center">
          <p className="text-xs text-slate-300 font-medium">
            Demo Roles: <span className="text-indigo-400">Admin</span> &bull;{" "}
            <span className="text-indigo-400">Staff</span> &bull;{" "}
            <span className="text-indigo-400">Customer</span>
          </p>
        </div>
      </div>
    </div>
  );
}
