import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface StudentFormData {
  name: string;
  enrollmentNumber: string;
  departmentId: string;
  semesterId: string;
  divisionId: string;
  email: string;
}

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (studentData: StudentFormData) => void;
}

export function AddStudentModal({
  isOpen,
  onClose,
  onAdd,
}: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    enrollmentNumber: "",
    departmentId: "", // Changed from department
    semesterId: "", // Changed from semester
    divisionId: "", // Changed from division
    email: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Add New Student
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enrollment Number
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.enrollmentNumber}
                onChange={(e) =>
                  setFormData({ ...formData, enrollmentNumber: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Semester
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.semesterId}
                onChange={(e) =>
                  setFormData({ ...formData, semesterId: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Division
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.divisionId}
                onChange={(e) =>
                  setFormData({ ...formData, divisionId: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email ID
              </label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md"
              >
                Add Student
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
