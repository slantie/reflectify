"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
    TrashIcon,
    PlusIcon,
    ArrowLeftIcon,
    CheckIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
    DASHBOARD_FACULTY,
    FEEDBACK_FORMS,
    FEEDBACK_QUESTIONS_FORMS,
    QUESTION_CATEGORIES,
    SUBJECT_SEMESTER,
} from "@/lib/apiEndPoints";

interface FormStatusUpdate {
    status: "DRAFT" | "ACTIVE" | "CLOSED";
    startDate: Date;
    endDate: Date;
}

interface Faculty {
    id: string;
    name: string;
    abbreviation: string;
    designation: string;
}

interface Subject {
    id: string;
    name: string;
    abbreviation: string;
    subjectCode: string;
}

interface Category {
    id: string;
    categoryName: string;
    description: string;
}

interface Question {
    id: string;
    formId: string;
    categoryId: string;
    facultyId: string;
    subjectId: string;
    batch: string;
    text: string;
    type: string;
    isRequired: boolean;
    displayOrder: number;
    faculty: Faculty;
    subject: Subject;
    category: Category;
}

interface FeedbackForm {
    id: string;
    title: string;
    status: string;
    startDate: Date;
    endDate: Date;
    questions: Question[];
    division: {
        divisionName: string;
        semesterId: string;
    };
}

interface NewQuestion {
    text: string;
    categoryId: string;
    facultyId: string;
    subjectId: string;
    batch: string;
    type: string;
    isRequired: boolean;
}

