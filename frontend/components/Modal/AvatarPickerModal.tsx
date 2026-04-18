"use client";

import { useEffect, useMemo, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { UserAvatarDisplay } from "../UserAvatarDisplay";
import { createClient } from "@/utils/auth/client";

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  profileColor?: string;
  displayName?: string;
  onSelect: (avatar: string) => Promise<void>;
}

export default function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar = "",
  profileColor,
  displayName,
  onSelect,
}: AvatarPickerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [onlineUrl, setOnlineUrl] = useState("");

  useEffect(() => {
    const auth = createClient();
    auth
      .from("profiles")
      .select("gender")
      .single()
      .then(({ data }: { data: { gender?: string } | null }) => {
        setGender(data?.gender === "female" ? "female" : "male");
      })
      .catch(() => {
        setGender("male");
      });
  }, []);

  const defaultAvatarByGender = useMemo(() => {
    const seed = encodeURIComponent(displayName || "user");
    const variant = gender === "female" ? "female" : "male";
    return `https://api.dicebear.com/8.x/notionists/svg?seed=${seed}-${variant}`;
  }, [displayName, gender]);

  const handleUseDefaultAvatar = async () => {
    setError(null);
    try {
      setSaving(true);
      await onSelect(defaultAvatarByGender);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Không thể cập nhật avatar.");
    } finally {
      setSaving(false);
    }
  };

  const handleUseOnlineUrl = async () => {
    const value = onlineUrl.trim();
    if (!value) {
      setError("Vui lòng nhập URL ảnh online.");
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      setError("URL không hợp lệ.");
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setError("Chỉ hỗ trợ URL bắt đầu bằng http hoặc https.");
      return;
    }
    setError(null);
    try {
      setSaving(true);
      await onSelect(value);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Không thể cập nhật avatar.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setOnlineUrl("");
    setError(null);
  };

  const handleGenderSwitch = async (nextGender: "male" | "female") => {
    setError(null);
    setGender(nextGender);
    try {
      const auth = createClient();
      const {
        data: { user },
      } = await auth.auth.getUser();
      if (!user?.id) return;
      await auth.from("profiles").update({ gender: nextGender }).eq("id", user.id);
    } catch {
      // Keep UI responsive even if gender persistence fails.
    }
  };

  const currentAvatarPreview = currentAvatar || defaultAvatarByGender;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Chọn avatar
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            title="Đóng hộp chọn avatar"
            aria-label="Đóng hộp chọn avatar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Avatar hiện tại:
        </p>
        <div className="flex justify-center mb-6">
          <UserAvatarDisplay
            avatar={currentAvatarPreview}
            profileColor={profileColor}
            displayName={displayName}
            size="lg"
          />
        </div>

        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Avatar mặc định theo giới tính
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => void handleGenderSwitch("male")}
            disabled={saving}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              gender === "male"
                ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20"
                : "border-gray-300 text-gray-700 dark:text-gray-300"
            }`}
          >
            Nam
          </button>
          <button
            type="button"
            onClick={() => void handleGenderSwitch("female")}
            disabled={saving}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              gender === "female"
                ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/20"
                : "border-gray-300 text-gray-700 dark:text-gray-300"
            }`}
          >
            Nữ
          </button>
        </div>
        <button
          type="button"
          onClick={handleUseDefaultAvatar}
          disabled={saving}
          className="w-full py-2.5 mb-6 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-500 transition disabled:opacity-60"
        >
          {saving
            ? "Đang lưu..."
            : `Dùng avatar mặc định (${gender === "female" ? "Nữ" : "Nam"})`}
        </button>

        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          URL ảnh online
        </p>
        <input
          type="url"
          value={onlineUrl}
          onChange={(e) => setOnlineUrl(e.target.value)}
          disabled={saving}
          placeholder="https://example.com/avatar.jpg"
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm mb-2 bg-white dark:bg-gray-900"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleUseOnlineUrl}
            disabled={saving}
            className="py-2.5 rounded-xl border border-teal-500 text-teal-600 font-semibold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition disabled:opacity-60"
          >
            Dùng URL này
          </button>
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={saving}
            className="py-2.5 rounded-xl border border-gray-300 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-60"
          >
            Xóa URL
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
