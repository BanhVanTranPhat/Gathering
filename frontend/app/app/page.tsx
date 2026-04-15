import { createClient } from "@/utils/auth/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar/Navbar";
import RealmsMenu from "./RealmsMenu/RealmsMenu";
import { getVisitedRealms } from "@/utils/backend/getVisitedRealms";
import { serverRequest } from "@/utils/backend/serverRequest";

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

async function getDashboardSummary(
  accessToken: string,
  realmIds: string[],
): Promise<DashboardSummary | null> {
  const params = new URLSearchParams();
  if (realmIds.length) params.set("realmIds", realmIds.join(","));

  try {
    const { response, data } = await serverRequest(
      `/dashboard/summary?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );
    if (!response?.ok || !data || typeof data !== "object") return null;
    return data as DashboardSummary;
  } catch {
    return null;
  }
}

export default async function App() {
  const auth = await createClient();
  if (!auth?.auth) {
    return redirect("/signin");
  }

  const {
    data: { user },
  } = await auth.auth.getUser();
  const {
    data: { session },
  } = await auth.auth.getSession();

  if (!user || !session) {
    return redirect("/signin");
  }

  const realms: any = [];
  const { data: ownedRealms, error } = await auth
    .from("realms")
    .select("id, name, share_id, mapTemplate");
  if (ownedRealms) {
    realms.push(...ownedRealms);
  }
  if (session) {
    let { data: visitedRealms, error: visitedRealmsError } =
      await getVisitedRealms(session.access_token);
    if (visitedRealms) {
      visitedRealms = visitedRealms.map((realm) => ({
        ...realm,
        shared: true,
      }));
      realms.push(...visitedRealms);
    }
  }
  const errorMessage = error?.message || "";
  const realmIds = realms
    .map((realm: { id?: string }) => realm.id)
    .filter(
      (id: unknown): id is string => typeof id === "string" && id.length > 0,
    );
  const summary = await getDashboardSummary(session.access_token, realmIds);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-6">
        {summary && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.counts.events}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Library Resources</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.counts.resources}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Forum Topics</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.counts.threads}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Services</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.counts.services}
              </p>
            </div>
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Next Events
              </h3>
              <div className="space-y-2">
                {summary.upcomingEvents.length === 0 && (
                  <p className="text-xs text-gray-500">No upcoming events.</p>
                )}
                {summary.upcomingEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <p className="text-xs font-medium text-gray-800">
                      {event.title}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {new Date(event.startTime).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Library
              </h3>
              <div className="space-y-2">
                {summary.recentResources.length === 0 && (
                  <p className="text-xs text-gray-500">No library resources yet.</p>
                )}
                {summary.recentResources.slice(0, 4).map((resource) => (
                  <div
                    key={resource._id}
                    className="rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <p className="text-xs font-medium text-gray-800">
                      {resource.title}
                    </p>
                    <p className="text-[11px] text-gray-500 capitalize">
                      {resource.content_type || "resource"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Forum
              </h3>
              <div className="space-y-2">
                {summary.recentThreads.length === 0 && (
                  <p className="text-xs text-gray-500">No forum topics yet.</p>
                )}
                {summary.recentThreads.slice(0, 3).map((thread) => (
                  <div
                    key={thread._id}
                    className="rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <p className="text-xs font-medium text-gray-800">
                      {thread.title}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {thread.postCount || 0} replies
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <RealmsMenu realms={realms} errorMessage={errorMessage} />
      </div>
    </div>
  );
}
