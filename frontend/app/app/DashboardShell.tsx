"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDots,
  ChatsCircle,
  House,
  PlusCircle,
  SignOut,
  SquaresFour,
  UserCircle,
  Users,
  VideoCamera,
  X,
  Plus,
} from "@phosphor-icons/react";
import { useModal } from "@/app/hooks/useModal";
import RealmsMenu from "./RealmsMenu/RealmsMenu";
import AvatarSelection from "./avatar/AvatarSelection";
import { FEMALE_AVATAR_CONFIG, MALE_AVATAR_CONFIG } from "@/utils/avatarAssets";
import { createClient } from "@/utils/auth/client";

type DashboardSummary = {
  counts: {
    events: number;
    resources: number;
    threads: number;
    services: number;
  };
  upcomingEvents: Array<{ eventId: string; title: string; startTime: string }>;
  recentResources: Array<{ _id: string; title: string; content_type: string }>;
  recentThreads: Array<{ _id: string; title: string; postCount: number }>;
  featuredServices: Array<{ _id: string; title: string; category: string }>;
};

type Realm = {
  id: string;
  name: string;
  share_id?: string;
  shared?: boolean;
  mapTemplate?: string;
};
type MenuRealm = {
  id: string;
  name: string;
  share_id: string;
  shared?: boolean;
  mapTemplate?: string;
};

type EventItem = {
  eventId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  realmId?: string;
  realmName?: string;
};

type ThreadItem = {
  _id: string;
  title: string;
  body?: string;
  authorName?: string;
  postCount?: number;
  lastPostAt?: string;
  realmId?: string;
  canDelete?: boolean;
  canEdit?: boolean;
};

type DashboardShellProps = {
  summary: DashboardSummary | null;
  realms: Realm[];
  errorMessage: string;
  accessToken: string;
  displayName: string;
  email: string;
  avatar: string | null;
  gender: "male" | "female";
  initialTab?: TabName;
};

const TAB_OPTIONS = ["overview", "rooms", "events", "community", "profile"] as const;
type TabName = (typeof TAB_OPTIONS)[number];

function toTab(value: string | null): TabName {
  if (value && TAB_OPTIONS.includes(value as TabName)) return value as TabName;
  return "overview";
}

