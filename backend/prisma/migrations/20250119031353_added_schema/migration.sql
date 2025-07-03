/*
  Warnings:

  - You are about to drop the `Departments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Divisions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Faculties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeedbackAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeedbackForms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeedbackQuestions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OTP` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Semesters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentResponses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubjectAllocations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subjects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('MANDATORY', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "LectureType" AS ENUM ('LECTURE', 'LAB', 'TUTORIAL', 'SEMINAR', 'PROJECT');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- DropForeignKey
ALTER TABLE "Divisions" DROP CONSTRAINT "Divisions_department_id_fkey";

-- DropForeignKey
ALTER TABLE "Divisions" DROP CONSTRAINT "Divisions_semester_id_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackAnalytics" DROP CONSTRAINT "FeedbackAnalytics_division_id_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackAnalytics" DROP CONSTRAINT "FeedbackAnalytics_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackAnalytics" DROP CONSTRAINT "FeedbackAnalytics_subject_allocation_id_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackForms" DROP CONSTRAINT "FeedbackForms_division_id_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackForms" DROP CONSTRAINT "FeedbackForms_subject_allocation_id_fkey";

-- DropForeignKey
ALTER TABLE "FeedbackQuestions" DROP CONSTRAINT "FeedbackQuestions_form_id_fkey";

-- DropForeignKey
ALTER TABLE "Semesters" DROP CONSTRAINT "Semesters_department_id_fkey";

-- DropForeignKey
ALTER TABLE "StudentResponses" DROP CONSTRAINT "StudentResponses_form_id_fkey";

-- DropForeignKey
ALTER TABLE "StudentResponses" DROP CONSTRAINT "StudentResponses_question_id_fkey";

-- DropForeignKey
ALTER TABLE "StudentResponses" DROP CONSTRAINT "StudentResponses_student_id_fkey";

-- DropForeignKey
ALTER TABLE "StudentResponses" DROP CONSTRAINT "StudentResponses_subject_allocation_id_fkey";

-- DropForeignKey
ALTER TABLE "Students" DROP CONSTRAINT "Students_department_id_fkey";

-- DropForeignKey
ALTER TABLE "Students" DROP CONSTRAINT "Students_division_id_fkey";

-- DropForeignKey
ALTER TABLE "Students" DROP CONSTRAINT "Students_semester_id_fkey";

-- DropForeignKey
ALTER TABLE "SubjectAllocations" DROP CONSTRAINT "SubjectAllocations_division_id_fkey";

-- DropForeignKey
ALTER TABLE "SubjectAllocations" DROP CONSTRAINT "SubjectAllocations_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "SubjectAllocations" DROP CONSTRAINT "SubjectAllocations_semester_id_fkey";

-- DropForeignKey
ALTER TABLE "SubjectAllocations" DROP CONSTRAINT "SubjectAllocations_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "Subjects" DROP CONSTRAINT "Subjects_department_id_fkey";

-- DropForeignKey
ALTER TABLE "Subjects" DROP CONSTRAINT "Subjects_semester_id_fkey";

-- DropTable
DROP TABLE "Departments";

-- DropTable
DROP TABLE "Divisions";

-- DropTable
DROP TABLE "Faculties";

-- DropTable
DROP TABLE "FeedbackAnalytics";

-- DropTable
DROP TABLE "FeedbackForms";

-- DropTable
DROP TABLE "FeedbackQuestions";

-- DropTable
DROP TABLE "OTP";

-- DropTable
DROP TABLE "Semesters";

-- DropTable
DROP TABLE "StudentResponses";

-- DropTable
DROP TABLE "Students";

-- DropTable
DROP TABLE "SubjectAllocations";

-- DropTable
DROP TABLE "Subjects";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colleges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website_url" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact_number" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "images" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "hod_name" TEXT NOT NULL,
    "hod_email" TEXT NOT NULL,
    "college_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "semester_number" INTEGER NOT NULL,
    "academic_year" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisions" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "division_name" TEXT NOT NULL,
    "student_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "subject_code" TEXT NOT NULL,
    "type" "SubjectType" NOT NULL DEFAULT 'MANDATORY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "seating_location" TEXT NOT NULL,
    "image" TEXT,
    "joining_date" TIMESTAMP(3) NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enrollment_number" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "image" TEXT,
    "phone_number" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_super" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_allocations" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "lectureType" "LectureType" NOT NULL,
    "academic_year" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_forms" (
    "id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "subject_allocation_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "access_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_categories" (
    "id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_questions" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_responses" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "subject_allocation_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_analytics" (
    "id" TEXT NOT NULL,
    "subject_allocation_id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "average_rating" DOUBLE PRECISION NOT NULL,
    "response_count" INTEGER NOT NULL,
    "completion_rate" DOUBLE PRECISION NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_views" (
    "id" TEXT NOT NULL,
    "view_name" TEXT NOT NULL,
    "query_definition" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_reports" (
    "id" TEXT NOT NULL,
    "report_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "report_config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DivisionMentors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DivisionMentors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "departments_college_id_idx" ON "departments"("college_id");

-- CreateIndex
CREATE INDEX "semesters_department_id_idx" ON "semesters"("department_id");

-- CreateIndex
CREATE INDEX "divisions_department_id_semester_id_idx" ON "divisions"("department_id", "semester_id");

-- CreateIndex
CREATE INDEX "subjects_department_id_semester_id_idx" ON "subjects"("department_id", "semester_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_department_id_subject_code_key" ON "subjects"("department_id", "subject_code");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_email_key" ON "faculties"("email");

-- CreateIndex
CREATE INDEX "faculties_department_id_idx" ON "faculties"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_enrollment_number_key" ON "students"("enrollment_number");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_department_id_semester_id_division_id_idx" ON "students"("department_id", "semester_id", "division_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "subject_allocations_faculty_id_subject_id_idx" ON "subject_allocations"("faculty_id", "subject_id");

-- CreateIndex
CREATE INDEX "subject_allocations_division_id_semester_id_idx" ON "subject_allocations"("division_id", "semester_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_allocations_faculty_id_subject_id_division_id_semes_key" ON "subject_allocations"("faculty_id", "subject_id", "division_id", "semester_id", "lectureType");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_forms_access_hash_key" ON "feedback_forms"("access_hash");

-- CreateIndex
CREATE INDEX "feedback_forms_division_id_subject_allocation_id_status_idx" ON "feedback_forms"("division_id", "subject_allocation_id", "status");

-- CreateIndex
CREATE INDEX "feedback_questions_form_id_category_id_idx" ON "feedback_questions"("form_id", "category_id");

-- CreateIndex
CREATE INDEX "student_responses_student_id_form_id_idx" ON "student_responses"("student_id", "form_id");

-- CreateIndex
CREATE INDEX "student_responses_subject_allocation_id_question_id_idx" ON "student_responses"("subject_allocation_id", "question_id");

-- CreateIndex
CREATE INDEX "feedback_analytics_subject_allocation_id_division_id_idx" ON "feedback_analytics"("subject_allocation_id", "division_id");

-- CreateIndex
CREATE INDEX "_DivisionMentors_B_index" ON "_DivisionMentors"("B");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_allocations" ADD CONSTRAINT "subject_allocations_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_allocations" ADD CONSTRAINT "subject_allocations_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_allocations" ADD CONSTRAINT "subject_allocations_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_allocations" ADD CONSTRAINT "subject_allocations_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_forms" ADD CONSTRAINT "feedback_forms_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_forms" ADD CONSTRAINT "feedback_forms_subject_allocation_id_fkey" FOREIGN KEY ("subject_allocation_id") REFERENCES "subject_allocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_questions" ADD CONSTRAINT "feedback_questions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "feedback_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_questions" ADD CONSTRAINT "feedback_questions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "question_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_responses" ADD CONSTRAINT "student_responses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_responses" ADD CONSTRAINT "student_responses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "feedback_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_responses" ADD CONSTRAINT "student_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "feedback_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_responses" ADD CONSTRAINT "student_responses_subject_allocation_id_fkey" FOREIGN KEY ("subject_allocation_id") REFERENCES "subject_allocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_analytics" ADD CONSTRAINT "feedback_analytics_subject_allocation_id_fkey" FOREIGN KEY ("subject_allocation_id") REFERENCES "subject_allocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DivisionMentors" ADD CONSTRAINT "_DivisionMentors_A_fkey" FOREIGN KEY ("A") REFERENCES "divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DivisionMentors" ADD CONSTRAINT "_DivisionMentors_B_fkey" FOREIGN KEY ("B") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
