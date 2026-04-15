"use client";

import { useState, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AVATAR_PRESETS } from "@/utils/avatarPresets";
import { UserAvatarDisplay } from "../UserAvatarDisplay";
import { api } from "@/utils/backendApi";

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  profileColor?: string;
  displayName?: string;
  onSelect: (avatar: string) => void;
}

export default function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar = "",
  profileColor,
  displayName,
  onSelect,
}: AvatarPickerModalProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

  const handlePresetClick = (presetId: string) => {
    setError(null);
    onSelect(presetId);
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP).");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await api.postForm<{ file?: { url?: string }; message?: string }>(
        "/api/uploads",
        formData,
      );
      const url = data?.file?.url;
      if (!url) throw new Error("Không nhận được URL ảnh");
      const fullUrl = url.startsWith("http") ? url : `${backendUrl}${url}`;
      onSelect(fullUrl);
      onClose();
    } catch (err: any) {
      if (err?.status === 408) {
        setError("Tải ảnh lên quá hạn. Vui lòng thử lại.");
      } else {
        setError(
          err?.message || "Tải ảnh lên thất bại. (Tính năng đang phát triển)",
        );
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

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
            avatar={currentAvatar}
            profileColor={profileColor}
            displayName={displayName}
            size="lg"
          />
        </div>

        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Avatar cơ bản
        </p>
        <div className="grid grid-cols-5 gap-2 mb-6">
          {AVATAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset.id)}
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center text-2xl transition-colors border-2 border-transparent hover:border-teal-500"
              title={preset.label}
            >
              {preset.emoji}
            </button>
          ))}
        </div>

        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Tải ảnh lên
        </p>
        <label htmlFor="avatar-upload-input" className="sr-only">
          Chọn ảnh avatar để tải lên
        </label>
        <input
          id="avatar-upload-input"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
          title="Chọn ảnh avatar"
          aria-label="Chọn ảnh avatar"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-teal-500 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors disabled:opacity-50"
        >
          {uploading ? "Đang tải lên…" : "Chọn ảnh từ máy"}
        </button>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
