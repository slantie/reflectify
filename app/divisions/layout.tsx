import { ProtectedWorkspace } from "@/components/protected-workspace"

export default function DivisionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>
}
