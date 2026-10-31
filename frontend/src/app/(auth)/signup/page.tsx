"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors] || errors.general) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side quick checks
    const newErrors: typeof errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Full name or company name is required (min 2 characters)";
    }
    if (!formData.email) {
      newErrors.email = "Email address is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length <= 8) {
      newErrors.password = "Password must be more than 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = "Must contain at least one lowercase letter";
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = "Must contain at least one special character";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors({
            name: data.details.name?.[0],
            email: data.details.email?.[0],
            password: data.details.password?.[0],
            general: data.error,
          });
        } else {
          setErrors({ general: data.error || "Signup failed. Please try again." });
        }
        setIsLoading(false);
        return;
      }

      // Successful customer signup -> Redirect to login page with success notification
      router.push("/login?registered=true");
    } catch {
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Brightloop
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Create your customer account to manage subscriptions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-white/20 sm:px-10">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900">Get started</h3>
            <p className="text-xs text-slate-500 mt-1">
              Join to view quotations, activate plans, and manage recurring invoices
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
                label="Full Name or Company"
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe or Acme Corp"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />
            </div>

            <div>
              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
            </div>

            <div>
              <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Must be &gt;8 chars, with uppercase, lowercase &amp; special character.
              </p>
            </div>

            <div>
              <Input
                label="Confirm Password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full py-2.5 text-base shadow-indigo-600/30"
                loading={isLoading}
              >
                Create Customer Account
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="text-sm text-center text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Notice explaining role permissions */}
        <div className="mt-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-center">
          <p className="text-xs text-slate-300">
            Note: Staff &amp; Team member accounts are provisioned directly by your Organization Admin.
          </p>
        </div>
      </div>
    </div>
  );
}
