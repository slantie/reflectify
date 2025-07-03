import { DASHBOARD_DEPARTMENT, DASHBOARD_SEMESTER } from "@/lib/apiEndPoints";
import { Dialog } from "@headlessui/react";
import {
  XMarkIcon,
  BuildingOfficeIcon,
  XCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface Division {
  id: string;
  divisionName: string;
  departmentId: string;
  semesterId: string;
  department: {
    name: string;
    abbreviation: string;
  };
  semester: {
    semesterNumber: number;
    academicYear: string;
  };
}

interface Department {
  id: string;
  name: string;
  abbreviation: string;
}

interface Semester {
  id: string;
  semesterNumber: number;
  academicYear: string;
}

interface EditDivisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string, divisionData: any) => void;
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
  const [formData, setFormData] = useState({
    divisionName: "",
    departmentId: "",
    semesterId: "",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (division) {
      setFormData({
        divisionName: division.divisionName,
        departmentId: division.departmentId,
        semesterId: division.semesterId,
      });
      fetchSemesters(division.departmentId);
    }
  }, [division]);

  useEffect(() => {
    if (formData.departmentId) {
      fetchSemesters(formData.departmentId);
    }
  }, [formData.departmentId]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(DASHBOARD_DEPARTMENT);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      toast.error("Failed to fetch departments");
    }
  };

  const fetchSemesters = async (departmentId: string) => {
    try {
      const response = await fetch(DASHBOARD_SEMESTER);
      if (response.ok) {
        const data = await response.json();
        setSemesters(data);
      }
    } catch (error) {
      toast.error("Failed to fetch semesters");
    }
  };

  const validateField = (name: string, value: string | number) => {
    switch (name) {
      case "divisionName":
        if (value.toString().length < 1) {
          toast.error("Division name is required");
          return false;
        }
        break;
      case "departmentId":
        if (!value) {
          toast.error("Department selection is required");
          return false;
        }
        break;
      case "semesterId":
        if (!value) {
          toast.error("Semester selection is required");
          return false;
        }
        break;
      case "studentCount":
        if (typeof value === "number" && (value < 0 || value > 200)) {
          toast.error("Student count must be between 0 and 200");
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = Object.entries(formData).every(([key, value]) =>
      validateField(key, value)
    );

    if (!isValid || !division) return;

    setIsSubmitting(true);
    await onEdit(division.id, formData);
    setIsSubmitting(false);
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
              Edit Division
            </Dialog.Title>
            <p className="mt-1 text-sm text-gray-500">
              Update the division information
            </p>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
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
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                value={formData.semesterId}
                onChange={(e) =>
                  setFormData({ ...formData, semesterId: e.target.value })
                }
                disabled={!formData.departmentId}
              >
                <option value="">Select Semester</option>
                {semesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    Semester {sem.semesterNumber} - {sem.academicYear}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Division Name
              </label>
              <input
                type="text"
                placeholder="Enter division name"
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                value={formData.divisionName}
                onChange={(e) =>
                  setFormData({ ...formData, divisionName: e.target.value })
                }
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <XCircleIcon className="h-5 w-5" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⚪</span>
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
