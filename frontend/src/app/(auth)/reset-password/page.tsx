"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-white/20 sm:px-10">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">Set new password</h3>
        <p className="text-xs text-slate-500 mt-1">
          {email ? (
            <>
              Resetting password for{" "}
              <span className="font-semibold text-slate-700">{email}</span>
            </>
          ) : (
            "Enter your new password below"
          )}
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
            label="New Password"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            required
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Must be &gt;8 chars, with uppercase, lowercase &amp; special character.
          </p>
        </div>

        <div>
          <Input
            label="Confirm New Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
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
            Update Password
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-5 text-center">
        <Link
          href="/login"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Brightloop
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Create a new, secure password for your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
