import { ProtectedWorkspace } from "@/components/protected-workspace"

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>
}
