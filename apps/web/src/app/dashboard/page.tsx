import { redirect } from "next/navigation";

import { getServerSession } from "@/modules/auth/auth-server";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session.user.name}</p>
      <Dashboard session={session} />
    </div>
  );
}
