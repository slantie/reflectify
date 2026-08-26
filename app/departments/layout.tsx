import { ProtectedWorkspace } from "@/components/protected-workspace"

export default function DepartmentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>
}
