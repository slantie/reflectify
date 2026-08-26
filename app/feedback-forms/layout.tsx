import { ProtectedWorkspace } from "@/components/protected-workspace"

export default function FeedbackFormsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedWorkspace>{children}</ProtectedWorkspace>
}
