import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata = { title: "Pick your interests" };

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <OnboardingFlow initial={user.preference?.interests ?? []} name={user.name ?? ""} />;
}
