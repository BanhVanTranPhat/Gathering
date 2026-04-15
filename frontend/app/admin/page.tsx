"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/utils/backendApi";
import {
  Users,
  Globe,
  CalendarDays,
  BookOpen,
  MessageSquare,
  BarChart3,
  Shield,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  LogOut,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
);

type Stats = {
  totalUsers: number;
  newUsers30d: number;
  newUsers7d: number;
  totalRealms: number;
  totalEvents: number;
  totalResources: number;
  totalServices: number;
  totalThreads: number;
  totalPosts: number;
  totalMessages: number;
};

type Tab =
  | "overview"
  | "users"
  | "realms"
  | "events"
  | "resources"
  | "services"
  | "threads";

const CHART_COLORS = [
  "#6C72CB",
  "#E8596E",
  "#3ABAB4",
  "#F5A623",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];
const CHART_DOT_CLASSES = [
  "bg-indigo-400",
  "bg-rose-400",
  "bg-teal-400",
  "bg-amber-400",
  "bg-violet-400",
  "bg-pink-400",
  "bg-cyan-400",
  "bg-orange-400",
];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [usersTrend, setUsersTrend] = useState<
    { label: string; count: number }[]
  >([]);
  const [resourceDist, setResourceDist] = useState<
    { type: string; count: number }[]
  >([]);
  const [topOwners, setTopOwners] = useState<{ name: string; count: number }[]>(
    [],
  );
  const [forumActivity, setForumActivity] = useState<
    { label: string; threads: number; posts: number }[]
  >([]);

  // CRUD state
  const [users, setUsers] = useState<any[]>([]);
  const [realms, setRealms] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQ, setSearchQ] = useState("");
  const [tableLoading, setTableLoading] = useState(false);
  const [serviceStatusFilter, setServiceStatusFilter] = useState<
    "all" | "approved" | "pending"
  >("all");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.push("/signin");
      return;
    }
    api
      .get<any>("/auth/me")
      .then((me) => {
        if (me.role !== "admin") {
          router.push("/app");
          return;
        }
        setAuthorized(true);
      })
      .catch(() => router.push("/signin"))
      .finally(() => setLoading(false));
  }, []);

  const fetchOverview = useCallback(async () => {
    const [s, trend, dist, owners, forum] = await Promise.all([
      api.get<Stats>("/admin/stats"),
      api.get<{ months: any[] }>("/admin/stats/users-trend"),
      api.get<{ distribution: any[] }>("/admin/stats/resources-by-type"),
      api.get<{ owners: any[] }>("/admin/stats/realms-per-owner"),
      api.get<{ days: any[] }>("/admin/stats/forum-activity"),
    ]);
    setStats(s);
    setUsersTrend(trend.months || []);
    setResourceDist(dist.distribution || []);
    setTopOwners(owners.owners || []);
    setForumActivity(forum.days || []);
  }, []);

  useEffect(() => {
    if (authorized) fetchOverview();
  }, [authorized, fetchOverview]);

  const fetchTable = useCallback(
    async (t: Tab, page = 1) => {
      setTableLoading(true);
      try {
        if (t === "users") {
          const params = new URLSearchParams({ page: String(page) });
          if (searchQ) params.set("q", searchQ);
          const d = await api.get<any>(`/admin/users?${params}`);
          setUsers(d.users || []);
          setPagination(d.pagination);
        } else if (t === "realms") {
          const d = await api.get<any>(`/admin/realms?page=${page}`);
          setRealms(d.realms || []);
          setPagination(d.pagination);
        } else if (t === "events") {
          const d = await api.get<any>(`/admin/events?page=${page}`);
          setEvents(d.events || []);
          setPagination(d.pagination);
        } else if (t === "resources") {
          const d = await api.get<any>(`/admin/resources?page=${page}`);
          setResources(d.resources || []);
          setPagination(d.pagination);
        } else if (t === "services") {
          const params = new URLSearchParams({ page: String(page) });
          if (searchQ) params.set("q", searchQ);
          params.set("status", serviceStatusFilter);
          const d = await api.get<any>(`/admin/services?${params}`);
          setServices(d.services || []);
          setPagination(d.pagination);
        } else if (t === "threads") {
          const d = await api.get<any>(`/admin/threads?page=${page}`);
          setThreads(d.threads || []);
          setPagination(d.pagination);
        }
      } catch {}
      setTableLoading(false);
    },
    [searchQ, serviceStatusFilter],
  );

  useEffect(() => {
    if (authorized && tab !== "overview") fetchTable(tab);
  }, [authorized, tab, fetchTable]);

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa?")) return;
    try {
      await api.delete(`/admin/${type}/${id}`);
      fetchTable(tab as Tab);
      fetchOverview();
    } catch {}
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchTable("users");
    } catch {}
  };

  const handleServiceApproval = async (
    serviceId: string,
    isApproved: boolean,
  ) => {
    try {
      await api.patch(`/admin/services/${serviceId}/approval`, { isApproved });
      fetchTable("services");
      fetchOverview();
    } catch {}
  };

  const handleBulkServiceApproval = async (isApproved: boolean) => {
    if (!selectedServiceIds.length) return;
    try {
      await api.patch("/admin/services/bulk-approval", {
        ids: selectedServiceIds,
        isApproved,
      });
      setSelectedServiceIds([]);
      fetchTable("services");
      fetchOverview();
    } catch {}
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1021] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  if (!authorized) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Tổng quan",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "realms", label: "Spaces", icon: <Globe className="w-4 h-4" /> },
    {
      id: "events",
      label: "Events",
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: "resources",
      label: "Library",
      icon: <BookOpen className="w-4 h-4" />,
    },
    { id: "services", label: "Services", icon: <Globe className="w-4 h-4" /> },
    {
      id: "threads",
      label: "Forum",
      icon: <MessageSquare className="w-4 h-4" />,
    },
  ];

  const statCards = stats
    ? [
        {
          label: "Users",
          value: stats.totalUsers,
          sub: `+${stats.newUsers7d} tuần này`,
          icon: <Users className="w-5 h-5" />,
          color: "from-indigo-500 to-purple-600",
        },
        {
          label: "Spaces",
          value: stats.totalRealms,
          icon: <Globe className="w-5 h-5" />,
          color: "from-teal-500 to-cyan-600",
        },
        {
          label: "Events",
          value: stats.totalEvents,
          icon: <CalendarDays className="w-5 h-5" />,
          color: "from-amber-500 to-orange-600",
        },
        {
          label: "Resources",
          value: stats.totalResources,
          icon: <BookOpen className="w-5 h-5" />,
          color: "from-pink-500 to-rose-600",
        },
        {
          label: "Services",
          value: stats.totalServices,
          icon: <Globe className="w-5 h-5" />,
          color: "from-cyan-500 to-sky-600",
        },
        {
          label: "Topics",
          value: stats.totalThreads,
          sub: `${stats.totalPosts} replies`,
          icon: <MessageSquare className="w-5 h-5" />,
          color: "from-violet-500 to-fuchsia-600",
        },
        {
          label: "Messages",
          value: stats.totalMessages,
          icon: <MessageCircle className="w-5 h-5" />,
          color: "from-emerald-500 to-green-600",
        },
      ]
    : [];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-[#0f1021] text-white flex">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 bg-[#151729] border-r border-[#1e2140] flex flex-col">
        <div className="p-4 border-b border-[#1e2140]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Admin Panel</p>
              <p className="text-[10px] text-gray-500">The Gathering</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t.id ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#1e2140]">
          <button
            onClick={() => router.push("/app")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Back to App
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {tab === "overview" && (
            <>
              <h1 className="text-xl font-bold mb-6">Dashboard Overview</h1>

              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                {statCards.map((c) => (
                  <div
                    key={c.label}
                    className="bg-[#151729] rounded-xl border border-[#1e2140] p-4"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}
                    >
                      {c.icon}
                    </div>
                    <p className="text-2xl font-bold">{c.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {c.label}
                    </p>
                    {c.sub && (
                      <p className="text-[10px] text-emerald-400 mt-1">
                        {c.sub}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Charts row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* User registration trend */}
                <div className="bg-[#151729] rounded-xl border border-[#1e2140] p-5">
                  <h3 className="text-sm font-semibold mb-4">
                    User đăng ký (12 tháng)
                  </h3>
                  {usersTrend.length > 0 && (
                    <Bar
                      data={{
                        labels: usersTrend.map((m) => m.label),
                        datasets: [
                          {
                            label: "Users",
                            data: usersTrend.map((m) => m.count),
                            backgroundColor: "rgba(108,114,203,0.6)",
                            borderColor: "#6C72CB",
                            borderWidth: 1,
                            borderRadius: 4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: {
                            ticks: { color: "#6b7280", font: { size: 9 } },
                            grid: { display: false },
                          },
                          y: {
                            ticks: { color: "#6b7280", font: { size: 9 } },
                            grid: { color: "#1e2140" },
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  )}
                </div>

                {/* Resource distribution */}
                <div className="bg-[#151729] rounded-xl border border-[#1e2140] p-5">
                  <h3 className="text-sm font-semibold mb-4">
                    Phân bổ tài nguyên
                  </h3>
                  {resourceDist.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <div className="w-48 h-48">
                        <Doughnut
                          data={{
                            labels: resourceDist.map((d) => d.type),
                            datasets: [
                              {
                                data: resourceDist.map((d) => d.count),
                                backgroundColor: CHART_COLORS.slice(
                                  0,
                                  resourceDist.length,
                                ),
                                borderWidth: 0,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: { legend: { display: false } },
                            cutout: "60%",
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        {resourceDist.map((d, i) => (
                          <div
                            key={d.type}
                            className="flex items-center gap-2 text-xs"
                          >
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${CHART_DOT_CLASSES[i % CHART_DOT_CLASSES.length]}`}
                            />
                            <span className="text-gray-400 capitalize">
                              {d.type}
                            </span>
                            <span className="font-semibold text-white">
                              {d.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Chưa có dữ liệu</p>
                  )}
                </div>
              </div>

              {/* Charts row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top space owners */}
                <div className="bg-[#151729] rounded-xl border border-[#1e2140] p-5">
                  <h3 className="text-sm font-semibold mb-4">
                    Top Space Owners
                  </h3>
                  {topOwners.length > 0 ? (
                    <Bar
                      data={{
                        labels: topOwners.map((o) => o.name.slice(0, 15)),
                        datasets: [
                          {
                            label: "Spaces",
                            data: topOwners.map((o) => o.count),
                            backgroundColor: "rgba(58,186,180,0.6)",
                            borderColor: "#3ABAB4",
                            borderWidth: 1,
                            borderRadius: 4,
                          },
                        ],
                      }}
                      options={{
                        indexAxis: "y" as const,
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: {
                            ticks: { color: "#6b7280", font: { size: 9 } },
                            grid: { color: "#1e2140" },
                            beginAtZero: true,
                          },
                          y: {
                            ticks: { color: "#6b7280", font: { size: 9 } },
                            grid: { display: false },
                          },
                        },
                      }}
                    />
                  ) : (
                    <p className="text-xs text-gray-500">Chưa có dữ liệu</p>
                  )}
                </div>

                {/* Forum activity */}
                <div className="bg-[#151729] rounded-xl border border-[#1e2140] p-5">
                  <h3 className="text-sm font-semibold mb-4">
                    Forum Activity (30 ngày)
                  </h3>
                  {forumActivity.length > 0 && (
                    <Line
                      data={{
                        labels: forumActivity.map((d) => d.label),
                        datasets: [
                          {
                            label: "Topics",
                            data: forumActivity.map((d) => d.threads),
                            borderColor: "#8B5CF6",
                            backgroundColor: "rgba(139,92,246,0.1)",
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                          },
                          {
                            label: "Replies",
                            data: forumActivity.map((d) => d.posts),
                            borderColor: "#EC4899",
                            backgroundColor: "rgba(236,72,153,0.1)",
                            fill: true,
                            tension: 0.4,
                            pointRadius: 0,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            labels: { color: "#9ca3af", font: { size: 10 } },
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              color: "#6b7280",
                              font: { size: 8 },
                              maxRotation: 0,
                              autoSkip: true,
                              maxTicksLimit: 10,
                            },
                            grid: { display: false },
                          },
                          y: {
                            ticks: { color: "#6b7280", font: { size: 9 } },
                            grid: { color: "#1e2140" },
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Users Table ── */}
          {tab === "users" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">Users Management</h1>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchTable("users")}
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-[#151729] border border-[#1e2140] text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 w-48"
                  />
                </div>
              </div>
              <Table
                loading={tableLoading}
                columns={["Email", "Display Name", "Role", "Ngày tạo", ""]}
                rows={users.map((u) => [
                  u.email,
                  u.displayName || "—",
                  <select
                    key={u._id}
                    title="User role"
                    value={u.role || "user"}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="bg-[#0f1021] border border-[#1e2140] rounded text-[10px] px-1.5 py-0.5 text-white outline-none"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>,
                  u.createdAt ? formatDate(u.createdAt) : "—",
                  <button
                    key="del"
                    title="Delete user"
                    onClick={() => handleDelete("users", u._id)}
                    className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>,
                ])}
                pagination={pagination}
                onPage={(p) => fetchTable("users", p)}
              />
            </>
          )}

          {/* ── Realms Table ── */}
          {tab === "realms" && (
            <>
              <h1 className="text-xl font-bold mb-4">Spaces Management</h1>
              <Table
                loading={tableLoading}
                columns={["Name", "Owner ID", "Share ID", "Ngày tạo", ""]}
                rows={realms.map((r) => [
                  r.name,
                  <span key="o" className="font-mono text-[10px] text-gray-400">
                    {r.owner_id?.slice(0, 12)}...
                  </span>,
                  r.share_id || "—",
                  r.createdAt ? formatDate(r.createdAt) : "—",
                  <button
                    key="del"
                    title="Delete space"
                    onClick={() => handleDelete("realms", r._id)}
                    className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>,
                ])}
                pagination={pagination}
                onPage={(p) => fetchTable("realms", p)}
              />
            </>
          )}

          {/* ── Events Table ── */}
          {tab === "events" && (
            <>
              <h1 className="text-xl font-bold mb-4">Events Management</h1>
              <Table
                loading={tableLoading}
                columns={["Title", "Created By", "Start", "Attendees", ""]}
                rows={events.map((e) => [
                  e.title,
                  e.createdByName || "—",
                  e.startTime
                    ? new Date(e.startTime).toLocaleString("vi-VN")
                    : "—",
                  String(
                    e.attendees?.filter((a: any) => a.status === "going")
                      .length || 0,
                  ),
                  <button
                    key="del"
                    title="Delete event"
                    onClick={() => handleDelete("events", e.eventId)}
                    className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>,
                ])}
                pagination={pagination}
                onPage={(p) => fetchTable("events", p)}
              />
            </>
          )}

          {/* ── Resources Table ── */}
          {tab === "resources" && (
            <>
              <h1 className="text-xl font-bold mb-4">Library Management</h1>
              <Table
                loading={tableLoading}
                columns={["Title", "Type", "Author", "Ngày tạo", ""]}
                rows={resources.map((r) => [
                  r.title,
                  <span
                    key="t"
                    className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400"
                  >
                    {r.content_type}
                  </span>,
                  r.author || r.createdByName || "—",
                  r.createdAt ? formatDate(r.createdAt) : "—",
                  <button
                    key="del"
                    title="Delete resource"
                    onClick={() => handleDelete("resources", r._id)}
                    className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>,
                ])}
                pagination={pagination}
                onPage={(p) => fetchTable("resources", p)}
              />
            </>
          )}

          {/* ── Services Table ── */}
          {tab === "services" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">Services Moderation</h1>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && fetchTable("services")
                      }
                      className="pl-8 pr-3 py-1.5 rounded-lg bg-[#151729] border border-[#1e2140] text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 w-56"
                    />
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-[#1e2140] bg-[#151729] p-1">
                    {(["all", "pending", "approved"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setServiceStatusFilter(status);
                          setSelectedServiceIds([]);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-semibold capitalize ${serviceStatusFilter === status ? "bg-indigo-500/30 text-indigo-200" : "text-gray-400 hover:text-white"}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] text-gray-400">
                  {selectedServiceIds.length} selected
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkServiceApproval(true)}
                    disabled={!selectedServiceIds.length}
                    className="px-2.5 py-1 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 disabled:opacity-40"
                  >
                    Approve Selected
                  </button>
                  <button
                    onClick={() => handleBulkServiceApproval(false)}
                    disabled={!selectedServiceIds.length}
                    className="px-2.5 py-1 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 disabled:opacity-40"
                  >
                    Mark Pending
                  </button>
                </div>
              </div>
              <Table
                loading={tableLoading}
                columns={["Title", "Category", "Owner", "Approved", ""]}
                rows={services.map((s) => [
                  <div key="title" className="flex items-center gap-2">
                    <input
                      title="Select service"
                      type="checkbox"
                      checked={selectedServiceIds.includes(s._id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedServiceIds((prev) =>
                          checked
                            ? [...prev, s._id]
                            : prev.filter((id) => id !== s._id),
                        );
                      }}
                    />
                    <span>{s.title}</span>
                  </div>,
                  <span
                    key="c"
                    className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300"
                  >
                    {s.category}
                  </span>,
                  s.createdByName || "—",
                  <button
                    key="a"
                    onClick={() => handleServiceApproval(s._id, !s.isApproved)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold ${s.isApproved ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}
                  >
                    {s.isApproved ? "Approved" : "Pending"}
                  </button>,
                  <button
                    key="del"
                    title="Delete service"
                    onClick={() => handleDelete("services", s._id)}
                    className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>,
                ])}
                pagination={pagination}
                onPage={(p) => fetchTable("services", p)}
              />
            </>
          )}

          {/* ── Threads Table ── */}
          {tab === "threads" && (
            <>
              <h1 className="text-xl font-bold mb-4">Forum Management</h1>
              <Table
                loading={tableLoading}
                columns={["Title", "Author", "Posts", "Last Activity", ""]}
                rows={threads.map((t) => [
                  t.title,
                  t.authorName || "—",
                  String(t.postCount || 0),
                  t.lastPostAt ? formatDate(t.lastPostAt) : "—",
                  <button
                    key="del"
                    title="Delete thread"
                    onClick={() => handleDelete("threads", t._id)}
                    className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>,
                ])}
                pagination={pagination}
                onPage={(p) => fetchTable("threads", p)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Table({
  loading,
  columns,
  rows,
  pagination,
  onPage,
}: {
  loading: boolean;
  columns: string[];
  rows: React.ReactNode[][];
  pagination: { page: number; pages: number; total: number };
  onPage: (p: number) => void;
}) {
  return (
    <div className="bg-[#151729] rounded-xl border border-[#1e2140] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e2140]">
              {columns.map((c) => (
                <th
                  key={c}
                  className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10">
                  <RefreshCw className="w-5 h-5 text-gray-500 animate-spin mx-auto" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-10 text-gray-500 text-xs"
                >
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[#1e2140]/50 hover:bg-white/[0.02] transition-colors"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-gray-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#1e2140]">
          <p className="text-[10px] text-gray-500">
            {pagination.total} kết quả
          </p>
          <div className="flex items-center gap-1">
            <button
              title="Previous page"
              onClick={() => onPage(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="p-1 rounded hover:bg-white/5 text-gray-500 disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-gray-400 px-2">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              title="Next page"
              onClick={() =>
                onPage(Math.min(pagination.pages, pagination.page + 1))
              }
              disabled={pagination.page >= pagination.pages}
              className="p-1 rounded hover:bg-white/5 text-gray-500 disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
