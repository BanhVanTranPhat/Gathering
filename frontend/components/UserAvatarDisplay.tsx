'use client'

import {
  getPresetById,
  isAvatarImageUrl,
  isAvatarPreset,
} from "@/utils/avatarPresets";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

interface UserAvatarDisplayProps {
  avatar?: string;
  profileColor?: string;
  displayName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showRing?: boolean;
}

const sizeMap = { sm: "w-8 h-8 text-sm", md: "w-10 h-10 text-base", lg: "w-16 h-16 text-2xl" };

export function UserAvatarDisplay({
  avatar,
  profileColor = "#2db89e",
  displayName,
  size = "md",
  className = "",
  showRing = false,
}: UserAvatarDisplayProps) {
  const sizeClass = sizeMap[size];
  const initial = (displayName || "U").charAt(0).toUpperCase();

  const imageUrl =
    isAvatarImageUrl(avatar) && avatar
      ? avatar.startsWith("http")
        ? avatar
        : `${BACKEND_URL}${avatar}`
      : null;

  if (imageUrl) {
    return (
      <div
        className={`${sizeClass} rounded-full shrink-0 overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}
      >
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
        />
        {showRing && (
          <div className="absolute inset-0 rounded-full ring-2 ring-white ring-offset-2 pointer-events-none" />
        )}
      </div>
    );
  }

  const preset = avatar && isAvatarPreset(avatar) ? getPresetById(avatar) : null;
  if (preset) {
    return (
      <div
        className={`${sizeClass} rounded-full shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${className}`}
        title={preset.label}
      >
        <span className="leading-none">{preset.emoji}</span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full shrink-0 flex items-center justify-center text-white font-bold ${className}`}
      style={{ backgroundColor: profileColor }}
    >
      {initial}
    </div>
  );
}
