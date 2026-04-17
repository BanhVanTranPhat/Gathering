import { getDashboardPage } from "@/app/dashboard/getDashboardPage";

export default async function HomeRoomsPage() {
  return getDashboardPage("rooms");
}
