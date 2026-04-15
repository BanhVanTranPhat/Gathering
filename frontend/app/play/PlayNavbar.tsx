"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Microphone,
  MicrophoneSlash,
  VideoCamera,
  VideoCameraSlash,
  CaretUp,
  SmileySticker,
  ChatCircleDots,
  SignOut,
  Monitor,
  Pencil,
  X,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import AvatarPreview from "@/components/AvatarPreview";
import { DEFAULT_AVATAR_CONFIG } from "@/utils/avatarAssets";
import signal from "@/utils/signal";
import { api } from "@/utils/backendApi";

type PlayNavbarProps = {
  username: string;
  skin: string;
  realmId?: string;
  shareId?: string;
  avatarConfig?: Record<string, string> | null;
  uid?: string;
};

type UserStatus = "active" | "busy" | "away";

const EMOJIS = ["👋", "❤️", "🎉", "👍", "🤣", "👏", "💯", "🔥"];

const STATUS_CONFIG: Record<UserStatus, { dotClass: string; label: string }> = {
  active: { dotClass: "bg-green-500", label: "Active" },
  busy: { dotClass: "bg-red-500", label: "Busy" },
  away: { dotClass: "bg-yellow-500", label: "Away" },
};

const PROFILE_COLOR_CLASSES = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-teal-500",
  "bg-blue-500",
  "bg-purple-700",
];

