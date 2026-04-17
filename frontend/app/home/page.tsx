import { getDashboardPage } from "@/app/dashboard/getDashboardPage";

export default async function HomePage() {
  return getDashboardPage("overview");
}