function formatDateLabel(dateLike?: string) {
  if (!dateLike) return "";
  return new Date(dateLike).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardShell({
  summary,
  realms,
  errorMessage,
  accessToken,
  displayName,
  email,
  avatar,
  gender,
  initialTab,
}: DashboardShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setModal } = useModal();
  const activeTab = initialTab || toTab(searchParams.get("tab"));

  const [selectedRealmId, setSelectedRealmId] = useState(realms[0]?.id ?? "");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [threadPosting, setThreadPosting] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [error, setError] = useState("");
  const [showCharacterEditor, setShowCharacterEditor] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(avatar || "");
  const [profileGender, setProfileGender] = useState<"male" | "female">(gender);
  const [profileSaving, setProfileSaving] = useState(false);
  const [forumScope, setForumScope] = useState("global");
  const [forumPostRealmId, setForumPostRealmId] = useState("global");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestEmails, setGuestEmails] = useState<string[]>([]);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "Tham gia bang The Gathering Metaverse (Video)",
  });
  const [showAccountActions, setShowAccountActions] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editThreadTitle, setEditThreadTitle] = useState("");
  const [editThreadBody, setEditThreadBody] = useState("");
  const [threadActionLoadingId, setThreadActionLoadingId] = useState<string | null>(null);
  const [eventSort, setEventSort] = useState<"newest" | "oldest">("newest");
  const [scheduleRealmId, setScheduleRealmId] = useState(realms[0]?.id ?? "");

  const selectedRealm = useMemo(
    () => realms.find((realm) => realm.id === scheduleRealmId),
    [realms, scheduleRealmId],
  );

  useEffect(() => {
    setAvatarSrc(avatar || "");
  }, [avatar]);
  useEffect(() => {
    setProfileGender(gender);
  }, [gender]);
  useEffect(() => {
    if (!scheduleRealmId && realms[0]?.id) {
      setScheduleRealmId(realms[0].id);
    }
  }, [scheduleRealmId, realms]);
  const menuRealms = useMemo<MenuRealm[]>(
    () =>
      realms.map((realm) => ({
        ...realm,
        share_id: realm.share_id || realm.id,
      })),
    [realms],
  );

  useEffect(() => {
    if (activeTab === "events") {
      void loadEvents();
    }
    if (activeTab === "community") {
      void loadThreads();
    }
  }, [activeTab, realms]);

  async function request(path: string, init?: RequestInit) {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((data as { message?: string })?.message || "Request failed");
    }
    return data as Record<string, any>;
  }

  async function loadEvents() {
    if (realms.length === 0) {
      setEvents([]);
      return;
    }
    setLoadingEvents(true);
    try {
      const eventGroups = await Promise.all(
        realms.map(async (realm) => {
          const data = await request(`/events?realmId=${realm.id}&page=1&limit=100`);
          return ((data.events || []) as EventItem[]).map((event) => ({
            ...event,
            realmName: realm.name,
          }));
        }),
      );
      setEvents(eventGroups.flat());
      setError("");
    } catch (eventError) {
      setError((eventError as Error).message);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function loadThreads() {
    setLoadingThreads(true);
    try {
      const realmQuery = forumScope === "global" ? "global" : forumScope;
      const data = await request(`/forum/threads?realmId=${realmQuery}&page=1`);
      setThreads((data.threads || []) as ThreadItem[]);
      setError("");
    } catch (threadError) {
      setError((threadError as Error).message);
    } finally {
      setLoadingThreads(false);
    }
  }

  async function submitThread() {
    const targetRealmId = forumPostRealmId || "global";
    if (!threadTitle.trim()) return;
    setThreadPosting(true);
    try {
      await request("/forum/threads", {
        method: "POST",
        body: JSON.stringify({
          realmId: targetRealmId,
          title: threadTitle.trim(),
          body: threadBody.trim(),
          authorName: displayName,
        }),
      });
      setThreadTitle("");
      setThreadBody("");
      await loadThreads();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setThreadPosting(false);
    }
  }

  async function submitSchedule() {
    if (!scheduleRealmId || !eventForm.title || !eventForm.startTime || !eventForm.endTime) {
      return;
    }
    setScheduleSaving(true);
    try {
      await request("/events", {
        method: "POST",
        body: JSON.stringify({
          realmId: scheduleRealmId,
          title: eventForm.title,
          description: eventForm.description,
          startTime: eventForm.startTime,
          endTime: eventForm.endTime,
          location: eventForm.location,
          createdByName: displayName,
          guestEmails,
        }),
      });
      setScheduleOpen(false);
      setEventForm({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "Tham gia bang The Gathering Metaverse (Video)",
      });
      setGuestEmail("");
      setGuestEmails([]);
      await loadEvents();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setScheduleSaving(false);
    }
  }

  function switchTab(tab: TabName) {
    if (pathname.startsWith("/home")) {
      const routeMap: Record<TabName, string> = {
        overview: "/home",
        rooms: "/home/rooms",
        events: "/home/events",
        community: "/home/forum",
        profile: "/home/profile",
      };
      router.push(routeMap[tab]);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
    if (tab === "events") void loadEvents();
    if (tab === "community") void loadThreads();
  }

  async function applyGender(nextGender: "male" | "female") {
    setProfileSaving(true);
    try {
      await request("/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          gender: nextGender,
          avatarConfig:
            nextGender === "female"
              ? { ...FEMALE_AVATAR_CONFIG }
              : { ...MALE_AVATAR_CONFIG },
        }),
      });
      setProfileGender(nextGender);
      router.refresh();
      setError("");
    } catch (genderError) {
      setError((genderError as Error).message);
    } finally {
      setProfileSaving(false);
    }
  }

  const fallbackAvatar = `https://api.dicebear.com/8.x/notionists/svg?seed=${displayName}`;

  function addGuestEmail() {
    const normalized = guestEmail.trim().toLowerCase();
    if (!normalized) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setError("Email khách mời không hợp lệ");
      return;
    }
    if (guestEmails.includes(normalized)) {
      setGuestEmail("");
      return;
    }
    setGuestEmails((prev) => [...prev, normalized]);
    setGuestEmail("");
    setError("");
  }

  async function handleSignOut() {
    const auth = createClient();
    await auth.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function deleteThread(threadId: string) {
    setThreadActionLoadingId(threadId);
    try {
      await request(`/forum/threads/${threadId}`, { method: "DELETE" });
      setThreads((prev) => prev.filter((item) => item._id !== threadId));
    } catch (threadError) {
      setError((threadError as Error).message);
    } finally {
      setThreadActionLoadingId(null);
    }
  }

  function beginEditThread(thread: ThreadItem) {
    setEditingThreadId(thread._id);
    setEditThreadTitle(thread.title || "");
    setEditThreadBody(thread.body || "");
  }

  function cancelEditThread() {
    setEditingThreadId(null);
    setEditThreadTitle("");
    setEditThreadBody("");
  }

  async function saveEditThread(threadId: string) {
    if (!editThreadTitle.trim()) return;
    setThreadActionLoadingId(threadId);
    try {
      await request(`/forum/threads/${threadId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editThreadTitle.trim(),
          body: editThreadBody.trim(),
        }),
      });
      setThreads((prev) =>
        prev.map((thread) =>
          thread._id === threadId
            ? { ...thread, title: editThreadTitle.trim(), body: editThreadBody.trim() }
            : thread,
        ),
      );
      cancelEditThread();
    } catch (threadError) {
      setError((threadError as Error).message);
    } finally {
      setThreadActionLoadingId(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f4f5f7] text-slate-900">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#09a79d] text-white font-bold grid place-items-center">
              G
            </div>
            <p className="font-semibold text-lg">The Gathering</p>
          </div>
        </div>

        <nav className="p-3 space-y-1 text-sm">
          {[
            { key: "overview", label: "Overview", icon: House },
            { key: "rooms", label: "My Rooms", icon: SquaresFour },
            { key: "events", label: "My Events", icon: CalendarDots },
            { key: "community", label: "Community", icon: ChatsCircle },
            { key: "profile", label: "Profile", icon: UserCircle },
          ].map((item) => {
            const isActive = activeTab === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => switchTab(item.key as TabName)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                  isActive
                    ? "bg-[#e8f8f6] text-[#0f9a8f] font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-4 space-y-3">
          <button
            onClick={() => setShowAccountActions((prev) => !prev)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left"
          >
            <div className="flex items-center gap-3">
              <img
                src={avatarSrc || fallbackAvatar}
                alt={displayName}
                className="h-10 w-10 rounded-full object-cover"
                onError={() => setAvatarSrc(fallbackAvatar)}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-slate-500">{email}</p>
              </div>
            </div>
          </button>
          {showAccountActions && (
            <button
              onClick={() => void handleSignOut()}
              className="w-full flex items-center gap-2 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-lg"
            >
              <SignOut size={18} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
          <h1 className="font-semibold text-slate-700 capitalize">{activeTab}</h1>
          <button
            onClick={() => {
              if (activeTab === "events") {
                setScheduleOpen(true);
                return;
              }
              setModal("Create Realm");
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#09a79d] px-4 py-2 text-white text-sm font-semibold hover:bg-[#0b978e]"
          >
            <PlusCircle size={16} />
            {activeTab === "events" ? "Lên lịch mới" : "Create Room"}
          </button>
        </header>

        <div className="p-6 max-w-6xl">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-4xl font-bold text-slate-900">
                  Welcome back, <span className="text-[#10a79d]">{displayName}</span>
                </h2>
                <p className="text-slate-500 mt-1">What&apos;s on your agenda today?</p>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf9f7] text-[#0fa59a]">
                    <VideoCamera size={18} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">Create New Meeting</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Start an instant session with a professional virtual room code.
                  </p>
                  <input
                    placeholder="Room Name (Optional)"
                    className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 outline-none"
                  />
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => setModal("Create Realm")}
                      className="rounded-lg bg-[#08a79d] px-6 py-2 text-sm font-semibold text-white hover:bg-[#089289]"
                    >
                      Start Instant
                    </button>
                    <button
                      onClick={() => setScheduleOpen(true)}
                      className="rounded-lg bg-[#eaf9f7] px-6 py-2 text-sm font-semibold text-[#0f9a8f] hover:bg-[#d7f1ee]"
                    >
                      Schedule
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Users size={18} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">Join with Code</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Have a code from a colleague? Enter it below to jump in.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <input
                      placeholder="abc-defg-hij"
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 outline-none"
                    />
                    <button
                      onClick={() => setModal("Join Realm")}
                      className="rounded-lg bg-slate-400 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-500"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className={`${showCharacterEditor ? "max-w-6xl" : "max-w-2xl"} rounded-2xl border border-slate-200 bg-white p-6`}>
              <h2 className="text-2xl font-semibold text-slate-900 mb-1">Profile</h2>
              <p className="text-sm text-slate-500 mb-6">
                Quản lý avatar tài khoản và avatar nhân vật của bạn.
              </p>
              <div className="flex items-center gap-3 mb-6">
                <img
                  src={avatarSrc || fallbackAvatar}
                  alt={displayName}
                  className="h-14 w-14 rounded-full object-cover border border-slate-200"
                  onError={() => setAvatarSrc(fallbackAvatar)}
                />
                <div>
                  <p className="font-semibold text-slate-900">{displayName}</p>
                  <p className="text-sm text-slate-500">{email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="w-full">
                  <p className="text-sm text-slate-600 mb-2">Giới tính</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={profileSaving}
                      onClick={() => void applyGender("male")}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold border ${
                        profileGender === "male"
                          ? "bg-[#eaf9f7] border-[#08a79d] text-[#0f9a8f]"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      } disabled:opacity-60`}
                    >
                      Nam
                    </button>
                    <button
                      type="button"
                      disabled={profileSaving}
                      onClick={() => void applyGender("female")}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold border ${
                        profileGender === "female"
                          ? "bg-[#eaf9f7] border-[#08a79d] text-[#0f9a8f]"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      } disabled:opacity-60`}
                    >
                      Nữ
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Đổi giới tính sẽ áp preset avatar mặc định tương ứng. Bạn vẫn có thể chỉnh thủ công.
                  </p>
                </div>
                <button
                  onClick={() => setModal("Avatar Picker")}
                  className="rounded-lg bg-[#08a79d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#089289]"
                >
                  Đổi avatar
                </button>
                <button
                  onClick={() => setShowCharacterEditor((prev) => !prev)}
                  className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {showCharacterEditor ? "Ẩn chỉnh avatar nhân vật" : "Đổi avatar nhân vật"}
                </button>
              </div>
              {showCharacterEditor && (
                <div className="mt-6 rounded-2xl overflow-visible">
                  <AvatarSelection
                    embedded
                    onSaved={() => {
                      setShowCharacterEditor(false);
                      router.refresh();
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "rooms" && (
            <RealmsMenu realms={menuRealms} errorMessage={errorMessage} />
          )}

          {activeTab === "events" && (
            <div className="space-y-4">
              <section className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold">Lịch Họp Của Bạn</h2>
                  <select
                    value={eventSort}
                    onChange={(event) =>
                      setEventSort(event.target.value === "oldest" ? "oldest" : "newest")
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="newest">Mới nhất trước</option>
                    <option value="oldest">Cũ nhất trước</option>
                  </select>
                </div>
                <button
                  onClick={() => void loadEvents()}
                  className="mb-3 text-sm text-[#0f9a8f] hover:underline"
                >
                  Refresh events
                </button>
                {realms.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Chưa có room khả dụng để hiển thị lịch.
                  </p>
                ) : loadingEvents ? (
                  <p className="text-sm text-slate-500">Đang tải sự kiện...</p>
                ) : events.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Bạn chưa có lịch họp hoặc sự kiện nào sắp diễn ra.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {events
                      .sort(
                        (a, b) =>
                          eventSort === "newest"
                            ? new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
                            : new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
                      )
                      .map((event) => (
                        <div
                          key={event.eventId}
                          className="rounded-xl border border-slate-200 p-3 bg-slate-50"
                        >
                          <p className="font-semibold">{event.title}</p>
                          <p className="text-xs text-slate-500">
                            {formatDateLabel(event.startTime)} - {formatDateLabel(event.endTime)}
                          </p>
                          {event.description && (
                            <p className="text-sm mt-1 text-slate-600">{event.description}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            Room: {event.realmName || event.realmId || "Không rõ"}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "community" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-semibold">Cộng Đồng</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={forumScope}
                    onChange={(event) => setForumScope(event.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="global">Diễn đàn chung</option>
                    {realms.map((realm) => (
                      <option key={realm.id} value={realm.id}>
                        {realm.name} (phòng)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => void loadThreads()}
                    className="text-sm text-[#0f9a8f] hover:underline"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 mb-4">
                <div className="mb-2">
                  <label className="text-xs text-slate-500">Đăng vào</label>
                  <select
                    value={forumPostRealmId}
                    onChange={(event) => setForumPostRealmId(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="global">Diễn đàn chung</option>
                    {realms.map((realm) => (
                      <option key={realm.id} value={realm.id}>
                        {realm.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  value={threadTitle}
                  onChange={(event) => setThreadTitle(event.target.value)}
                  placeholder="Bắt đầu một thread..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2"
                />
                <textarea
                  value={threadBody}
                  onChange={(event) => setThreadBody(event.target.value)}
                  rows={3}
                  placeholder="Nội dung (tùy chọn)"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => void submitThread()}
                    disabled={threadPosting || !threadTitle.trim()}
                    className="rounded-lg bg-[#9bded8] text-[#0f6f68] px-4 py-2 text-sm font-semibold disabled:opacity-60"
                  >
                    {threadPosting ? "Đang đăng..." : "Đăng"}
                  </button>
                </div>
              </div>

              {loadingThreads ? (
                <p className="text-sm text-slate-500">Đang tải bài viết...</p>
              ) : threads.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có bài viết nào. Hãy là người đầu tiên!</p>
              ) : (
                <div className="space-y-2">
                  {threads.map((thread) => (
                    <article key={thread._id} className="rounded-xl border border-slate-200 p-3">
                      {editingThreadId === thread._id ? (
                        <div className="space-y-2">
                          <input
                            value={editThreadTitle}
                            onChange={(event) => setEditThreadTitle(event.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                          <textarea
                            value={editThreadBody}
                            onChange={(event) => setEditThreadBody(event.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold">{thread.title}</h3>
                          {thread.body && <p className="text-sm text-slate-600 mt-1">{thread.body}</p>}
                        </>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {thread.authorName || "Ẩn danh"} • {thread.postCount || 0} replies
                      </p>
                      {thread.realmId && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          {thread.realmId === "global"
                            ? "Diễn đàn chung"
                            : `Phòng: ${
                                realms.find((realm) => realm.id === thread.realmId)?.name ||
                                thread.realmId
                              }`}
                        </p>
                      )}
                      {(thread.canEdit || thread.canDelete) && (
                        <div className="mt-3 flex items-center gap-2">
                          {thread.canEdit &&
                            (editingThreadId === thread._id ? (
                              <>
                                <button
                                  onClick={() => void saveEditThread(thread._id)}
                                  disabled={threadActionLoadingId === thread._id || !editThreadTitle.trim()}
                                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                                >
                                  Lưu
                                </button>
                                <button
                                  onClick={cancelEditThread}
                                  disabled={threadActionLoadingId === thread._id}
                                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-60"
                                >
                                  Hủy
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => beginEditThread(thread)}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                              >
                                Chỉnh sửa
                              </button>
                            ))}
                          {thread.canDelete && (
                            <button
                              onClick={() => void deleteThread(thread._id)}
                              disabled={threadActionLoadingId === thread._id}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-60"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {scheduleOpen && (
        <div className="fixed inset-0 z-40 bg-black/35 flex items-start justify-center pt-10 px-4">
          <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <button
                onClick={() => setScheduleOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
              <button
                onClick={() => void submitSchedule()}
                disabled={
                  scheduleSaving ||
                  !eventForm.title ||
                  !eventForm.startTime ||
                  !eventForm.endTime ||
                  !scheduleRealmId
                }
                className="rounded-lg bg-[#0c84ea] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {scheduleSaving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
            <div className="grid lg:grid-cols-[1fr_280px]">
              <div className="p-6 space-y-4">
                <input
                  value={eventForm.title}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Sự kiện Meta mới"
                  className="w-full border-b border-slate-300 px-1 py-2 text-4xl font-medium outline-none"
                />
                <div className="grid md:grid-cols-2 gap-3">
                  <select
                    value={scheduleRealmId}
                    onChange={(event) => setScheduleRealmId(event.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2"
                  >
                    {realms.length === 0 && <option value="">Chưa có phòng</option>}
                    {realms.map((realm) => (
                      <option key={realm.id} value={realm.id}>
                        {realm.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    value={eventForm.startTime}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, startTime: event.target.value }))
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    type="datetime-local"
                    value={eventForm.endTime}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, endTime: event.target.value }))
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div className="rounded-lg border border-slate-200 bg-[#eaf2ff] px-3 py-2 text-sm text-slate-700">
                  {eventForm.location}
                </div>
                <textarea
                  value={eventForm.description}
                  onChange={(event) =>
                    setEventForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Thêm nội dung mô tả hoặc liên kết tài liệu..."
                  rows={8}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <aside className="border-l border-slate-200 p-4 bg-slate-50">
                <p className="text-sm font-semibold mb-2">Khách</p>
                <div className="mb-3">
                  <div className="flex gap-2">
                    <input
                      value={guestEmail}
                      onChange={(event) => setGuestEmail(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addGuestEmail();
                        }
                      }}
                      placeholder="Thêm khách qua email"
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addGuestEmail}
                      className="rounded-lg border border-slate-300 bg-white px-3 text-slate-700 hover:bg-slate-100"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mb-4">
                  Danh sách ({guestEmails.length + 1})
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                  <img
                    src={avatarSrc || fallbackAvatar}
                    alt={displayName}
                    className="h-8 w-8 rounded-full"
                    onError={() => setAvatarSrc(fallbackAvatar)}
                  />
                  <div>
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-slate-500">Chủ tọa</p>
                  </div>
                </div>
                <div className="mt-2 space-y-2 max-h-44 overflow-auto">
                  {guestEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                    >
                      <span className="truncate">{email}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setGuestEmails((prev) => prev.filter((item) => item !== email))
                        }
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Realm: {selectedRealm?.name || "Chưa chọn room"}
                </p>
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* keep links preloaded for smooth tab switches */}
      <div className="hidden">
        <Link href="/app?tab=overview">Overview</Link>
      </div>
    </div>
  );
}
