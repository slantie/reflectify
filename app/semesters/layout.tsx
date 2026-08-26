import { ProtectedWorkspace } from "@/components/protected-workspace"

export default function SemestersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>
}
