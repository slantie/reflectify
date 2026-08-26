import { ProtectedWorkspace } from "@/components/protected-workspace"

export default function AcademicYearsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>
}
