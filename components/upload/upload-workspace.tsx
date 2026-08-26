"use client"

import { useState } from "react"
import {
  FileArrowUpIcon,
  GraduationCapIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react"
import { useDropzone } from "react-dropzone"

import { FacultyMatrixUpload } from "@/components/upload/faculty-matrix-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { referenceFiles } from "@/lib/upload/reference-files"

type AcademicYear = { id: string; yearString: string; isActive: boolean }
type Department = { id: string; name: string; abbreviation: string }

export function UploadWorkspace({
  academicYears,
  departments,
}: {
  academicYears: AcademicYear[]
  departments: Department[]
}) {
  return (
    <Tabs defaultValue="matrix" className="space-y-5">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted/70 p-1">
        <TabsTrigger value="matrix" className="gap-2 py-2.5">
          <FileArrowUpIcon className="size-4" />
          Faculty Matrix
        </TabsTrigger>
        <TabsTrigger value="data" className="gap-2 py-2.5">
          <GraduationCapIcon className="size-4" />
          Academic data
        </TabsTrigger>
      </TabsList>
      <TabsContent value="matrix">
        <Card className="shadow-sm">
          <CardContent className="p-5 md:p-6">
            <div className="mb-6">
              <p className="text-lg font-semibold">Faculty Matrix</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Analyse the timetable workbook before committing faculty
                allocations. Faculty and subjects should exist before
                continuing.
              </p>
            </div>
            <FacultyMatrixUpload
              academicYears={academicYears}
              departments={departments}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="data">
        <div className="grid gap-4 md:grid-cols-2">
          <SpreadsheetCard
            title="Faculty data"
            description="Faculty profiles and department assignments."
            icon={UsersThreeIcon}
            referenceUrl={referenceFiles.facultyData}
          />
          <SpreadsheetCard
            title="Subject data"
            description="Subject and course information by department semester."
            icon={GraduationCapIcon}
            referenceUrl={referenceFiles.subjectData}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}

function SpreadsheetCard({
  title,
  description,
  icon: Icon,
  referenceUrl,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string; weight?: "regular" | "fill" }>
  referenceUrl: string
}) {
  const [fileName, setFileName] = useState<string | null>(null)
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
    onDropAccepted: (files) => setFileName(files[0]?.name ?? null),
  })
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex justify-between gap-3">
          <div className="flex gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" weight="fill" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            render={<a href={referenceUrl} target="_blank" rel="noreferrer" />}
          >
            Download format
          </Button>
        </div>
        <div
          {...getRootProps()}
          className={`mt-5 rounded-xl border border-dashed p-5 text-center text-sm transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}
        >
          <Input {...getInputProps()} className="sr-only" />
          <FileArrowUpIcon className="mx-auto size-6 text-primary" />
          <p className="mt-2 font-medium">Drop .xlsx file or click to browse</p>
          {fileName && <p className="mt-2 truncate text-primary">{fileName}</p>}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Bulk import mapping will be enabled after the data templates are
          verified.
        </p>
      </CardContent>
    </Card>
  )
}
