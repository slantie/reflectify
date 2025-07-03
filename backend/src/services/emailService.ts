import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const API_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_PROD_URL
    : process.env.FRONTEND_DEV_URL;

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateUniqueToken(
  formId: string,
  studentId: string,
  enrollmentNumber: string
): string {
  const baseString = `${formId}-${enrollmentNumber}-${Date.now()}`;
  const hmac = crypto.createHmac(
    'sha256',
    process.env.TOKEN_SECRET || 'default-secret'
  );
  hmac.update(baseString);
  return hmac.digest('base64url');
}

async function sendEmail(
  to: string,
  studentName: string,
  formTitle: string,
  accessLink: string
) {
  const emailContent = `
    <h2>Hello ${studentName},</h2>
    <p>You have been invited to participate in the feedback form: ${formTitle}</p>
    <p>Please click on the link below to access your feedback form:</p>
    <a href="${API_URL}/feedback/${accessLink}">Access Feedback Form</a>
    <p>This link is unique to you and should not be shared with others.</p>
    <p>Thank you for your participation!</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Feedback Form: ${formTitle}`,
    html: emailContent,
  });
}

export async function sendFormAccessEmail(formId: string, divisionId: string) {
  const form = await prisma.feedbackForm.findUnique({
    where: { id: formId },
    select: {
      title: true,
    },
  });

  const students = await prisma.student.findMany({
    where: { divisionId },
    select: {
      id: true,
      email: true,
      name: true,
      enrollmentNumber: true,
    },
  });

  for (const student of students) {
    const uniqueAccessToken = generateUniqueToken(
      formId,
      student.id,
      student.enrollmentNumber
    );

    await prisma.formAccess.upsert({
      where: {
        formId_studentId: {
          formId,
          studentId: student.id,
        },
      },
      update: {
        accessToken: uniqueAccessToken,
        isSubmitted: false,
      },
      create: {
        formId,
        studentId: student.id,
        accessToken: uniqueAccessToken,
        isSubmitted: false,
      },
    });

    await sendEmail(
      student.email,
      student.name,
      form?.title || 'Feedback Form',
      uniqueAccessToken
    );
  }
}
