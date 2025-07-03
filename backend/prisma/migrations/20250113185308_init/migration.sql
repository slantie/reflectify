-- CreateTable
CREATE TABLE "Departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semesters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Divisions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectAllocations" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectAllocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Students" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roll_no" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackForms" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "subject_allocation_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackForms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackQuestions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackQuestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentResponses" (
    "id" TEXT NOT NULL,
    "response" INTEGER NOT NULL,
    "student_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "subject_allocation_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentResponses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackAnalytics" (
    "id" TEXT NOT NULL,
    "average_rating" DOUBLE PRECISION NOT NULL,
    "total_responses" INTEGER NOT NULL,
    "subject_allocation_id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Departments_code_key" ON "Departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subjects_code_key" ON "Subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Students_email_key" ON "Students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Students_roll_no_key" ON "Students"("roll_no");

-- CreateIndex
CREATE UNIQUE INDEX "Faculties_email_key" ON "Faculties"("email");

-- AddForeignKey
ALTER TABLE "Divisions" ADD CONSTRAINT "Divisions_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "Semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Divisions" ADD CONSTRAINT "Divisions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subjects" ADD CONSTRAINT "Subjects_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subjects" ADD CONSTRAINT "Subjects_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "Semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAllocations" ADD CONSTRAINT "SubjectAllocations_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAllocations" ADD CONSTRAINT "SubjectAllocations_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAllocations" ADD CONSTRAINT "SubjectAllocations_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "Divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAllocations" ADD CONSTRAINT "SubjectAllocations_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "Semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Students" ADD CONSTRAINT "Students_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Students" ADD CONSTRAINT "Students_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "Semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Students" ADD CONSTRAINT "Students_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "Divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackForms" ADD CONSTRAINT "FeedbackForms_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "Divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackForms" ADD CONSTRAINT "FeedbackForms_subject_allocation_id_fkey" FOREIGN KEY ("subject_allocation_id") REFERENCES "SubjectAllocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackQuestions" ADD CONSTRAINT "FeedbackQuestions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "FeedbackForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResponses" ADD CONSTRAINT "StudentResponses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResponses" ADD CONSTRAINT "StudentResponses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "FeedbackForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResponses" ADD CONSTRAINT "StudentResponses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "FeedbackQuestions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResponses" ADD CONSTRAINT "StudentResponses_subject_allocation_id_fkey" FOREIGN KEY ("subject_allocation_id") REFERENCES "SubjectAllocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackAnalytics" ADD CONSTRAINT "FeedbackAnalytics_subject_allocation_id_fkey" FOREIGN KEY ("subject_allocation_id") REFERENCES "SubjectAllocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackAnalytics" ADD CONSTRAINT "FeedbackAnalytics_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "Divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackAnalytics" ADD CONSTRAINT "FeedbackAnalytics_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
