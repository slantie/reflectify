import { DASHBOARD_DEPARTMENTS } from "@/lib/apiEndPoints";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

interface Department {
  id: string;
  name: string;
}

interface Semester {
  id: string;
  semesterNumber: number;
}

interface Division {
  id: string;
  name: string;
}

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string, studentData: StudentFormData) => void;
  student: StudentFormData;
}

interface StudentFormData {
  id: string;
  name: string;
  enrollmentNumber: string;
  departmentId: string;
  semesterId: string;
  divisionId: string;
  email: string;
}

export function EditStudentModal({
  isOpen,
  onClose,
  onEdit,
  student,
}: EditStudentModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters] = useState<Semester[]>(
    Array.from({ length: 8 }, (_, i) => ({
      id: String(i + 1),
      semesterNumber: i + 1,
    }))
  );
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [formData, setFormData] = useState<StudentFormData>({
    id: "",
    name: "",
    enrollmentNumber: "",
    departmentId: "",
    semesterId: "",
    divisionId: "",
    email: "",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (formData.departmentId) {
      fetchSemesters(formData.departmentId);
    }
  }, [formData.departmentId]);

  useEffect(() => {
    if (formData.departmentId && formData.semesterId) {
      fetchDivisions(formData.departmentId, formData.semesterId);
    }
  }, [formData.departmentId, formData.semesterId]);

  useEffect(() => {
    if (student) {
      setFormData({
        id: student.id,
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
        departmentId: student.departmentId,
        semesterId: student.semesterId,
        divisionId: student.divisionId,
        email: student.email,
      });
    }
  }, [student]);

  const fetchDepartments = async () => {
    const response = await fetch(DASHBOARD_DEPARTMENTS);
    if (response.ok) {
      const data = await response.json();
      setDepartments(data);
    }
  };

  const fetchSemesters = async (departmentId: string) => {
    const response = await fetch(
      `${DASHBOARD_DEPARTMENTS}/${departmentId}/semester`
    );
    if (response.ok) {
      // const data = await response.json();
    }
  };

  const fetchDivisions = async (departmentId: string, semesterId: string) => {
    const response = await fetch(
      `${DASHBOARD_DEPARTMENTS}/${departmentId}/semester/${semesterId}/divisions`
    );
    if (response.ok) {
      const data = await response.json();
      setDivisions(data);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (student) {
      onEdit(student.id, formData);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-md rounded-lg bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <DialogTitle className="text-lg font-medium text-gray-900">
              Edit Student
            </DialogTitle>
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
              <select
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: e.target.value })
                }
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Semester
              </label>
              <select
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.semesterId}
                onChange={(e) =>
                  setFormData({ ...formData, semesterId: e.target.value })
                }
                disabled={!formData.departmentId}
              >
                <option value="">Select Semester</option>
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    Semester {sem.semesterNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Division
              </label>
              <select
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.divisionId}
                onChange={(e) =>
                  setFormData({ ...formData, divisionId: e.target.value })
                }
                disabled={!formData.semesterId}
              >
                <option value="">Select Division</option>
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.name}
                  </option>
                ))}
              </select>
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
                Save Changes
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
