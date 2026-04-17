"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Users } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { authGoogle } from "@/utils/backendApi";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const hasGoogleClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse?.credential) return;
    setGoogleLoading(true);
    setError("");
    try {
      const data = await authGoogle({ credential: credentialResponse.credential });
      const token = data.token;
      if (token && typeof document !== "undefined") {
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `gathering_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
      }
      router.push(data.user?.role === "admin" ? "/admin" : "/home");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Đăng nhập Google thất bại");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
            G
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            The Gathering
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-primary transition-colors">
            Features
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Community
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Resources
          </a>
        </div>
        <div className="min-w-[220px] flex justify-end">
          {hasGoogleClientId ? (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Đăng nhập Google thất bại")}
              theme="outline"
              size="medium"
              text="continue_with"
              shape="pill"
            />
          ) : (
            <Link
              href="/signin"
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32 grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8">
          <h1 className="text-6xl font-extrabold leading-tight text-slate-900">
            Virtual <span className="text-primary italic">workspace</span> for
            civilized teams.
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-[500px]">
            Enhance focus and connection with your colleagues in a minimalist,
            friendly 2D metaverse.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/signin"
              className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/10"
            >
              Join Beta <ArrowRight size={20} />
            </Link>
            <div className="text-slate-400 font-medium">or</div>
            <div className="min-w-[220px]">
              {hasGoogleClientId ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Đăng nhập Google thất bại")}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                />
              ) : (
                <Link
                  href="/signin"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Continue with Google
                </Link>
              )}
            </div>
          </div>
          {googleLoading && (
            <p className="text-sm text-slate-500 -mt-4">Đang đăng nhập với Google...</p>
          )}
          {error && <p className="text-sm text-rose-500 -mt-4">{error}</p>}

          <div className="flex items-center gap-4 text-sm text-slate-400">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 15}`}
                    alt="user"
                  />
                </div>
              ))}
            </div>
            <span>+50 people online right now</span>
          </div>
        </div>

        <div className="relative">
          <div className="bg-slate-100 rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden group border border-slate-200">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000"
              className="rounded-[2rem] shadow-sm w-full h-[450px] object-cover"
              alt="Workspace preview"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-100">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Users size={24} />
              </div>
              <div>
                <p className="font-bold text-lg text-slate-900 border-none">24 Events</p>
                <p className="text-slate-500 text-sm">Happening this week</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-12 border-t border-slate-100 text-slate-400 text-xs flex justify-between items-center relative z-10">
        <p>© 2026 The Gathering. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-600 transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-slate-600 transition-colors">
            Privacy
          </a>
        </div>
      </footer>
    </div>
  );
}
