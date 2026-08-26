import { redirect } from "next/navigation"

import { DashboardShell } from "@/components/dashboard-shell"
import { getCurrentAdmin } from "@/lib/auth/dal"

export async function ProtectedWorkspace({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/login")

  return <DashboardShell admin={admin}>{children}</DashboardShell>
}
