import { ProtectedWorkspace } from "@/components/protected-workspace"

export default function CollegesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>
}
