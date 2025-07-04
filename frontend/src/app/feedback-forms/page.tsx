"use client";

import { Card } from "@/components/ui/Card";
import {
    FEEDBACK_FORM_ACADEMIC_STRUCTURE,
    FEEDBACK_FORM_GENERATE,
    FEEDBACK_FORMS,
} from "@/lib/apiEndPoints";
import {
    ArrowLeftIcon,
    BoltIcon,
    CalendarIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ClipboardDocumentListIcon,
    DocumentTextIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    UserGroupIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface Department {
    id: string;
    name: string;
    abbreviation: string;
    semesters: Semester[];
}

interface Semester {
    id: string;
    semesterNumber: number;
    divisions: Division[];
}

interface Division {
    id: string;
    divisionName: string;
}

interface Selection {
    departmentId: string;
    semesterSelections: {
        [semesterId: string]: {
            selected: boolean;
            indeterminate: boolean;
            divisions: string[];
        };
    };
}

interface FeedbackForm {
    id: string;
    title: string;
    status: string;
    questions: Question[];
    division: {
        semesterId: string;
        divisionName: string;
    };
    createdAt: string;
}

interface Question {
    id: string;
    categoryId: string;
    text: string;
    type: string;
    isRequired: boolean;
    displayOrder: number;
}

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    selection: Selection;
    academicStructure: Department[];
    onGenerate: () => void;
    loading: boolean;
}

