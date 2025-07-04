// AddDivisionModal.tsx
import { DASHBOARD_DEPARTMENTS, DASHBOARD_SEMESTER } from "@/lib/apiEndPoints";
import { Dialog } from "@headlessui/react";
import {
    BuildingOfficeIcon,
    PlusCircleIcon,
    XCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface DivisionFormData {
    divisionName: string;
    departmentId: string;
    semesterId: string;
}

interface Department {
    id: string;
    name: string;
    abbreviation: string;
}

interface Semester {
    id: string;
    semesterNumber: number;
    // Make sure this matches your API response for Semester. AcademicYear might be nested or a string.
    // If your API returns an object with 'academicYear' as a string, keep it this way.
    // If it returns an 'academicYearId' and 'academicYear' is a separate lookup, adjust accordingly.
    academicYear: string;
}

interface AddDivisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    // The onAdd function is typically expected to handle the API call, so it might return a Promise.
    onAdd: (divisionData: DivisionFormData) => Promise<void>;
}

export function AddDivisionModal({
    isOpen,
    onClose,
    onAdd,
}: AddDivisionModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);
    const [isSemestersLoading, setIsSemestersLoading] = useState(false);

    const [formData, setFormData] = useState<DivisionFormData>({
        divisionName: "",
        departmentId: "",
        semesterId: "",
    });

    // Fetch departments on initial mount
    useEffect(() => {
        fetchDepartments();
    }, []);

    // Fetch semesters when departmentId changes
    useEffect(() => {
        if (formData.departmentId) {
            fetchSemesters(formData.departmentId);
        } else {
            setSemesters([]); // Clear semesters if no department is selected
            setFormData((prev) => ({ ...prev, semesterId: "" })); // Also clear selected semester
        }
    }, [formData.departmentId]);

    // Reset form data when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                divisionName: "",
                departmentId: "",
                semesterId: "",
            });
            setSemesters([]); // Also clear semesters on close
        }
    }, [isOpen]);

    const fetchDepartments = async () => {
        setIsDepartmentsLoading(true);
        try {
            const response = await fetch(DASHBOARD_DEPARTMENTS);
            if (response.ok) {
                const data = await response.json();
                setDepartments(data);
            } else {
                toast.error(
                    `Failed to fetch departments: ${response.statusText}`
                );
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
            toast.error("Failed to fetch departments. Please try again.");
        } finally {
            setIsDepartmentsLoading(false);
        }
    };

    const fetchSemesters = async (departmentId: string) => {
        setIsSemestersLoading(true);
        try {
            // Assuming DASHBOARD_SEMESTER endpoint accepts departmentId as a query parameter
            const response = await fetch(
                `${DASHBOARD_SEMESTER}?departmentId=${departmentId}`
            );
            if (response.ok) {
                const data = await response.json();
                setSemesters(data);
                if (data.length === 0) {
                    toast("No semesters found for the selected department.", {
                        icon: "ℹ️",
                    });
                }
            } else {
                toast.error(
                    `Failed to fetch semesters: ${response.statusText}`
                );
            }
        } catch (error) {
            console.error("Error fetching semesters:", error);
            toast.error("Failed to fetch semesters. Please try again.");
        } finally {
            setIsSemestersLoading(false);
        }
    };

    const validateField = (name: keyof DivisionFormData, value: string) => {
        switch (name) {
            case "divisionName":
                if (value.trim().length < 1) {
                    toast.error("Division name is required.");
                    return false;
                }
                break;
            case "departmentId":
                if (!value) {
                    toast.error("Department selection is required.");
                    return false;
                }
                break;
            case "semesterId":
                if (!value) {
                    toast.error("Semester selection is required.");
                    return false;
                }
                break;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isValid = Object.entries(formData).every(([key, value]) =>
            validateField(key as keyof DivisionFormData, value as string)
        );

        if (!isValid) return;

        setIsSubmitting(true);
        try {
            await onAdd(formData);
        } catch (error) {
            console.error("Error adding division:", error);
            toast.error("Failed to add division. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="mx-auto md:max-w-xl w-full rounded-lg bg-white p-6 transform ease-out duration-300 transition-all animate-in fade-in zoom-in-95">
                    <div className="text-center mb-6">
                        <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                            <BuildingOfficeIcon className="h-6 w-6 text-orange-500" />
                        </div>
                        <Dialog.Title className="text-xl font-semibold text-gray-900">
                            Add New Division
                        </Dialog.Title>
                        <p className="mt-1 text-sm text-gray-500">
                            Fill in the information to add a new division
                        </p>
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="department-select"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Department
                            </label>
                            <select
                                id="department-select"
                                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                                value={formData.departmentId}
                                onChange={
                                    (e) =>
                                        setFormData({
                                            ...formData,
                                            departmentId: e.target.value,
                                            semesterId: "",
                                        }) // Reset semester when department changes
                                }
                                disabled={isDepartmentsLoading || isSubmitting}
                            >
                                <option value="">
                                    {isDepartmentsLoading
                                        ? "Loading Departments..."
                                        : "Select Department"}
                                </option>
                                {!isDepartmentsLoading &&
                                    departments.length === 0 && (
                                        <option value="" disabled>
                                            No departments found.
                                        </option>
                                    )}
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="semester-select"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Semester
                            </label>
                            <select
                                id="semester-select"
                                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                                value={formData.semesterId}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        semesterId: e.target.value,
                                    })
                                }
                                disabled={
                                    !formData.departmentId ||
                                    isSemestersLoading ||
                                    isSubmitting
                                }
                            >
                                <option value="">
                                    {!formData.departmentId
                                        ? "Select a Department first"
                                        : isSemestersLoading
                                        ? "Loading Semesters..."
                                        : "Select Semester"}
                                </option>
                                {!isSemestersLoading &&
                                    formData.departmentId &&
                                    semesters.length === 0 && (
                                        <option value="" disabled>
                                            No semesters found.
                                        </option>
                                    )}
                                {semesters.map((sem) => (
                                    <option key={sem.id} value={sem.id}>
                                        Semester {sem.semesterNumber} -{" "}
                                        {sem.academicYear}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="division-name"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Division Name
                            </label>
                            <input
                                id="division-name"
                                type="text"
                                placeholder="Enter division name (e.g., A, B)"
                                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                                value={formData.divisionName}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        divisionName: e.target.value,
                                    })
                                }
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-3 pt-6 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <XCircleIcon className="h-5 w-5" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircleIcon className="h-5 w-5" />
                                        Add Division
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
