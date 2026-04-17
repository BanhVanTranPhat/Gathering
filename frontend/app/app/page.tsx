import { createClient } from "@/utils/auth/server";
import { redirect } from "next/navigation";
import { getVisitedRealms } from "@/utils/backend/getVisitedRealms";
import { serverRequest } from "@/utils/backend/serverRequest";
import DashboardShell from "./DashboardShell";
import { formatEmailToName } from "@/utils/formatEmailToName";

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
  const { data: profile } = await auth.from("profiles").select("avatar").single();

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
    <DashboardShell
      summary={summary}
      realms={realms}
      errorMessage={errorMessage}
      accessToken={session.access_token}
      displayName={formatEmailToName(
        user?.user_metadata?.email ?? user?.email ?? "",
      )}
      email={user?.email || ""}
      avatar={profile?.avatar || user?.user_metadata?.avatar_url || null}
    />
  );
}
