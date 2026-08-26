import { redirect } from "next/navigation"
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr"

import { UploadWorkspace } from "@/components/upload/upload-workspace"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCurrentAdmin } from "@/lib/auth/dal"
import { prisma } from "@/lib/db"

export default async function UploadPage() {
  const [admin, academicYears, departments] = await Promise.all([
    getCurrentAdmin(),
    prisma.academicYear.findMany({
      where: { isDeleted: false },
      select: { id: true, yearString: true, isActive: true },
      orderBy: { yearString: "desc" },
    }),
    prisma.department.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, abbreviation: true },
      orderBy: { name: "asc" },
    }),
  ])
  if (!admin) redirect("/login")
  const canUpload = admin.isSuper
  return (
    <div className="space-y-5 md:space-y-6">
      <div className="border-b pb-6">
        <p className="text-sm font-medium text-primary">Data management</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
          Upload data
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Validate Faculty Matrix and academic Excel files before they become
          part of the feedback workspace.
        </p>
      </div>
      {canUpload ? (
        <UploadWorkspace
          academicYears={academicYears}
          departments={departments}
        />
      ) : (
        <Alert>
          <ShieldCheckIcon weight="fill" />
          <AlertTitle>Super Admin access required</AlertTitle>
          <AlertDescription>
            Only Super Admins can upload and analyse institutional data files.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
