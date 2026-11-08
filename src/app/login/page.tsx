"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { signInManagerWithSupabase } from "@/lib/supabase";

export default function DashboardLoginPage() {
  const router = useRouter();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter email and password.");
      return;
    }
    setLoginError("");
    setIsAuthenticating(true);

    const { user, session, error } = await signInManagerWithSupabase(loginEmail, loginPassword);
    setIsAuthenticating(false);

    if (error) {
      setLoginError(error);
      return;
    }

    if (user) {
      const email = user.email || loginEmail;
      const name = String(user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0]);
      localStorage.setItem("ikfoods_dashboard_authenticated", "true");
      localStorage.setItem("ikfoods_user_email", email);
      localStorage.setItem("ikfoods_user_name", name);
      localStorage.setItem("ikfoods_user_role", String(user.user_metadata?.role || "Manager"));
      if (session?.access_token) {
        localStorage.setItem("ikfoods_access_token", session.access_token);
      }
      router.push("/dashboard");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full bg-white text-forest-950 font-sans antialiased">
      
      {/* LEFT SIDE: FULL-BLEED IMAGE */}
      <div className="relative hidden min-h-screen w-full overflow-hidden bg-forest-900 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Natural-Vanilla-Store-Vanilla-Extract-Sugar-Free-Keto-and-Vanilla-Sugar-Range.jpg.webp"
          alt="Bottles of pure vanilla extract and vanilla sugar with vanilla beans"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-forest-950/70 to-transparent" />
        <div className="relative p-14">
          <Logo tone="light" size="lg" />
        </div>
      </div>

      {/* RIGHT SIDE: CLEAN MINIMALIST WHITE LOGIN FORM (Matching Reference Image) */}
      <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-20 max-w-lg mx-auto w-full min-h-screen">
        
      

        {/* Center Form Area */}
        <div className="my-auto py-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-forest-950 tracking-tight">
              Staff login
            </h1>
            <p className="text-sm text-[#52525b] font-medium">
              Sign in to manage products, orders and categories.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            
           

            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-forest-950 block">
                Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full h-12 rounded-xl border border-neutral-300 bg-white px-4 text-xs text-forest-950 placeholder:text-neutral-400 outline-none focus:border-forest-700 focus:ring-1 focus:ring-forest-700 transition"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-forest-950 block">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-neutral-400 font-medium hover:underline"
                >
                  Forgot password
                </button>
              </div>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-12 rounded-xl border border-neutral-300 bg-white px-4 text-xs text-forest-950 placeholder:text-neutral-400 outline-none focus:border-forest-700 focus:ring-1 focus:ring-forest-700 transition"
              />
            </div>

            {loginError && (
              <p className="text-xs font-semibold text-red-600">{loginError}</p>
            )}

            {/* Log in Primary Action Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full rounded-xl bg-secondary hover:bg-secondary-dark py-3.5 text-xs font-bold uppercase tracking-wider text-forest-950 transition shadow-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-60"
            >
              {isAuthenticating ? "Waiting..." : "Log in"}
            </button>
          </form>
        </div>

        {/* Bottom Footer Navigation */}
        <div className="pt-4 border-t border-neutral-200 flex items-center justify-between text-xs">
          <Link
            href="/"
            className="font-semibold text-neutral-500 hover:text-forest-950 transition inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back to Storefront
          </Link>
          <span className="text-neutral-400 font-medium">Dashboard Access</span>
        </div>

      </div>

    </div>
  );
}