const PreviewModal = ({
    isOpen,
    onClose,
    selection,
    academicStructure,
    onGenerate,
    loading,
}: PreviewModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm">
            <div className="absolute inset-0 " onClick={onClose} />
            <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[100vh] overflow-y-auto">
                <Card className="shadow-xl rounded-2xl">
                    <div className="p-6 space-y-6 rounded-2xl border-primary-lighter border-2">
                        <div className="flex items-center justify-between  rounded-2xl">
                            <div className="flex items-center gap-3  rounded-2xl">
                                <EyeIcon className="h-6 w-6 text-primary-dark" />
                                <h2 className="text-2xl font-semibold text-secondary-darker">
                                    Selection Preview
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-primary-lighter rounded-full"
                            >
                                <XMarkIcon className="h-5 w-5 text-secondary-lighter0" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-secondary-darker">
                                    Selected Department
                                </h3>
                                <p className="text-secondary-dark mt-1">
                                    {
                                        academicStructure.find(
                                            (d) =>
                                                d.id === selection.departmentId
                                        )?.name
                                    }
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-secondary-darker">
                                    Selected Semesters and Divisions
                                </h3>
                                <div className="mt-2 space-y-3">
                                    {Object.entries(
                                        selection.semesterSelections
                                    )
                                        .filter(
                                            ([, value]) =>
                                                value.divisions.length > 0
                                        )
                                        .map(([semId, value]) => {
                                            const semester = academicStructure
                                                .flatMap((d) => d.semesters)
                                                .find((s) => s.id === semId);
                                            return (
                                                <div
                                                    key={semId}
                                                    className="bg-primary-lighter p-3 rounded-lg"
                                                >
                                                    <p className="font-medium text-secondary-darker">
                                                        Semester{" "}
                                                        {
                                                            semester?.semesterNumber
                                                        }
                                                    </p>
                                                    <p className="text-sm text-secondary-dark mt-1">
                                                        Divisions:{" "}
                                                        {value.divisions
                                                            .map(
                                                                (divId) =>
                                                                    semester?.divisions.find(
                                                                        (d) =>
                                                                            d.id ===
                                                                            divId
                                                                    )
                                                                        ?.divisionName
                                                            )
                                                            .join(", ")}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-primary-lighter">
                            <button
                                onClick={onGenerate}
                                disabled={loading}
                                className="w-full bg-primary-dark text-white py-2.5 px-4 rounded-xl
                  hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2
                  transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                        Processing
                                    </span>
                                ) : (
                                    "Generate Forms"
                                )}
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default function FeedbackFormTemplate() {
    const router = useRouter();
    const [existingForms, setExistingForms] = useState<FeedbackForm[]>([]);
    const [academicStructure, setAcademicStructure] = useState<Department[]>(
        []
    );
    const [selection, setSelection] = useState<Selection>({
        departmentId: "",
        semesterSelections: {},
    });
    const [showSelectionPreview, setShowSelectionPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
    const [expandedSems, setExpandedSems] = useState<string[]>([]);

    const toggleSemester = (semesterId: string) => {
        setExpandedSems((prev) =>
            prev.includes(semesterId)
                ? prev.filter((id) => id !== semesterId)
                : [...prev, semesterId]
        );
    };

    useEffect(() => {
        fetchExistingForms();
        fetchAcademicStructure();
    }, []);

    const fetchExistingForms = async () => {
        try {
            const response = await fetch(FEEDBACK_FORMS);
            const data = await response.json();
            if (data.success) {
                setExistingForms(data.data);
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to load existing forms";
            toast.error(errorMessage);
        }
    };

    const fetchAcademicStructure = async () => {
        try {
            const response = await fetch(FEEDBACK_FORM_ACADEMIC_STRUCTURE);
            const data = await response.json();
            if (data.success) {
                setAcademicStructure(data.data);
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to load academic structure";
            toast.error(errorMessage);
        }
    };

    const handleDepartmentSelect = (deptId: string) => {
        const currentDeptId = selection.departmentId === deptId ? "" : deptId;
        setSelection({
            departmentId: currentDeptId,
            semesterSelections:
                currentDeptId === "" ? {} : selection.semesterSelections,
        });
    };

    const handleSemesterSelect = (semId: string, divisions: Division[]) => {
        const currentSelection = selection.semesterSelections[semId];
        const allDivisionIds = divisions.map((d) => d.id);

        setSelection({
            ...selection,
            semesterSelections: {
                ...selection.semesterSelections,
                [semId]: {
                    selected: !currentSelection?.selected,
                    indeterminate: false,
                    divisions: currentSelection?.selected ? [] : allDivisionIds,
                },
            },
        });
    };

    const handleDeleteForm = async (formId: string) => {
        if (!confirm("Are you sure you want to delete this form?")) return;

        try {
            const response = await fetch(`${FEEDBACK_FORMS}/${formId}`, {
                method: "DELETE",
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Form deleted successfully");
                fetchExistingForms();
            } else {
                toast.error("Failed to delete form");
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : "Error deleting form";
            toast.error(errorMessage);
        }
    };

    const handleDivisionSelect = (
        semId: string,
        divId: string,
        allDivisions: Division[]
    ) => {
        const currentSemSelection = selection.semesterSelections[semId] || {
            selected: false,
            indeterminate: false,
            divisions: [],
        };

        const newDivisions = currentSemSelection.divisions.includes(divId)
            ? currentSemSelection.divisions.filter((id) => id !== divId)
            : [...currentSemSelection.divisions, divId];

        const allDivisionIds = allDivisions.map((d) => d.id);
        const isAllSelected = allDivisionIds.every((id) =>
            newDivisions.includes(id)
        );
        const isPartiallySelected = newDivisions.length > 0 && !isAllSelected;

        setSelection({
            ...selection,
            semesterSelections: {
                ...selection.semesterSelections,
                [semId]: {
                    selected: isAllSelected,
                    indeterminate: isPartiallySelected,
                    divisions: newDivisions,
                },
            },
        });
    };

    const handlePreviewSelection = () => {
        if (
            !selection.departmentId ||
            Object.keys(selection.semesterSelections).length === 0
        ) {
            toast.error("Please select at least one department and semester");
            return;
        }
        setShowSelectionPreview(true);
    };

    const handleGenerateForms = async () => {
        setLoading(true);
        const loadingToast = toast.loading("Generating feedback forms...");
        try {
            const formData = {
                departmentId: selection.departmentId,
                selectedSemesters: Object.entries(selection.semesterSelections)
                    .filter(([, value]) => value.divisions.length > 0)
                    .map(([semesterId, value]) => ({
                        id: semesterId,
                        divisions: value.divisions,
                    })),
            };

            const response = await fetch(FEEDBACK_FORM_GENERATE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Forms generated successfully!", {
                    id: loadingToast,
                });
                fetchExistingForms();
                setShowSelectionPreview(false);
                setSelection({ departmentId: "", semesterSelections: {} });
            } else {
                toast.error(data.error || "Failed to generate forms", {
                    id: loadingToast,
                });
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Error generating forms";
            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    // const renderExistingForms = () => (
    //   <motion.div
    //     initial={{ opacity: 0, y: 20 }}
    //     animate={{ opacity: 1, y: 0 }}
    //     className="space-y-4"
    //   >
    //     <div className="flex items-center justify-between mb-8">
    //       <h2 className="text-2xl font-bold text-secondary-darker flex items-center gap-2">
    //         <ClipboardDocumentListIcon className="h-6 w-6 text-primary-dark" />
    //         Feedback Forms
    //       </h2>
    //       <div className="flex gap-2">
    //         <button
    //           onClick={() => setShowSelectionPreview(false)}
    //           className="px-4 py-2 text-sm font-medium text-secondary-dark bg-white rounded-md hover:bg-secondary-lighter border border-secondary-lighter"
    //         >
    //           Filter
    //         </button>
    //         <button
    //           onClick={() => router.push("/feedback-forms/new")}
    //           className="px-4 py-2 text-sm font-medium text-white bg-primary-dark rounded-md hover:bg-primary-dark"
    //         >
    //           Create New Form
    //         </button>
    //       </div>
    //     </div>

    //     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-2 gap-6">
    //       {existingForms.map((form, index) => (
    //         <motion.div
    //           key={form.id}
    //           initial={{ opacity: 0, y: 20 }}
    //           animate={{ opacity: 1, y: 0 }}
    //           transition={{ delay: index * 0.1 }}
    //         >
    //           <Card className="group bg-white rounded-xl transition-all duration-300 hover:shadow-xl border border-secondary-lighter overflow-hidden">
    //             <div className="p-5 border-b border-secondary-lighter bg-gradient-to-r from-primary-lighter/50 to-transparent">
    //               <div className="flex items-center justify-between mb-3">
    //                 <h3 className="font-semibold text-lg text-secondary-darker line-clamp-1">
    //                   {form.title}
    //                 </h3>
    //                 <span
    //                   className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200
    //                   ${
    //                     form.status === "ACTIVE"
    //                       ? "bg-positive-lighter text-positive-dark ring-1 ring-positive-lighter"
    //                       : "bg-warning-lighter text-warning-dark ring-1 ring-warning-lighter"
    //                   }`}
    //                 >
    //                   {form.status}
    //                 </span>
    //               </div>
    //               <div className="flex items-center text-secondary-dark">
    //                 <UserGroupIcon className="h-4 w-4 mr-2" />
    //                 <span className="text-sm">{form.division.divisionName}</span>
    //               </div>
    //             </div>

    //             <div className="p-5 space-y-4">
    //               <div className="grid grid-cols-2 gap-4">
    //                 <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary-lighter">
    //                   <DocumentTextIcon className="h-5 w-5 text-primary-dark" />
    //                   <div>
    //                     <div className="text-xs text-secondary-lighter0">Questions</div>
    //                     <div className="font-medium">{form.questions.length}</div>
    //                   </div>
    //                 </div>
    //                 <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary-lighter">
    //                   <CalendarIcon className="h-5 w-5 text-primary-dark" />
    //                   <div>
    //                     <div className="text-xs text-secondary-lighter0">Created</div>
    //                     <div className="font-medium">
    //                       {new Date(form.createdAt).toLocaleDateString("en-US", {
    //                         month: "short",
    //                         day: "numeric",
    //                       })}
    //                     </div>
    //                   </div>
    //                 </div>
    //               </div>

    //               <div className="flex gap-2 pt-4">
    //                 <button
    //                   onClick={() =>
    //                     router.push(`/feedback-forms/edit/${form.id}`)
    //                   }
    //                   className="flex-1 inline-flex items-center justify-center px-4 py-2
    //                            text-sm font-medium text-primary-dark bg-primary-lighter
    //                            rounded-lg hover:bg-primary-lighter transition-colors duration-200"
    //                 >
    //                   <PencilIcon className="h-4 w-4 mr-2" />
    //                   Edit
    //                 </button>
    //                 <button
    //                   onClick={() =>
    //                     router.push(`/feedback-forms/preview/${form.id}`)
    //                   }
    //                   className="flex-1 inline-flex items-center justify-center px-4 py-2
    //                            text-sm font-medium text-secondary-dark bg-secondary-lighter
    //                            rounded-lg hover:bg-secondary-lighter transition-colors duration-200"
    //                 >
    //                   <EyeIcon className="h-4 w-4 mr-2" />
    //                   Preview
    //                 </button>
    //                 <button
    //                   onClick={() => handleDeleteForm(form.id)}
    //                   className="inline-flex items-center justify-center p-2
    //                            text-negative-main bg-negative-lighter rounded-lg hover:bg-negative-lighter
    //                            transition-colors duration-200"
    //                 >
    //                   <TrashIcon className="h-4 w-4" />
    //                 </button>
    //               </div>
    //             </div>
    //           </Card>
    //         </motion.div>
    //       ))}
    //     </div>
    //   </motion.div>
    // );

    const renderExistingForms = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-primary-lighter"
        >
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-bold text-secondary-darker flex items-center gap-2">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-primary-dark" />
                    Feedback Forms
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSelectionPreview(false)}
                        className="px-4 py-2 text-sm font-medium text-secondary-dark bg-white rounded-xl hover:bg-secondary-lighter border border-secondary-lighter"
                    >
                        Filter
                    </button>
                    <button
                        onClick={() => router.push("/feedback-forms/new")}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-dark rounded-xl hover:bg-primary-dark"
                    >
                        Create New Form
                    </button>
                </div>
            </div>

            {academicStructure.map((dept) => (
                <div key={dept.id} className="space-y-4">
                    {dept.semesters.map((semester) => {
                        const semesterForms = existingForms.filter(
                            (form) => form.division.semesterId === semester.id
                        );

                        if (semesterForms.length === 0) return null;

                        return (
                            <div
                                key={semester.id}
                                className="border border-primary-lighter rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleSemester(semester.id)}
                                    className="w-full flex items-center justify-between p-4 bg-primary-lighter hover:bg-primary-lighter transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <ChevronRightIcon
                                            className={`h-5 w-5 text-primary-dark transition-transform ${
                                                expandedSems.includes(
                                                    semester.id
                                                )
                                                    ? "rotate-90"
                                                    : ""
                                            }`}
                                        />
                                        <span className="font-semibold">
                                            Semester {semester.semesterNumber}
                                        </span>
                                        <span className="text-sm text-secondary-lighter0">
                                            ({semesterForms.length} forms)
                                        </span>
                                    </div>
                                </button>

                                {expandedSems.includes(semester.id) && (
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {semesterForms.map((form, index) => (
                                            <motion.div
                                                key={form.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    delay: index * 0.1,
                                                }}
                                            >
                                                <Card className="group bg-white rounded-xl transition-all duration-300 hover:shadow-xl border border-secondary-lighter overflow-hidden">
                                                    <div className="p-5 border-b border-secondary-lighter bg-gradient-to-r from-primary-lighter/50 to-transparent">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h3 className="font-semibold text-lg text-secondary-darker line-clamp-1">
                                                                {form.title}
                                                            </h3>
                                                            <span
                                                                className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200
                    ${
                        form.status === "ACTIVE"
                            ? "bg-positive-lighter text-positive-dark ring-1 ring-positive-lighter"
                            : "bg-warning-lighter text-warning-dark ring-1 ring-warning-lighter"
                    }`}
                                                            >
                                                                {form.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center text-secondary-dark">
                                                            <UserGroupIcon className="h-4 w-4 mr-2" />
                                                            <span className="text-sm">
                                                                {
                                                                    form
                                                                        .division
                                                                        .divisionName
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="p-5 space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary-lighter">
                                                                <DocumentTextIcon className="h-5 w-5 text-primary-dark" />
                                                                <div>
                                                                    <div className="text-xs text-secondary-lighter0">
                                                                        Questions
                                                                    </div>
                                                                    <div className="font-medium">
                                                                        {
                                                                            form
                                                                                .questions
                                                                                .length
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary-lighter">
                                                                <CalendarIcon className="h-5 w-5 text-primary-dark" />
                                                                <div>
                                                                    <div className="text-xs text-secondary-lighter0">
                                                                        Created
                                                                    </div>
                                                                    <div className="font-medium">
                                                                        {new Date(
                                                                            form.createdAt
                                                                        ).toLocaleDateString(
                                                                            "en-US",
                                                                            {
                                                                                month: "short",
                                                                                day: "numeric",
                                                                            }
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2 pt-4">
                                                            <button
                                                                onClick={() =>
                                                                    router.push(
                                                                        `/feedback-forms/edit/${form.id}`
                                                                    )
                                                                }
                                                                className="flex-1 inline-flex items-center justify-center px-4 py-2
                             text-sm font-medium text-primary-dark bg-primary-lighter
                             rounded-lg hover:bg-primary-lighter transition-colors duration-200"
                                                            >
                                                                <PencilIcon className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    router.push(
                                                                        `/feedback-forms/preview/${form.id}`
                                                                    )
                                                                }
                                                                className="flex-1 inline-flex items-center justify-center px-4 py-2
                             text-sm font-medium text-secondary-dark bg-secondary-lighter
                             rounded-lg hover:bg-secondary-lighter transition-colors duration-200"
                                                            >
                                                                <EyeIcon className="h-4 w-4 mr-2" />
                                                                Preview
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteForm(
                                                                        form.id
                                                                    )
                                                                }
                                                                className="inline-flex items-center justify-center p-2
                             text-negative-main bg-negative-lighter rounded-lg hover:bg-negative-lighter
                             transition-colors duration-200"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </motion.div>
    );

    const renderSemesterContent = (sem: Semester, semId: string) => (
        <div className="space-y-4">
            {/* Card Style Divisions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sem.divisions.map((div) => (
                    <div
                        key={div.id}
                        className={`
              p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
              ${
                  selection.semesterSelections[semId]?.divisions.includes(
                      div.id
                  )
                      ? "border-primary-dark bg-primary-lighter"
                      : "border-secondary-lighter hover:border-primary-light"
              }
            `}
                        onClick={() =>
                            handleDivisionSelect(semId, div.id, sem.divisions)
                        }
                    >
                        <div className="flex items-center justify-between space-x-4">
                            <div>
                                <p className="font-medium text-secondary-darker">
                                    Division {div.divisionName}
                                </p>
                                <p className="text-sm text-secondary-lighter0">
                                    Semester {sem.semesterNumber}
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={
                                    selection.semesterSelections[
                                        semId
                                    ]?.divisions.includes(div.id) || false
                                }
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleDivisionSelect(
                                        semId,
                                        div.id,
                                        sem.divisions
                                    );
                                }}
                                className="h-5 w-5 rounded border-primary-light text-primary-dark focus:ring-primary-dark"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAcademicTree = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-secondary-darker flex items-center gap-2">
                    <BoltIcon className="h-6 w-6 text-primary-dark" />
                    Generate Forms
                </h2>
                <button
                    onClick={handlePreviewSelection}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-dark rounded-xl hover:bg-primary-dark"
                >
                    Preview Selection
                </button>
            </div>

            <Card className="bg-white shadow-sm border border-primary-lighter rounded-xl">
                <div className="max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-primary-lighter">
                    <div className="space-y-4 p-6">
                        {academicStructure.map((dept) => (
                            <div
                                key={dept.id}
                                className="rounded-xl bg-white border border-primary-lighter"
                            >
                                <div
                                    className="flex items-center justify-between p-4 hover:bg-primary-lighter rounded-t-xl cursor-pointer"
                                    onClick={() =>
                                        handleDepartmentSelect(dept.id)
                                    }
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedDepts((prev) =>
                                                    prev.includes(dept.id)
                                                        ? prev.filter(
                                                              (id) =>
                                                                  id !== dept.id
                                                          )
                                                        : [...prev, dept.id]
                                                );
                                            }}
                                            className="p-1.5 rounded-full hover:bg-primary-lighter"
                                        >
                                            {expandedDepts.includes(dept.id) ? (
                                                <ChevronDownIcon className="h-5 w-5 text-primary-dark" />
                                            ) : (
                                                <ChevronRightIcon className="h-5 w-5 text-primary-dark" />
                                            )}
                                        </button>
                                        <span className="font-semibold text-secondary-darker">
                                            Department of {dept.name}
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={
                                            selection.departmentId === dept.id
                                        }
                                        onChange={() =>
                                            handleDepartmentSelect(dept.id)
                                        }
                                        className="h-5 w-5 rounded border-primary-light text-primary-dark focus:ring-primary-dark"
                                    />
                                </div>

                                {expandedDepts.includes(dept.id) && (
                                    <div className="border-t border-primary-lighter bg-primary-lighter/50">
                                        <div className="p-4 space-y-4">
                                            {dept.semesters
                                                .filter(
                                                    (sem) =>
                                                        sem.divisions.length > 0
                                                )
                                                .map((sem) => (
                                                    <div
                                                        key={sem.id}
                                                        className="border-l-2 border-primary-lighter pl-4 ml-4"
                                                    >
                                                        <div
                                                            className="flex items-center justify-between p-3 hover:bg-primary-lighter rounded-lg cursor-pointer"
                                                            onClick={() =>
                                                                handleSemesterSelect(
                                                                    sem.id,
                                                                    sem.divisions
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        setExpandedSems(
                                                                            (
                                                                                prev
                                                                            ) =>
                                                                                prev.includes(
                                                                                    sem.id
                                                                                )
                                                                                    ? prev.filter(
                                                                                          (
                                                                                              id
                                                                                          ) =>
                                                                                              id !==
                                                                                              sem.id
                                                                                      )
                                                                                    : [
                                                                                          ...prev,
                                                                                          sem.id,
                                                                                      ]
                                                                        );
                                                                    }}
                                                                    className="p-1.5 rounded-full hover:bg-primary-lighter"
                                                                >
                                                                    {expandedSems.includes(
                                                                        sem.id
                                                                    ) ? (
                                                                        <ChevronDownIcon className="h-5 w-5 text-primary-dark" />
                                                                    ) : (
                                                                        <ChevronRightIcon className="h-5 w-5 text-primary-dark" />
                                                                    )}
                                                                </button>
                                                                <span className="font-medium text-secondary-darker">
                                                                    Semester{" "}
                                                                    {
                                                                        sem.semesterNumber
                                                                    }
                                                                </span>
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    selection
                                                                        .semesterSelections[
                                                                        sem.id
                                                                    ]
                                                                        ?.selected ||
                                                                    false
                                                                }
                                                                onChange={() =>
                                                                    handleSemesterSelect(
                                                                        sem.id,
                                                                        sem.divisions
                                                                    )
                                                                }
                                                                className="h-5 w-5 rounded border-primary-light text-primary-dark focus:ring-primary-dark"
                                                            />
                                                        </div>
                                                        {expandedSems.includes(
                                                            sem.id
                                                        ) &&
                                                            renderSemesterContent(
                                                                sem,
                                                                sem.id
                                                            )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1920px] mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-10"
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-primary-lighter rounded-full transition-colors"
                        >
                            <ArrowLeftIcon className="h-6 w-6 text-secondary-dark" />
                        </button>
                        <h1 className="text-3xl font-semibold text-secondary-darker">
                            Feedback Management Center
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 relative">
                        <div className="lg:col-span-2">
                            {renderAcademicTree()}
                        </div>
                        <div className="lg:col-span-3">
                            {renderExistingForms()}
                        </div>
                    </div>

                    <AnimatePresence>
                        <PreviewModal
                            isOpen={showSelectionPreview}
                            onClose={() => setShowSelectionPreview(false)}
                            selection={selection}
                            academicStructure={academicStructure}
                            onGenerate={handleGenerateForms}
                            loading={loading}
                        />
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
