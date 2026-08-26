import "server-only"

import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

import { adminDesignationSchema } from "@/lib/auth/validation"
import type { AdminDesignation, AdminSession } from "@/lib/auth/types"

const SESSION_COOKIE_NAME = "reflectify_session"
const SESSION_TTL_SECONDS = 60 * 60 * 8

function getSessionKey() {
  const secret = process.env.AUTH_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must be set to a secure value of at least 32 characters.")
  }

  return new TextEncoder().encode(secret)
}

function parseSessionPayload(payload: Record<string, unknown>): AdminSession | null {
  if (typeof payload.sub !== "string" || typeof payload.isSuper !== "boolean") return null
  const designation = adminDesignationSchema.safeParse(payload.designation)
  if (!designation.success) return null

  return { adminId: payload.sub, designation: designation.data, isSuper: payload.isSuper }
}

export async function createSession(session: AdminSession) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)
  const token = await new SignJWT({ designation: session.designation, isSuper: session.isSuper })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(session.adminId)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSessionKey())

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export async function getSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSessionKey(), { algorithms: ["HS256"] })
    return parseSessionPayload(payload)
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export function isAuthorized(session: AdminSession, allowedDesignations: readonly AdminDesignation[]) {
  return session.isSuper || allowedDesignations.includes(session.designation)
}
