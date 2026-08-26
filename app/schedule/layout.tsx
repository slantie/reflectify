import { ProtectedWorkspace } from "@/components/protected-workspace"

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>
}
