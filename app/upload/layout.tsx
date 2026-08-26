import { ProtectedWorkspace } from "@/components/protected-workspace"

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>
}
