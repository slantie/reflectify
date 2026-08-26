"use server"

import { z } from "zod"

import { deliverContactMessage } from "@/lib/email"

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(320),
  subject: z.string().trim().min(3, "Enter a subject.").max(180),
  message: z
    .string()
    .trim()
    .min(10, "Add at least 10 characters to your message.")
    .max(4_000),
  website: z.string().max(0).optional(),
})

export type ContactState = {
  error?: string
  success?: string
  fieldErrors?: Partial<Record<keyof z.input<typeof contactSchema>, string[]>>
}

export async function submitContactMessage(
  _previousState: ContactState,
  formData: FormData
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: formData.get("website") || undefined,
  })
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    await deliverContactMessage(parsed.data)
    return {
      success: "Your message has been sent. We will get back to you soon.",
    }
  } catch (error) {
    console.error("Unable to send contact message", error)
    return {
      error:
        "We could not send your message right now. Please email feedback_ce@ldrp.ac.in directly.",
    }
  }
}
