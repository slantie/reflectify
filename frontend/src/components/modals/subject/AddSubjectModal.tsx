import { DASHBOARD_DEPARTMENTS, DASHBOARD_SEMESTER } from "@/lib/apiEndPoints";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, useEffect, useState } from "react";

interface Department {
    id: string;
    name: string;
}

interface AddSubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (subjectData: any) => void;
}

export const AddSubjectModal = ({
    isOpen,
    onClose,
    onAdd,
}: AddSubjectModalProps) => {
    const [formData, setFormData] = useState({
        name: "",
        subjectCode: "",
        abbreviation: "",
        semesterId: "",
        departmentId: "",
        type: "MANDATORY",
    });

    const [departments, setDepartments] = useState<Department[]>([]);
    const [semesters, setSemesters] = useState<
        { id: string; semesterNumber: number }[]
    >([]);

    const fetchSemesters = async () => {
        const response = await fetch(DASHBOARD_SEMESTER);
        if (response.ok) {
            const data = await response.json();
            setSemesters(data);
        }
    };

    const fetchDepartments = async () => {
        const response = await fetch(DASHBOARD_DEPARTMENTS);
        if (response.ok) {
            const data = await response.json();
            setDepartments(data);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);
    useEffect(() => {
        fetchSemesters();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(formData);
        setFormData({
            name: "",
            abbreviation: "",
            subjectCode: "",
            semesterId: "",
            departmentId: "",
            type: "MANDATORY",
        });
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div
                    suppressHydrationWarning
                    className="fixed inset-0 overflow-y-auto"
                >
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="div"
                                    className="flex items-center justify-between mb-6"
                                >
                                    <h3 className="text-lg font-semibold text-secondary-darker">
                                        Add New Subject
                                    </h3>
                                    <button
                                        onClick={onClose}
                                        className="text-secondary-main hover:text-secondary-lighter0"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </Dialog.Title>

                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-dark mb-1">
                                            Subject Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-secondary-lighter p-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-dark mb-1">
                                            Subject Abbreviation
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.abbreviation}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    abbreviation:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-secondary-lighter p-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter"
                                            placeholder="e.g., CS101"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-dark mb-1">
                                            Subject Code
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.subjectCode}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    subjectCode: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-secondary-lighter p-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-dark mb-1">
                                            Semester
                                        </label>
                                        <select
                                            required
                                            value={formData.semesterId}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    semesterId: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-secondary-lighter p-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter"
                                        >
                                            <option value="">
                                                Select Semester
                                            </option>
                                            {Array.from(
                                                { length: 8 },
                                                (_, i) => (
                                                    <option
                                                        key={i + 1}
                                                        value={`${i + 1}`}
                                                    >
                                                        Semester {i + 1}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-dark mb-1">
                                            Department
                                        </label>
                                        <select
                                            required
                                            value={formData.departmentId}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    departmentId:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-secondary-lighter p-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter"
                                        >
                                            <option value="">
                                                Select Department
                                            </option>
                                            {departments.map((dept) => (
                                                <option
                                                    key={dept.id}
                                                    value={dept.id}
                                                >
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-dark mb-1">
                                            Type
                                        </label>
                                        <select
                                            required
                                            value={formData.type}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    type: e.target.value,
                                                })
                                            }
                                            className="w-full rounded-lg border border-secondary-lighter p-2.5 focus:border-primary-light focus:ring-2 focus:ring-primary-lighter"
                                        >
                                            <option value="MANDATORY">
                                                Mandatory
                                            </option>
                                            <option value="ELECTIVE">
                                                Elective
                                            </option>
                                        </select>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 text-sm font-medium text-secondary-dark bg-white border border-secondary-light rounded-lg hover:bg-secondary-lighter"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-light-primary rounded-lg hover:bg-primary-dark"
                                        >
                                            Add Subject
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
