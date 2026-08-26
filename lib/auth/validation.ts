import { z } from "zod"

import { ADMIN_DESIGNATIONS } from "@/lib/auth/types"

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  // Existing administrators may have passwords that predate a modern policy.
  // Preserve compatibility at login; enforce a stronger policy only for future
  // password creation or reset flows.
  password: z.string().min(1, "Enter your password."),
})

export const adminDesignationSchema = z.enum(ADMIN_DESIGNATIONS)
