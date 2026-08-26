"use server"

import { compare } from "bcryptjs"
import { redirect } from "next/navigation"

import { createSession, deleteSession } from "@/lib/auth/session"
import type { LoginActionState } from "@/lib/auth/types"
import { loginSchema } from "@/lib/auth/validation"
import { prisma } from "@/lib/db"

// A valid bcrypt hash keeps unknown-email failures on the same expensive path
// as incorrect-password failures, avoiding an account-enumeration timing signal.
const LOGIN_TIMING_HASH =
  "$2b$12$bRLcW1ahAtIE/t7NDEAEDecJIgOzIIIGue564bCoRaTWMW6fzZ/dm"

export async function login(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  try {
    const admin = await prisma.admin.findFirst({
      where: { email: parsed.data.email, isDeleted: false },
      select: {
        id: true,
        designation: true,
        isSuper: true,
        password: true,
      },
    })
    const passwordMatches = await compare(
      parsed.data.password,
      admin?.password ?? LOGIN_TIMING_HASH
    )

    if (!admin || !passwordMatches) {
      return { error: "Invalid email or password." }
    }

    await createSession({
      adminId: admin.id,
      designation: admin.designation,
      isSuper: admin.isSuper,
    })
  } catch {
    return { error: "We could not sign you in. Please try again." }
  }

  redirect("/dashboard")
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}
