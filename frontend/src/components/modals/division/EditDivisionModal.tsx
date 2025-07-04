// EditDivisionModal.tsx
import { DASHBOARD_DEPARTMENTS, DASHBOARD_SEMESTER } from "@/lib/apiEndPoints";
import { Dialog } from "@headlessui/react";
import {
    XMarkIcon,
    BuildingOfficeIcon,
    XCircleIcon,
    PencilIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

// Import shared interfaces from your common types file
import {
    Department,
    Semester,
    Division,
    DivisionFormData,
} from "@/types/common"; // Adjust path as needed

interface EditDivisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: (id: string, divisionData: DivisionFormData) => Promise<void>; // Updated type for divisionData
    division: Division | null;
}

export function EditDivisionModal({
    isOpen,
    onClose,
    onEdit,
    division,
}: EditDivisionModalProps) {
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

    // Populate form data when division prop changes
    useEffect(() => {
        if (division) {
            setFormData({
                divisionName: division.divisionName,
                departmentId: division.departmentId,
                semesterId: division.semesterId,
            });
            // Fetch semesters for the pre-selected department if division is available
            if (division.departmentId) {
                fetchSemesters(division.departmentId);
            }
        } else {
            // Clear form data if division becomes null (e.g., closing modal or initial state)
            setFormData({
                divisionName: "",
                departmentId: "",
                semesterId: "",
            });
            setSemesters([]);
        }
    }, [division]);

    // Fetch semesters when departmentId in formData changes
    useEffect(() => {
        if (formData.departmentId) {
            fetchSemesters(formData.departmentId);
        } else {
            setSemesters([]); // Clear semesters if no department is selected
            setFormData((prev) => ({ ...prev, semesterId: "" })); // Clear selected semester
        }
    }, [formData.departmentId]);

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
                if (data.length === 0 && departmentId) {
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

        if (!isValid || !division) return; // Ensure division object is present for ID

        setIsSubmitting(true);
        try {
            await onEdit(division.id, formData);
        } catch (error) {
            console.error("Error updating division:", error);
            toast.error("Failed to update division. Please try again.");
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
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary-lighter flex items-center justify-center mb-3">
                            <BuildingOfficeIcon className="h-6 w-6 text-primary-dark" />
                        </div>
                        <Dialog.Title className="text-xl font-semibold text-secondary-darker">
                            Edit Division
                        </Dialog.Title>
                        <p className="mt-1 text-sm text-secondary-lighter0">
                            Update the division information
                        </p>
                        <button
                            type="button"
                            aria-label="Close"
                            onClick={onClose}
                            className="absolute top-4 right-4 text-secondary-main hover:text-secondary-lighter0 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="edit-department-select"
                                className="block text-sm font-medium text-secondary-dark"
                            >
                                Department
                            </label>
                            <select
                                id="edit-department-select"
                                className="mt-1 block w-full rounded-lg border border-secondary-lighter px-3 py-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter transition-all shadow-sm"
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
                                htmlFor="edit-semester-select"
                                className="block text-sm font-medium text-secondary-dark"
                            >
                                Semester
                            </label>
                            <select
                                id="edit-semester-select"
                                className="mt-1 block w-full rounded-lg border border-secondary-lighter px-3 py-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter transition-all shadow-sm"
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
                                htmlFor="edit-division-name"
                                className="block text-sm font-medium text-secondary-dark"
                            >
                                Division Name
                            </label>
                            <input
                                id="edit-division-name"
                                type="text"
                                placeholder="Enter division name (e.g., A, B)"
                                className="mt-1 block w-full rounded-lg border border-secondary-lighter px-3 py-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter transition-all shadow-sm"
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
                                className="px-4 py-2.5 text-sm font-medium text-secondary-dark hover:bg-secondary-lighter border border-secondary-light rounded-lg transition-colors flex items-center gap-2"
                            >
                                <XCircleIcon className="h-5 w-5" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary-dark hover:bg-primary-dark rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <PencilIcon className="h-5 w-5" />
                                        Update Division
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
