import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.preference?.onboarded) redirect("/onboarding");
  return (
    <AppShell user={{ name: user.name ?? "Reader", role: user.role, darkMode: user.preference.darkMode }}>{children}</AppShell>
  );
}
