import { Dialog } from "@headlessui/react";
import {
    XMarkIcon,
    BuildingOfficeIcon,
    XCircleIcon,
    PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface DepartmentFormData {
    name: string;
    abbreviation: string;
    hodName: string;
    hodEmail: string;
    collegeId: string;
}

interface AddDepartmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (departmentData: DepartmentFormData) => void;
}

export function AddDepartmentModal({
    isOpen,
    onClose,
    onAdd,
}: AddDepartmentModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        abbreviation: "",
        hodName: "",
        hodEmail: "",
        collegeId: "1", // Static college ID
    });

    const validateField = (name: string, value: string) => {
        switch (name) {
            case "name":
                if (value.length < 3) {
                    toast.error(
                        "Department name must be at least 3 characters long"
                    );
                    return false;
                }
                break;
            case "abbreviation":
                if (value.length < 2 || value.length > 5) {
                    toast.error("Abbreviation must be 2-5 characters long");
                    return false;
                }
                break;
            case "hodName":
                if (value.length < 3) {
                    toast.error("HOD name must be at least 3 characters long");
                    return false;
                }
                break;
            case "hodEmail":
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    toast.error("Please enter a valid email address");
                    return false;
                }
                break;
        }
        return true;
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isValid = Object.entries(formData).every(([key, value]) =>
            key === "collegeId" ? true : validateField(key, value)
        );

        if (!isValid) return;

        setIsSubmitting(true);
        await onAdd(formData);
        setIsSubmitting(false);
        setFormData({
            name: "",
            abbreviation: "",
            hodName: "",
            hodEmail: "",
            collegeId: "1",
        });
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
                            Add New Department
                        </Dialog.Title>
                        <p className="mt-1 text-sm text-secondary-lighter0">
                            Fill in the information to add a new department
                        </p>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-secondary-main hover:text-secondary-lighter0 transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-dark">
                                Department Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter department name"
                                className="mt-1 block w-full rounded-lg border border-secondary-lighter px-3 py-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter transition-all shadow-sm"
                                value={formData.name}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({ ...formData, name: value });
                                    if (value) validateField("name", value);
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-dark">
                                Abbreviation
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., CSE"
                                className="mt-1 block w-full rounded-lg border border-secondary-lighter px-3 py-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter transition-all shadow-sm"
                                value={formData.abbreviation}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({
                                        ...formData,
                                        abbreviation: value,
                                    });
                                    if (value)
                                        validateField("abbreviation", value);
                                }}
                            />
                            <p className="mt-1 text-xs text-secondary-lighter0">
                                Short form used to identify the department
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-dark">
                                HOD Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter HOD's full name"
                                className="mt-1 block w-full rounded-lg border border-secondary-lighter px-3 py-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter transition-all shadow-sm"
                                value={formData.hodName}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({
                                        ...formData,
                                        hodName: value,
                                    });
                                    if (value) validateField("hodName", value);
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-dark">
                                HOD Email
                            </label>
                            <input
                                type="email"
                                placeholder="Enter HOD's email address"
                                className="mt-1 block w-full rounded-lg border border-secondary-lighter px-3 py-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter transition-all shadow-sm"
                                value={formData.hodEmail}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData({
                                        ...formData,
                                        hodEmail: value,
                                    });
                                    if (value) validateField("hodEmail", value);
                                }}
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-3 pt-6 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 text-sm font-medium text-secondary-dark hover:bg-secondary-lighter border border-secondary-light rounded-lg transition-colors flex items-center gap-2"
                            >
                                <XCircleIcon className="h-5 w-5" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary-dark hover:bg-primary-dark rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="animate-spin">⚪</span>
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircleIcon className="h-5 w-5" />
                                        Add Department
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
