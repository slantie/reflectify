import Image from "next/image"

import { cn } from "@/lib/utils"

export function ReflectifyMark({ className }: { className?: string }) {
  return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <Image
          src="/reflectify-logo.svg"
          alt="Reflectify"
          width={36}
          height={36}
          priority
          className="size-9 shrink-0"
        />
        <span className="text-lg font-semibold tracking-tight">Reflectify</span>
      </div>
  )
}
