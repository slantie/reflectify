/*
  Warnings:

  - You are about to drop the column `academic_year` on the `semesters` table. All the data in the column will be lost.
  - You are about to drop the column `subject_allocation_id` on the `student_responses` table. All the data in the column will be lost.
  - You are about to drop the column `academic_year` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `academic_year` on the `subject_allocations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `colleges` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,college_id]` on the table `departments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[department_id,division_name,semester_id]` on the table `divisions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subject_allocation_id,academic_year_id]` on the table `feedback_analytics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[department_id,semester_number,academic_year_id]` on the table `semesters` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[faculty_id,subject_id,division_id,semester_id,lectureType,batch,academic_year_id]` on the table `subject_allocations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[department_id,abbreviation]` on the table `subjects` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `designation` on the `faculties` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `academic_year_id` to the `feedback_analytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faculty_id` to the `feedback_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject_id` to the `feedback_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academic_year_id` to the `semesters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academic_year_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academic_year_id` to the `subject_allocations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `department_id` to the `subject_allocations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Designation" AS ENUM ('HoD', 'Asst_Prof', 'Lab_Asst');

-- DropForeignKey
ALTER TABLE "_DivisionMentors" DROP CONSTRAINT "_DivisionMentors_A_fkey";

-- DropForeignKey
ALTER TABLE "_DivisionMentors" DROP CONSTRAINT "_DivisionMentors_B_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_college_id_fkey";

-- DropForeignKey
ALTER TABLE "divisions" DROP CONSTRAINT "divisions_department_id_fkey";

-- DropForeignKey
ALTER TABLE "divisions" DROP CONSTRAINT "divisions_semester_id_fkey";

-- DropForeignKey
ALTER TABLE "faculties" DROP CONSTRAINT "faculties_department_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback_analytics" DROP CONSTRAINT "feedback_analytics_subject_allocation_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback_forms" DROP CONSTRAINT "feedback_forms_division_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback_forms" DROP CONSTRAINT "feedback_forms_subject_allocation_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback_questions" DROP CONSTRAINT "feedback_questions_category_id_fkey";

-- DropForeignKey
ALTER TABLE "feedback_questions" DROP CONSTRAINT "feedback_questions_form_id_fkey";

-- DropForeignKey
ALTER TABLE "semesters" DROP CONSTRAINT "semesters_department_id_fkey";

-- DropForeignKey
ALTER TABLE "student_responses" DROP CONSTRAINT "student_responses_form_id_fkey";

-- DropForeignKey
ALTER TABLE "student_responses" DROP CONSTRAINT "student_responses_question_id_fkey";

-- DropForeignKey
ALTER TABLE "student_responses" DROP CONSTRAINT "student_responses_student_id_fkey";

-- DropForeignKey
ALTER TABLE "student_responses" DROP CONSTRAINT "student_responses_subject_allocation_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_department_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_division_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_semester_id_fkey";

-- DropForeignKey
ALTER TABLE "subject_allocations" DROP CONSTRAINT "subject_allocations_division_id_fkey";

-- DropForeignKey
ALTER TABLE "subject_allocations" DROP CONSTRAINT "subject_allocations_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "subject_allocations" DROP CONSTRAINT "subject_allocations_semester_id_fkey";

-- DropForeignKey
ALTER TABLE "subject_allocations" DROP CONSTRAINT "subject_allocations_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "subjects" DROP CONSTRAINT "subjects_department_id_fkey";

-- DropForeignKey
ALTER TABLE "subjects" DROP CONSTRAINT "subjects_semester_id_fkey";

-- DropIndex
DROP INDEX "feedback_analytics_subject_allocation_id_division_id_idx";

-- DropIndex
DROP INDEX "student_responses_subject_allocation_id_question_id_idx";

-- DropIndex
DROP INDEX "students_department_id_semester_id_division_id_idx";

-- DropIndex
DROP INDEX "subject_allocations_faculty_id_subject_id_division_id_semes_key";

-- DropIndex
DROP INDEX "subjects_department_id_subject_code_key";

-- AlterTable
ALTER TABLE "faculties" ALTER COLUMN "abbreviation" DROP NOT NULL,
DROP COLUMN "designation",
ADD COLUMN     "designation" "Designation" NOT NULL,
ALTER COLUMN "joining_date" DROP NOT NULL;

-- AlterTable
ALTER TABLE "feedback_analytics" ADD COLUMN     "academic_year_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "feedback_questions" ADD COLUMN     "batch" TEXT NOT NULL DEFAULT 'None',
ADD COLUMN     "faculty_id" TEXT NOT NULL,
ADD COLUMN     "subject_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "semesters" DROP COLUMN "academic_year",
ADD COLUMN     "academic_year_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "student_responses" DROP COLUMN "subject_allocation_id";

-- AlterTable
ALTER TABLE "students" DROP COLUMN "academic_year",
ADD COLUMN     "academic_year_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subject_allocations" DROP COLUMN "academic_year",
ADD COLUMN     "academic_year_id" TEXT NOT NULL,
ADD COLUMN     "batch" TEXT NOT NULL DEFAULT '-',
ADD COLUMN     "department_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "year_string" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_access" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_year_string_key" ON "academic_years"("year_string");

-- CreateIndex
CREATE UNIQUE INDEX "form_access_accessToken_key" ON "form_access"("accessToken");

-- CreateIndex
CREATE INDEX "form_access_formId_idx" ON "form_access"("formId");

-- CreateIndex
CREATE INDEX "form_access_studentId_idx" ON "form_access"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "form_access_formId_studentId_key" ON "form_access"("formId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_name_key" ON "colleges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_college_id_key" ON "departments"("name", "college_id");

-- CreateIndex
CREATE INDEX "divisions_semester_id_idx" ON "divisions"("semester_id");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_department_id_division_name_semester_id_key" ON "divisions"("department_id", "division_name", "semester_id");

-- CreateIndex
CREATE INDEX "feedback_analytics_subject_allocation_id_idx" ON "feedback_analytics"("subject_allocation_id");

-- CreateIndex
CREATE INDEX "feedback_analytics_division_id_idx" ON "feedback_analytics"("division_id");

-- CreateIndex
CREATE INDEX "feedback_analytics_faculty_id_idx" ON "feedback_analytics"("faculty_id");

-- CreateIndex
CREATE INDEX "feedback_analytics_academic_year_id_idx" ON "feedback_analytics"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_analytics_subject_allocation_id_academic_year_id_key" ON "feedback_analytics"("subject_allocation_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "feedback_forms_subject_allocation_id_idx" ON "feedback_forms"("subject_allocation_id");

-- CreateIndex
CREATE INDEX "feedback_questions_category_id_idx" ON "feedback_questions"("category_id");

-- CreateIndex
CREATE INDEX "feedback_questions_faculty_id_idx" ON "feedback_questions"("faculty_id");

-- CreateIndex
CREATE INDEX "feedback_questions_subject_id_idx" ON "feedback_questions"("subject_id");

-- CreateIndex
CREATE INDEX "semesters_academic_year_id_idx" ON "semesters"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_department_id_semester_number_academic_year_id_key" ON "semesters"("department_id", "semester_number", "academic_year_id");

-- CreateIndex
CREATE INDEX "student_responses_form_id_idx" ON "student_responses"("form_id");

-- CreateIndex
CREATE INDEX "student_responses_question_id_idx" ON "student_responses"("question_id");

-- CreateIndex
CREATE INDEX "students_department_id_semester_id_division_id_academic_yea_idx" ON "students"("department_id", "semester_id", "division_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "students_division_id_idx" ON "students"("division_id");

-- CreateIndex
CREATE INDEX "students_semester_id_idx" ON "students"("semester_id");

-- CreateIndex
CREATE INDEX "students_academic_year_id_idx" ON "students"("academic_year_id");

-- CreateIndex
CREATE INDEX "subject_allocations_faculty_id_idx" ON "subject_allocations"("faculty_id");

-- CreateIndex
CREATE INDEX "subject_allocations_subject_id_idx" ON "subject_allocations"("subject_id");

-- CreateIndex
CREATE INDEX "subject_allocations_division_id_idx" ON "subject_allocations"("division_id");

-- CreateIndex
CREATE INDEX "subject_allocations_semester_id_idx" ON "subject_allocations"("semester_id");

-- CreateIndex
CREATE INDEX "subject_allocations_academic_year_id_idx" ON "subject_allocations"("academic_year_id");

-- CreateIndex
CREATE INDEX "subject_allocations_department_id_idx" ON "subject_allocations"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_allocations_faculty_id_subject_id_division_id_semes_key" ON "subject_allocations"("faculty_id", "subject_id", "division_id", "semester_id", "lectureType", "batch", "academic_year_id");

-- CreateIndex
CREATE INDEX "subjects_semester_id_idx" ON "subjects"("semester_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_department_id_abbreviation_key" ON "subjects"("department_id", "abbreviation");