const PlayNavbar: React.FC<PlayNavbarProps> = ({
  username,
  skin,
  realmId,
  shareId,
  avatarConfig,
  uid,
}) => {
  const config =
    avatarConfig && Object.keys(avatarConfig).length > 0
      ? { ...DEFAULT_AVATAR_CONFIG, ...avatarConfig }
      : DEFAULT_AVATAR_CONFIG;
  const router = useRouter();

  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [status, setStatus] = useState<UserStatus>("active");
  const [statusMessage, setStatusMessage] = useState("");
  const [editName, setEditName] = useState(username);
  const [saving, setSaving] = useState(false);

  const emojiRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfilePopup(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    signal.emit("localMediaState", { micOn: next, camOn });
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    signal.emit("localMediaState", { micOn, camOn: next });
  };

  const handleEmoji = (emoji: string) => {
    signal.emit("sendEmoji", emoji);
    setShowEmojis(false);
  };

  const handleLeave = () => {
    router.push("/app");
  };

  const handleSaveProfile = useCallback(async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await api.patch("/profiles/me", { displayName: editName.trim() });
      setShowEditProfile(false);
    } catch {}
    setSaving(false);
  }, [editName]);

  return (
    <>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1">
        {/* Emoji reaction row */}
        {showEmojis && (
          <div
            ref={emojiRef}
            className="flex items-center gap-0.5 bg-[#252840]/95 backdrop-blur-sm rounded-2xl px-2 py-1.5 border border-[#3F4776]/60 shadow-xl toolbar-slide-up"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmoji(emoji)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Main toolbar */}
        <div className="flex items-center bg-[#252840]/95 backdrop-blur-sm rounded-[20px] border border-[#3F4776]/60 shadow-xl px-1.5 py-1 gap-0.5">
          {/* Avatar button with popup */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setShowProfilePopup(!showProfilePopup)}
              className="relative w-10 h-10 rounded-full hover:ring-2 hover:ring-[#6C72CB]/50 transition-all group flex-shrink-0"
              title={username}
            >
              <div className="w-10 h-10 rounded-full bg-[#6C72CB] flex items-center justify-center overflow-hidden">
                <AvatarPreview
                  avatarConfig={config}
                  size={36}
                  className="absolute bottom-0"
                />
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#252840] ${STATUS_CONFIG[status].dotClass}`}
              />
            </button>

            {/* Profile/Status popup */}
            {showProfilePopup && (
              <div className="absolute bottom-full mb-2 left-0 w-[260px] bg-[#1E2035] rounded-xl border border-[#3F4776]/60 shadow-2xl overflow-hidden toolbar-slide-up">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-[#6C72CB] flex items-center justify-center overflow-hidden">
                          <AvatarPreview
                            avatarConfig={config}
                            size={44}
                            className="absolute bottom-0"
                          />
                        </div>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1E2035] ${STATUS_CONFIG[status].dotClass}`}
                        />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {username}
                        </p>
                        <p className="text-[#8B8FA3] text-xs">
                          {STATUS_CONFIG[status].label}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(username);
                        setShowEditProfile(true);
                        setShowProfilePopup(false);
                      }}
                      className="p-1.5 rounded-lg text-[#8B8FA3] hover:text-white hover:bg-white/10 transition-all"
                      title="Edit profile"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status selector */}
                  <div className="flex items-center gap-2 mt-4 bg-[#252840] rounded-xl p-1">
                    {(Object.keys(STATUS_CONFIG) as UserStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          status === s
                            ? "bg-[#3F4776] text-white shadow-sm"
                            : "text-[#8B8FA3] hover:text-white"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dotClass}`}
                        />
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>

                  {/* Status message */}
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#252840] border border-[#3F4776]/40">
                    <SmileySticker className="w-4 h-4 text-[#8B8FA3] flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Update your status"
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white placeholder-[#6B7280] outline-none"
                      maxLength={80}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-[#3F4776]/50 mx-1" />

          {/* Mic button group */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleMic}
              className={`w-9 h-9 rounded-l-xl flex items-center justify-center transition-all ${
                micOn
                  ? "bg-white/10 text-white"
                  : "text-[#8B8FA3] hover:text-white hover:bg-white/5"
              }`}
              title={micOn ? "Mute microphone" : "Unmute microphone"}
            >
              {micOn ? (
                <Microphone className="w-5 h-5" weight="regular" />
              ) : (
                <MicrophoneSlash className="w-5 h-5" weight="regular" />
              )}
            </button>
            <button
              type="button"
              className="w-5 h-9 rounded-r-xl flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/5 transition-all border-l border-[#3F4776]/30"
              title="Microphone settings"
            >
              <CaretUp className="w-3 h-3" />
            </button>
          </div>

          {/* Camera button group */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleCam}
              className={`w-9 h-9 rounded-l-xl flex items-center justify-center transition-all ${
                camOn
                  ? "bg-white/10 text-white"
                  : "text-[#8B8FA3] hover:text-white hover:bg-white/5"
              }`}
              title={camOn ? "Turn off camera" : "Turn on camera"}
            >
              {camOn ? (
                <VideoCamera className="w-5 h-5" weight="regular" />
              ) : (
                <VideoCameraSlash className="w-5 h-5" weight="regular" />
              )}
            </button>
            <button
              type="button"
              className="w-5 h-9 rounded-r-xl flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/5 transition-all border-l border-[#3F4776]/30"
              title="Camera settings"
            >
              <CaretUp className="w-3 h-3" />
            </button>
          </div>

          {/* Screen share */}
          <button
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/10 transition-all"
            title="Share screen"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* Emoji button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                showEmojis
                  ? "bg-white/10 text-white"
                  : "text-[#8B8FA3] hover:text-white hover:bg-white/10"
              }`}
              title="Reactions"
            >
              <SmileySticker className="w-5 h-5" />
            </button>
          </div>

          {/* Nearby chat */}
          <button
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8B8FA3] hover:text-white hover:bg-white/10 transition-all"
            title="Nearby chat"
          >
            <ChatCircleDots className="w-5 h-5" weight="regular" />
          </button>

          <div className="w-px h-6 bg-[#3F4776]/50 mx-1 ml-auto" />

          {/* Leave button */}
          <button
            type="button"
            onClick={handleLeave}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
            title="Leave space"
          >
            <SignOut className="w-5 h-5" weight="regular" />
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowEditProfile(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[440px] mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit Profile
              </h2>
              <button
                type="button"
                onClick={() => setShowEditProfile(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                title="Close edit profile"
                aria-label="Close edit profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-center gap-10 mb-6">
                {/* Profile picture */}
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-gray-500 font-medium">
                    Profile picture
                  </p>
                  <div className="relative group">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white ${stringToColorClass(username)}`}
                    >
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <button
                      type="button"
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                      title="Edit profile picture"
                      aria-label="Edit profile picture"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-gray-500 font-medium">Avatar</p>
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      <AvatarPreview
                        avatarConfig={config}
                        size={72}
                        className="absolute bottom-0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const returnUrl = realmId
                          ? `/play/${realmId}${shareId ? `?shareId=${shareId}` : ""}`
                          : "/app";
                        router.push(
                          `/app/avatar?return=${encodeURIComponent(returnUrl)}`,
                        );
                      }}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                      title="Edit avatar"
                      aria-label="Edit avatar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Full name */}
              <div>
                <label
                  htmlFor="edit-full-name"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Full name<span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-full-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter full name"
                  title="Full name"
                  maxLength={100}
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end px-6 pb-5">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving || !editName.trim()}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function stringToColorClass(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return PROFILE_COLOR_CLASSES[Math.abs(hash) % PROFILE_COLOR_CLASSES.length];
}

export default PlayNavbar;