export default function EditFeedbackForm({
    params,
}: {
    params: Promise<{ formId: string }>;
}) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [form, setForm] = useState<FeedbackForm | null>(null);
    const [editedForm, setEditedForm] = useState<FeedbackForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isFetchingLists, setIsFetchingLists] = useState(false);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newQuestion, setNewQuestion] = useState<NewQuestion>({
        text: "",
        categoryId: "",
        facultyId: "",
        subjectId: "",
        batch: "None",
        type: "rating",
        isRequired: true,
    });

    const handleDateChange = (field: "startDate" | "endDate", date: Date) => {
        setEditedForm((prev) => ({
            ...prev!,
            [field]: date,
        }));
        setHasChanges(true);
    };

    const handleFormStatusUpdate = async () => {
        setSaving(true);
        const loadingToast = toast.loading("Updating form status...", {
            duration: Infinity,
        });

        try {
            const response = await fetch(
                `${FEEDBACK_FORMS}/${resolvedParams.formId}/status`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        status: editedForm?.status,
                        startDate: editedForm?.startDate,
                        endDate: editedForm?.endDate,
                    }),
                }
            );

            const data = await response.json();
            if (data.success) {
                const statusMessages = {
                    DRAFT: "Form saved as draft",
                    ACTIVE: "Form is now active!",
                    CLOSED: "Form has been closed for responses",
                } as const;

                toast.dismiss(loadingToast);
                toast.success(
                    statusMessages[
                        editedForm?.status as keyof typeof statusMessages
                    ],
                    { duration: 3000, icon: "✅" }
                );
                await fetchForm();
            } else {
                toast.dismiss(loadingToast);
                toast.error(data.error || "Update failed");
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to update form status";
            toast.dismiss(loadingToast);
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const fetchLists = useCallback(async () => {
        setIsFetchingLists(true);
        try {
            const [facultiesRes, subjectsRes, categoriesRes] =
                await Promise.all([
                    fetch(`${DASHBOARD_FACULTY}`),
                    fetch(`${SUBJECT_SEMESTER}/${form?.division.semesterId}`),
                    fetch(`${QUESTION_CATEGORIES}`),
                ]);

            const [facultiesData, subjectsData, categoriesData] =
                await Promise.all([
                    facultiesRes.json(),
                    subjectsRes.json(),
                    categoriesRes.json(),
                ]);

            setFaculties(facultiesData);
            setSubjects(subjectsData);
            setCategories(categoriesData);

            setNewQuestion((prev) => ({
                ...prev,
                categoryId: categoriesData[0]?.id || "",
                facultyId: facultiesData[0]?.id || "",
                subjectId: subjectsData[0]?.id || "",
            }));
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to load form data";
            toast.error(errorMessage);
        } finally {
            setIsFetchingLists(false);
        }
    }, [form?.division.semesterId]);

    const fetchForm = useCallback(async () => {
        try {
            const response = await fetch(
                `${FEEDBACK_FORMS}/${resolvedParams.formId}`
            );
            const data = await response.json();

            if (data.success) {
                setForm(data.data);
            } else {
                toast.error("Failed to load form");
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Error loading form";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [resolvedParams.formId]);

    const handleQuestionUpdate = (
        questionId: string,
        updatedData: Partial<Question>
    ) => {
        setEditedForm((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                questions: prev.questions.map((q) =>
                    q.id === questionId ? { ...q, ...updatedData } : q
                ),
            };
        });
        setHasChanges(true);
    };

    const handleQuestionDelete = (questionId: string) => {
        if (!confirm("Are you sure you want to delete this question?")) return;

        setEditedForm((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                questions: prev.questions.filter((q) => q.id !== questionId),
            };
        });
        setHasChanges(true);
    };

    const isFormStatusValid = () => {
        if (!editedForm) return false;

        const start = new Date(editedForm.startDate);
        const end = new Date(editedForm.endDate);

        // Basic validation - end date should always be after start date
        if (end <= start) return false;

        // Allow any status change as long as dates are valid
        return true;
    };

    const handleStatusChange = (newStatus: FormStatusUpdate["status"]) => {
        setEditedForm((prev) => ({
            ...prev!,
            status: newStatus,
        }));
    };

    const handleCreateQuestion = async () => {
        setSaving(true);
        try {
            const response = await fetch(
                `${FEEDBACK_QUESTIONS_FORMS}/${resolvedParams.formId}/questions`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...newQuestion,
                        displayOrder: editedForm?.questions.length || 0,
                    }),
                }
            );

            const data = await response.json();
            if (data.success) {
                setEditedForm((prev) => ({
                    ...prev!,
                    questions: [...prev!.questions, data.data],
                }));
                toast.success("Question created successfully");
                setShowCreateDialog(false);
                resetNewQuestion();
            }
        } catch (error) {
            console.error("Creation error:", error);
            toast.error("Failed to create question");
        } finally {
            setSaving(false);
        }
    };

    const resetNewQuestion = () => {
        setNewQuestion({
            text: "",
            categoryId: categories[0]?.id || "",
            facultyId: faculties[0]?.id || "",
            subjectId: subjects[0]?.id || "",
            batch: "None",
            type: "rating",
            isRequired: true,
        });
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            const originalQuestions = form?.questions || [];
            const currentQuestions = editedForm?.questions || [];

            // Find and delete removed questions
            const deletedQuestions = originalQuestions.filter(
                (origQ) =>
                    !currentQuestions.find((currQ) => currQ.id === origQ.id)
            );

            const deletePromises = deletedQuestions.map((question) =>
                fetch(
                    `${FEEDBACK_QUESTIONS_FORMS}/${resolvedParams.formId}/questions/${question.id}`,
                    { method: "DELETE" }
                )
            );

            // Update remaining questions
            const updatePromises = currentQuestions.map((question) =>
                fetch(
                    `${FEEDBACK_QUESTIONS_FORMS}/${resolvedParams.formId}/questions/${question.id}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(question),
                    }
                )
            );

            await Promise.all([...deletePromises, ...updatePromises]);
            await fetchForm();
            setHasChanges(false);
            toast.success("All changes saved successfully");
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const handleDiscardChanges = () => {
        setEditedForm(JSON.parse(JSON.stringify(form)));
        setHasChanges(false);
    };

    useEffect(() => {
        fetchForm();
    }, [resolvedParams.formId, fetchForm]);

    useEffect(() => {
        if (form) {
            setEditedForm(JSON.parse(JSON.stringify(form)));
            fetchLists();
        }
    }, [form, form?.division.semesterId, fetchLists]);

    if (loading || isFetchingLists) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-lighter">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-dark"></div>
            </div>
        );
    }

    if (!editedForm) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-lighter">
                <div className="text-xl text-secondary-dark">
                    Form not found
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary-lighter">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
                <div className="max-w-8xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-secondary-lighter rounded-lg transition-colors"
                            >
                                <ArrowLeftIcon className="h-6 w-6 text-secondary-dark" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-secondary-darker">
                                    {editedForm.title}
                                </h1>
                                <p className="text-sm text-secondary-dark">
                                    Division: {editedForm.division.divisionName}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {hasChanges && (
                                <>
                                    <button
                                        onClick={handleDiscardChanges}
                                        className="px-4 py-2 text-secondary-dark hover:bg-secondary-lighter rounded-lg flex items-center gap-2"
                                        disabled={saving}
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                        Discard
                                    </button>
                                    <button
                                        onClick={handleSaveChanges}
                                        className="px-4 py-2 bg-positive-lighter0 text-white rounded-lg flex items-center gap-2 hover:bg-positive-dark"
                                        disabled={saving}
                                    >
                                        <CheckIcon className="h-5 w-5" />
                                        Save Changes
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Split Layout */}
            <div className="pt-10 pb-12">
                <div className="max-w-8xl mx-auto px-4 flex gap-6">
                    {/* Left Sidebar - Form Details */}
                    <div className="w-1/3 space-y-6">
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-6">
                                Form Details
                            </h2>

                            <div className="space-y-6">
                                {/* Form Status */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-secondary-dark">
                                        Status
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <select
                                            value={editedForm.status}
                                            onChange={(e) =>
                                                handleStatusChange(
                                                    e.target
                                                        .value as FormStatusUpdate["status"]
                                                )
                                            }
                                            className="w-full p-3 rounded-lg border border-secondary-lighter focus:ring-2 focus:ring-primary-dark 
  focus:border-primary-dark transition-colors"
                                        >
                                            <option value="DRAFT">
                                                📝 Draft - Not Yet Published
                                            </option>
                                            <option value="ACTIVE">
                                                ✅ Active - Open for Responses
                                            </option>
                                            <option value="CLOSED">
                                                🔒 Closed - No More Responses
                                            </option>
                                        </select>
                                        <span
                                            className={`px-4 py-2 rounded-full text-sm font-medium ${
                                                editedForm.status === "ACTIVE"
                                                    ? "bg-positive-lighter text-positive-dark"
                                                    : editedForm.status ===
                                                      "CLOSED"
                                                    ? "bg-negative-lighter text-negative-dark"
                                                    : "bg-warning-lighter text-warning-dark"
                                            }`}
                                        >
                                            {editedForm.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-secondary-dark">
                                            Start Date & Time
                                        </label>
                                        <DatePicker
                                            selected={
                                                editedForm.startDate
                                                    ? new Date(
                                                          editedForm.startDate
                                                      )
                                                    : null
                                            }
                                            onChange={(date) =>
                                                handleDateChange(
                                                    "startDate",
                                                    date as Date
                                                )
                                            }
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-dark"
                                            placeholderText="Select start date and time"
                                            minDate={new Date()}
                                            customInput={
                                                <input className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-dark" />
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-secondary-dark">
                                            End Date & Time
                                        </label>
                                        <DatePicker
                                            selected={
                                                editedForm.endDate
                                                    ? new Date(
                                                          editedForm.endDate
                                                      )
                                                    : null
                                            }
                                            onChange={(date) =>
                                                handleDateChange(
                                                    "endDate",
                                                    date as Date
                                                )
                                            }
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="MMMM d, yyyy h:mm aa"
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-dark"
                                            placeholderText="Select end date and time"
                                            minDate={
                                                editedForm.startDate
                                                    ? new Date(
                                                          editedForm.startDate
                                                      )
                                                    : new Date()
                                            }
                                            customInput={
                                                <input className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary-dark" />
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Update Button */}
                                <button
                                    onClick={handleFormStatusUpdate}
                                    className="w-full px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 
                  disabled:cursor-not-allowed transition-colors"
                                    disabled={!isFormStatusValid()}
                                >
                                    Update Form Status
                                </button>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                Form Information
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-secondary-dark">
                                        Title
                                    </label>
                                    <p className="font-medium">
                                        {editedForm.title}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-secondary-dark">
                                        Division
                                    </label>
                                    <p className="font-medium">
                                        {editedForm.division.divisionName}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-secondary-dark">
                                        Total Questions
                                    </label>
                                    <p className="font-medium">
                                        {editedForm.questions.length}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Side - Questions */}
                    <div className="w-2/3 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Questions</h2>
                            <button
                                onClick={() => setShowCreateDialog(true)}
                                className="px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary-dark 
                flex items-center gap-2 transition-colors"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Add Question
                            </button>
                        </div>

                        <div className="space-y-4">
                            {editedForm.questions.map((question, index) => (
                                <Card
                                    key={question.id}
                                    className="p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-bold text-secondary-main">
                                                Q{index + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={question.text}
                                                onChange={(e) =>
                                                    handleQuestionUpdate(
                                                        question.id,
                                                        {
                                                            text: e.target
                                                                .value,
                                                        }
                                                    )
                                                }
                                                className="flex-1 text-lg font-medium p-2 border-b border-transparent 
                        hover:border-secondary-light focus:border-primary-dark focus:outline-none"
                                                placeholder="Enter question text"
                                            />
                                            <button
                                                onClick={() =>
                                                    handleQuestionDelete(
                                                        question.id
                                                    )
                                                }
                                                className="p-2 text-secondary-main hover:text-negative-main rounded-full hover:bg-negative-lighter"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <select
                                                value={question.facultyId}
                                                onChange={(e) =>
                                                    handleQuestionUpdate(
                                                        question.id,
                                                        {
                                                            facultyId:
                                                                e.target.value,
                                                        }
                                                    )
                                                }
                                                className="p-2 rounded-lg border border-secondary-lighter focus:ring-2 focus:ring-primary-dark"
                                            >
                                                {faculties.map((faculty) => (
                                                    <option
                                                        key={faculty.id}
                                                        value={faculty.id}
                                                    >
                                                        {faculty.name} (
                                                        {faculty.abbreviation})
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                value={question.subjectId}
                                                onChange={(e) =>
                                                    handleQuestionUpdate(
                                                        question.id,
                                                        {
                                                            subjectId:
                                                                e.target.value,
                                                        }
                                                    )
                                                }
                                                className="p-2 rounded-lg border border-secondary-lighter focus:ring-2 focus:ring-primary-dark"
                                            >
                                                {subjects.map((subject) => (
                                                    <option
                                                        key={subject.id}
                                                        value={subject.id}
                                                    >
                                                        {subject.name} (
                                                        {subject.subjectCode})
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                value={question.categoryId}
                                                onChange={(e) =>
                                                    handleQuestionUpdate(
                                                        question.id,
                                                        {
                                                            categoryId:
                                                                e.target.value,
                                                        }
                                                    )
                                                }
                                                className="p-2 rounded-lg border border-secondary-lighter focus:ring-2 focus:ring-primary-dark"
                                            >
                                                {categories.map((category) => (
                                                    <option
                                                        key={category.id}
                                                        value={category.id}
                                                    >
                                                        {category.categoryName}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                value={question.batch}
                                                onChange={(e) =>
                                                    handleQuestionUpdate(
                                                        question.id,
                                                        {
                                                            batch: e.target
                                                                .value,
                                                        }
                                                    )
                                                }
                                                className="p-2 rounded-lg border border-secondary-lighter focus:ring-2 focus:ring-primary-dark"
                                            >
                                                <option value="None">
                                                    No Batch
                                                </option>
                                                <option value="1">
                                                    Batch 1
                                                </option>
                                                <option value="2">
                                                    Batch 2
                                                </option>
                                                <option value="3">
                                                    Batch 3
                                                </option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <select
                                                value={question.type}
                                                onChange={(e) =>
                                                    handleQuestionUpdate(
                                                        question.id,
                                                        {
                                                            type: e.target
                                                                .value,
                                                        }
                                                    )
                                                }
                                                className="p-2 rounded-lg border border-secondary-lighter focus:ring-2 focus:ring-primary-dark"
                                            >
                                                <option value="rating">
                                                    Rating Scale
                                                </option>
                                                <option value="text">
                                                    Text Response
                                                </option>
                                            </select>

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        question.isRequired
                                                    }
                                                    onChange={(e) =>
                                                        handleQuestionUpdate(
                                                            question.id,
                                                            {
                                                                isRequired:
                                                                    e.target
                                                                        .checked,
                                                            }
                                                        )
                                                    }
                                                    className="w-4 h-4 rounded border-secondary-light text-primary-dark focus:ring-primary-dark"
                                                />
                                                <span className="text-secondary-dark">
                                                    Required Response
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Creation Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Question</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleCreateQuestion();
                        }}
                    >
                        {/* Dialog content */}
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
