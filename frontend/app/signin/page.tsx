"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { Mail, ArrowRight, RefreshCw, ArrowLeft } from "lucide-react";
import { authGoogle, authSendOtp, authVerifyOtp } from "@/utils/backendApi";

type Stage = "welcome" | "otp";

export default function SignIn() {
  const hasGoogleClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("welcome");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [displayName, setDisplayName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Email không hợp lệ");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await authSendOtp(trimmed);
      setIsNewUser(data.isNewUser);
      setStage("otp");
      setCountdown(60);
      setOtpCode(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err?.message || "Gửi mã thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    setError("");

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const newOtp = [...otpCode];
    for (let i = 0; i < text.length; i++) newOtp[i] = text[i];
    setOtpCode(newOtp);
    const nextIndex = Math.min(text.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) {
      setError("Vui lòng nhập đủ 6 số");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await authVerifyOtp(
        email,
        code,
        isNewUser ? displayName : undefined,
      );
      const token = data.token;
      if (token && typeof document !== "undefined") {
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `gathering_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
      }
      router.push(data.user?.role === "admin" ? "/admin" : "/app");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Xác thực thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    if (!credentialResponse?.credential) return;
    setError("");
    setLoading(true);
    try {
      const data = await authGoogle({
        credential: credentialResponse.credential,
      });
      const token = data.token;
      if (token && typeof document !== "undefined") {
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `gathering_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
      }
      router.push(data.user?.role === "admin" ? "/admin" : "/app");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-xl border bg-[#1E2035] text-white text-sm outline-none transition-all placeholder-gray-500 border-[#3F4776] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20`;

  return (
    <div className="w-full max-w-sm mx-auto">
      {stage === "welcome" && (
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Chào mừng</h1>
          <p className="text-sm text-gray-400 mb-8">
            Nhập email để đăng nhập hoặc tạo tài khoản mới
          </p>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="email"
                autoFocus
                autoComplete="email"
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border bg-[#1E2035] text-white text-sm outline-none transition-all placeholder-gray-500 ${
                  error
                    ? "border-red-400 focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                    : "border-[#3F4776] focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                }`}
              />
            </div>
            {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
          </div>

          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-teal-900/30"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Nhận mã xác thực <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#2D3054]" />
            <span className="text-xs text-gray-500">hoặc</span>
            <div className="flex-1 h-px bg-[#2D3054]" />
          </div>

          <div className="flex justify-center">
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
              <p className="text-xs text-gray-500">
                Google Login chưa cấu hình `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
              </p>
            )}
          </div>
        </div>
      )}

      {stage === "otp" && (
        <div>
          <button
            onClick={() => {
              setStage("welcome");
              setError("");
              setOtpCode(["", "", "", "", "", ""]);
            }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-400 mb-6 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Quay lại
          </button>

          <h1 className="text-2xl font-bold text-white mb-1">
            Nhập mã xác thực
          </h1>
          <p className="text-sm text-gray-400 mb-2">
            Mã 6 số đã gửi đến{" "}
            <span className="font-medium text-white">{email}</span>
          </p>
          {isNewUser && (
            <p className="text-xs text-teal-400 bg-teal-900/30 px-3 py-1.5 rounded-lg mb-4">
              Email chưa có tài khoản — sẽ tự động tạo mới sau khi xác thực
            </p>
          )}

          {isNewUser && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Tên hiển thị (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Tên của bạn"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div
            className="flex justify-center gap-2 mb-4"
            onPaste={handleOtpPaste}
          >
            {otpCode.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                title={`OTP digit ${i + 1}`}
                aria-label={`OTP digit ${i + 1}`}
                className={`w-11 h-12 text-center text-lg font-bold rounded-xl border outline-none transition-all bg-[#1E2035] text-white focus:ring-2 ${
                  error
                    ? "border-red-400 focus:ring-red-500/30"
                    : "border-[#3F4776] focus:border-teal-500 focus:ring-teal-500/20"
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center mb-3">{error}</p>
          )}

          <button
            onClick={handleVerifyOtp}
            disabled={loading || otpCode.join("").length !== 6}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-teal-900/30 mb-4"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "Xác thực"
            )}
          </button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-xs text-gray-500">
                Gửi lại mã sau {countdown}s
              </p>
            ) : (
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                Gửi lại mã xác thực
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
