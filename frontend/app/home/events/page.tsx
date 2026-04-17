import { getDashboardPage } from "@/app/dashboard/getDashboardPage";

export default async function HomeEventsPage() {
  return getDashboardPage("events");
}
