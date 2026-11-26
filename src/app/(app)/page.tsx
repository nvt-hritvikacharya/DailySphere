import { getSessionUser } from "@/lib/auth/session";
import { HomeView } from "./home-view";

export default async function HomePage() {
  const user = await getSessionUser();
  return <HomeView name={user?.name ?? "Reader"} />;
}
