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
} from "@phosphor-icons/react";
import { useModal } from "@/app/hooks/useModal";
import RealmsMenu from "./RealmsMenu/RealmsMenu";

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
};

type ThreadItem = {
  _id: string;
  title: string;
  body?: string;
  authorName?: string;
  postCount?: number;
  lastPostAt?: string;
};

type DashboardShellProps = {
  summary: DashboardSummary | null;
  realms: Realm[];
  errorMessage: string;
  accessToken: string;
  displayName: string;
  email: string;
  avatar: string | null;
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
}: DashboardShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setModal } = useModal();
  const activeTab = toTab(searchParams.get("tab"));

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
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "Tham gia bang The Gathering Metaverse (Video)",
  });

  const selectedRealm = useMemo(
    () => realms.find((realm) => realm.id === selectedRealmId),
    [realms, selectedRealmId],
  );
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
  }, [activeTab, selectedRealmId]);

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
    if (!selectedRealmId) return;
    setLoadingEvents(true);
    try {
      const now = new Date();
      const data = await request(
        `/events?realmId=${selectedRealmId}&month=${now.getMonth()}&year=${now.getFullYear()}`,
      );
      setEvents((data.events || []) as EventItem[]);
      setError("");
    } catch (eventError) {
      setError((eventError as Error).message);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function loadThreads() {
    if (!selectedRealmId) return;
    setLoadingThreads(true);
    try {
      const data = await request(`/forum/threads?realmId=${selectedRealmId}&page=1`);
      setThreads((data.threads || []) as ThreadItem[]);
      setError("");
    } catch (threadError) {
      setError((threadError as Error).message);
    } finally {
      setLoadingThreads(false);
    }
  }

  async function submitThread() {
    if (!selectedRealmId || !threadTitle.trim()) return;
    setThreadPosting(true);
    try {
      await request("/forum/threads", {
        method: "POST",
        body: JSON.stringify({
          realmId: selectedRealmId,
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
    if (!selectedRealmId || !eventForm.title || !eventForm.startTime || !eventForm.endTime) {
      return;
    }
    setScheduleSaving(true);
    try {
      await request("/events", {
        method: "POST",
        body: JSON.stringify({
          realmId: selectedRealmId,
          title: eventForm.title,
          description: eventForm.description,
          startTime: eventForm.startTime,
          endTime: eventForm.endTime,
          location: eventForm.location,
          createdByName: displayName,
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
      await loadEvents();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setScheduleSaving(false);
    }
  }

  function switchTab(tab: TabName) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
    if (tab === "events") void loadEvents();
    if (tab === "community") void loadThreads();
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
            onClick={() => setModal("Account Dropdown")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left"
          >
            <div className="flex items-center gap-3">
              <img
                src={avatar || `https://api.dicebear.com/8.x/notionists/svg?seed=${displayName}`}
                alt={displayName}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-slate-500">{email}</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setModal("Account Dropdown")}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-lg"
          >
            <SignOut size={18} />
            <span>Sign Out</span>
          </button>
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

          {(activeTab === "overview" || activeTab === "profile") && (
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
                  <button
                    onClick={() => setModal("Create Realm")}
                    className="mt-5 rounded-lg bg-[#08a79d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#089289]"
                  >
                    Start Instant
                  </button>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Users size={18} />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">Join with Code</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Have a code from a colleague? Enter it below to jump in.
                  </p>
                  <button
                    onClick={() => setModal("Join Realm")}
                    className="mt-5 rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Join
                  </button>
                </div>
              </div>

              {summary && (
                <div className="grid md:grid-cols-4 gap-3">
                  <StatCard label="Events" value={summary.counts.events} />
                  <StatCard label="Resources" value={summary.counts.resources} />
                  <StatCard label="Forum Topics" value={summary.counts.threads} />
                  <StatCard label="Services" value={summary.counts.services} />
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
                    value={selectedRealmId}
                    onChange={(event) => setSelectedRealmId(event.target.value)}
                    disabled={realms.length === 0}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {realms.length === 0 && <option value="">No rooms available</option>}
                    {realms.map((realm) => (
                      <option key={realm.id} value={realm.id}>
                        {realm.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => void loadEvents()}
                  className="mb-3 text-sm text-[#0f9a8f] hover:underline"
                >
                  Refresh events
                </button>
                {!selectedRealmId ? (
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
                          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
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
                    value={selectedRealmId}
                    onChange={(event) => setSelectedRealmId(event.target.value)}
                    disabled={realms.length === 0}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {realms.length === 0 && <option value="">No rooms available</option>}
                    {realms.map((realm) => (
                      <option key={realm.id} value={realm.id}>
                        {realm.name}
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

              {!selectedRealmId ? (
                <p className="text-sm text-slate-500">
                  Chưa có room khả dụng để hiển thị cộng đồng.
                </p>
              ) : loadingThreads ? (
                <p className="text-sm text-slate-500">Đang tải bài viết...</p>
              ) : threads.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có bài viết nào. Hãy là người đầu tiên!</p>
              ) : (
                <div className="space-y-2">
                  {threads.map((thread) => (
                    <article key={thread._id} className="rounded-xl border border-slate-200 p-3">
                      <h3 className="font-semibold">{thread.title}</h3>
                      {thread.body && <p className="text-sm text-slate-600 mt-1">{thread.body}</p>}
                      <p className="text-xs text-slate-500 mt-1">
                        {thread.authorName || "Ẩn danh"} • {thread.postCount || 0} replies
                      </p>
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
                  !selectedRealm
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
                <p className="text-xs text-slate-600 mb-4">Danh sách (1)</p>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                  <img
                    src={avatar || `https://api.dicebear.com/8.x/notionists/svg?seed=${displayName}`}
                    alt={displayName}
                    className="h-8 w-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-slate-500">Chủ tọa</p>
                  </div>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </article>
  );
}
