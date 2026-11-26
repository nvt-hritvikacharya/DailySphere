import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminStats } from "@/lib/services/admin";
import { AdminDashboard } from "./admin-dashboard";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (user?.role !== "ADMIN") redirect("/");
  const stats = await getAdminStats();
  return <AdminDashboard stats={JSON.parse(JSON.stringify(stats))} />;
}
