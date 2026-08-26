import "server-only"

import path from "node:path"
import nodemailer from "nodemailer"

type FeedbackInvitation = {
  to: string
  recipientName: string
  formTitle: string
  departmentName: string
  semesterNumber: number
  divisionName: string
  closesOn: Date
  feedbackUrl: string
}

type ContactMessage = {
  name: string
  email: string
  subject: string
  message: string
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }
    return entities[character] ?? character
  })
}

function emailConfiguration() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM ?? user
  const fromName = process.env.SMTP_FROM_NAME ?? "Reflectify"

  if (
    !host ||
    !Number.isInteger(port) ||
    port <= 0 ||
    !user ||
    !pass ||
    !from
  ) {
    throw new Error("SMTP is not fully configured.")
  }

  return { host, port, user, pass, from, fromName }
}

function invitationHtml(invitation: FeedbackInvitation) {
  const recipient = escapeHtml(invitation.recipientName)
  const title = escapeHtml(invitation.formTitle)
  const closingDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(invitation.closesOn)

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <style>
      body { margin: 0; padding: 0; background-color: #f8fafc; }
      .email-container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; }
      .header { background: linear-gradient(135deg, #fb923c 0%, #f97316 100%); color: white; padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0; }
      .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em; }
      .content { background: #ffffff; padding: 40px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
      .semester-info { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; }
      .semester-info h2 { margin: 0; color: #ea580c; font-size: 20px; font-weight: 600; }
      .form-title { color: #1f2937; font-size: 22px; font-weight: 600; margin: 24px 0 16px; text-align: center; }
      .description { color: #4b5563; font-size: 16px; line-height: 1.6; margin: 16px 0; }
      .button-container { text-align: center; margin: 32px 0; }
      .button { display: inline-block; background: linear-gradient(135deg, #fb923c 0%, #f97316 100%); color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
      .security-notice { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 24px 0; color: #92400e; font-size: 14px; line-height: 1.5; }
      .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
      @media only screen and (max-width: 600px) { .email-container { padding: 12px !important; } .content { padding: 28px 20px !important; } .header { padding: 26px 18px !important; } }
    </style>
  </head>
  <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#18181b">
    <div class="email-container">
      <div class="header">
        <div style="width:48px;height:48px;margin:0 auto 12px;padding:8px;border-radius:14px;background:#ffffff"><img src="cid:reflectify-logo" width="48" height="48" alt="Reflectify" style="display:block;width:48px;height:48px" /></div>
        <h1>Reflectify</h1>
        <p style="margin:8px 0 0;font-size:14px;font-weight:500;opacity:.9">Feedback form invitation</p>
      </div>
      <div class="content">
        <p class="description">Hello ${recipient},</p>
        <div class="semester-info"><h2>Semester ${invitation.semesterNumber} • Division ${escapeHtml(invitation.divisionName)}</h2></div>
        <p class="description">You are invited to participate in our feedback initiative. Your input is crucial for enhancing the academic experience at ${escapeHtml(invitation.departmentName)}.</p>
        <h3 class="form-title">${title}</h3>
        <p class="description">This anonymous survey takes just a few minutes to complete. Please submit it by <strong>${escapeHtml(closingDate)}</strong>.</p>
        <div class="button-container"><a href="${invitation.feedbackUrl}" class="button">Access feedback form</a></div>
        <div class="security-notice"><strong>Privacy notice:</strong> This link is uniquely generated for you and should not be shared. All responses are confidential.</div>
        <p class="description">Thank you for taking the time to provide your valuable feedback. Your voice matters in shaping a better learning environment.</p>
      </div>
      <div class="footer"><p>This is an automated message from the Academic Feedback System.</p><p>Please do not reply to this email.</p></div>
    </div>
  </body>
</html>`
}

export async function deliverFeedbackInvitations(
  invitations: FeedbackInvitation[]
) {
  if (invitations.length === 0) return { sent: 0, failed: 0 }

  const config = emailConfiguration()
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  })
  const from = `"${config.fromName.replace(/"/g, "")}" <${config.from}>`
  let sent = 0
  let failed = 0

  for (let index = 0; index < invitations.length; index += 5) {
    const batch = invitations.slice(index, index + 5)
    const outcomes = await Promise.allSettled(
      batch.map((invitation) =>
        transporter.sendMail({
          from,
          to: invitation.to,
          subject: `Feedback requested: ${invitation.formTitle}`,
          html: invitationHtml(invitation),
          attachments: [
            {
              filename: "reflectify-logo.png",
              path: path.join(process.cwd(), "public", "reflectify-logo.png"),
              cid: "reflectify-logo",
            },
          ],
        })
      )
    )
    for (const outcome of outcomes) {
      if (outcome.status === "fulfilled") sent += 1
      else failed += 1
    }
  }

  await transporter.close()
  return { sent, failed }
}

export async function deliverContactMessage(message: ContactMessage) {
  const config = emailConfiguration()
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  })
  const from = `"${config.fromName.replace(/"/g, "")}" <${config.from}>`
  const recipient = process.env.CONTACT_EMAIL ?? "feedback_ce@ldrp.ac.in"

  try {
    await transporter.sendMail({
      from,
      to: recipient,
      replyTo: message.email,
      subject: `Reflectify contact: ${message.subject}`,
      text: `From: ${message.name} <${message.email}>\n\n${message.message}`,
      html: `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#18181b">
    <div style="max-width:600px;margin:0 auto;padding:24px">
      <div style="border-radius:14px 14px 0 0;background:#f97316;padding:24px;color:#fff">
        <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Reflectify</p>
        <h1 style="margin:8px 0 0;font-size:24px">New contact message</h1>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 14px 14px;background:#fff;padding:28px">
        <p style="margin:0 0 18px;color:#64748b;font-size:14px">Reply directly to this email to respond.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:10px 0;color:#64748b;width:90px">From</td><td style="padding:10px 0;font-weight:600">${escapeHtml(message.name)}</td></tr>
          <tr><td style="padding:10px 0;color:#64748b">Email</td><td style="padding:10px 0"><a href="mailto:${escapeHtml(message.email)}" style="color:#ea580c">${escapeHtml(message.email)}</a></td></tr>
          <tr><td style="padding:10px 0;color:#64748b">Subject</td><td style="padding:10px 0;font-weight:600">${escapeHtml(message.subject)}</td></tr>
        </table>
        <div style="margin-top:20px;border-radius:10px;background:#fff7ed;padding:18px;white-space:pre-wrap;line-height:1.6">${escapeHtml(message.message)}</div>
      </div>
    </div>
  </body>
</html>`,
    })
  } finally {
    await transporter.close()
  }
}
