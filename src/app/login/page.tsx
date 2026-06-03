"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Package2, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // Fetch session to get role and redirect
    const res = await fetch("/api/auth/session");
    const session = await res.json();

    if (session?.user?.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/seller");
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Column: Visual Panel (Visible on large screens) */}
      <div className="relative hidden lg:block lg:flex-[55] bg-slate-900">
        <img
          src="/img1.jpg"
          alt="AASA Enterprise Visual"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        {/* Soft elegant gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-950 via-blue-900/40 to-transparent" />
        
        {/* Visual Panel Info Content */}
        <div className="absolute bottom-16 left-12 right-12 text-white space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-medium tracking-wide">Enterprise Operations</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              Precision at Enterprise Scale.
            </h2>
            <p className="text-sm text-blue-100/90 max-w-md font-light">
              An advanced, robust inventory and order management system built with high-precision math, supporting details down to 6 decimal places.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Form & Info */}
      <div className="flex flex-1 lg:flex-[45] flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white shadow-xl rounded-lg z-10 w-full">
        <div className="mx-auto w-full max-w-md border border-gray-300 rounded-lg p-6">
          {/* Logo / Title */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Package2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                AASA
              </h1>
              <p className="text-[11px] text-gray-500 font-medium">
                Inventory & Order Management
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to access your dashboard.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@aasa.com"
                  required
                  className="h-11 w-full border-gray-200 bg-gray-50/50 hover:bg-gray-50/80 focus:bg-white transition-colors duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-11 w-full border-gray-200 bg-gray-50/50 hover:bg-gray-50/80 focus:bg-white transition-colors duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-red-800 border border-red-100">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-xs font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all duration-200 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </div>

          {/* Demo Credentials Hint */}
          <div className="mt-10 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-3 text-center">
              Demo Credentials
            </p>
            <div className="space-y-3 text-xs text-gray-600">
              <div className="pb-2.5 border-b border-blue-100/50">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-semibold text-gray-900">Admin Portal</span>
                  <span className="text-[10px] bg-blue-100/70 text-blue-800 px-1.5 py-0.5 rounded font-medium">Full Access</span>
                </div>
                <p className="text-gray-500 font-mono text-[11px]">Email: admin@aasa.com</p>
                <p className="text-gray-500 font-mono text-[11px]">Password: admin123</p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-semibold text-gray-900">Seller Portal</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">Orders Only</span>
                </div>
                <p className="text-gray-500 font-mono text-[11px]">Email: seller@aasa.com</p>
                <p className="text-gray-500 font-mono text-[11px]">Password: seller123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
