import { DASHBOARD_DEPARTMENTS } from "@/lib/apiEndPoints";
import { Dialog } from "@headlessui/react";
import {
  XMarkIcon,
  UserIcon,
  ChevronDownIcon,
  XCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface Department {
  id: string;
  name: string;
}

interface FacultyFormData {
  name: string;
  email: string;
  designation: string;
  seatingLocation: string;
  abbreviation: string;
  departmentId: string;
  joiningDate: string;
}

interface Faculty extends FacultyFormData {
  id: string;
}

interface EditFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (
    id: string,
    facultyData: Partial<Omit<Faculty, "id" | "department">>
  ) => void;
  faculty: Faculty | null;
}

export function EditFacultyModal({
  isOpen,
  onClose,
  onEdit,
  faculty,
}: EditFacultyModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    seatingLocation: "",
    abbreviation: "",
    departmentId: "",
    joiningDate: new Date().toISOString().split("T")[0],
  });

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "name":
        if (value.length < 3) {
          toast.error("Name must be at least 3 characters long");
          return false;
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          toast.error("Please enter a valid email address");
          return false;
        }
        break;
      case "abbreviation":
        if (value.length < 2 || value.length > 4) {
          toast.error("Abbreviation must be 2-4 characters long");
          return false;
        }
        break;
      case "designation":
        if (value.length < 2) {
          toast.error("Please enter a valid designation");
          return false;
        }
        break;
      case "seatingLocation":
        if (value.length < 2) {
          toast.error("Please enter a valid seating location");
          return false;
        }
        break;
      case "departmentId":
        if (!value) {
          toast.error("Please select a department");
          return false;
        }
        break;
    }
    return true;
  };

  useEffect(() => {
    fetchDepartments();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (faculty) {
      setFormData({
        name: faculty.name,
        email: faculty.email,
        designation: faculty.designation,
        seatingLocation: faculty.seatingLocation,
        abbreviation: faculty.abbreviation,
        departmentId: faculty.departmentId,
        joiningDate: faculty.joiningDate.split("T")[0],
      });
    }
  }, [faculty]);

  const fetchDepartments = async () => {
    const response = await fetch(DASHBOARD_DEPARTMENTS);
    if (response.ok) {
      const data = await response.json();
      setDepartments(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = Object.entries(formData).every(([key, value]) =>
      validateField(key, value)
    );

    if (!isValid) return;

    setIsSubmitting(true);
    if (faculty) {
      await onEdit(faculty.id, formData);
    }
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto md:max-w-4xl w-full rounded-lg bg-white p-6 transform ease-out duration-300 transition-all animate-in fade-in zoom-in-95">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-3">
              <UserIcon className="h-10 w-10 text-orange-500" />
            </div>
            <Dialog.Title className="text-2xl font-semibold text-gray-900">
              Edit Faculty Details
            </Dialog.Title>
            <p className="mt-1 text-sm text-gray-500">
              Update the faculty member&apos;s information
            </p>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6"
          >
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                  value={formData.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, name: value });
                    if (value) validateField("name", value);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter institutional email"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                  value={formData.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, email: value });
                    if (value) validateField("email", value);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <div className="relative">
                  <select
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 bg-white shadow-sm appearance-none pr-10"
                    value={formData.departmentId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, departmentId: value });
                      validateField("departmentId", value);
                    }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g., Assistant Professor"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                  value={formData.designation}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, designation: value });
                    if (value) validateField("designation", value);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Seating Location
                </label>
                <input
                  type="text"
                  placeholder="Enter cabin/desk location"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                  value={formData.seatingLocation}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, seatingLocation: value });
                    if (value) validateField("seatingLocation", value);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Abbreviation
                </label>
                <input
                  type="text"
                  placeholder="e.g., JDS"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                  value={formData.abbreviation}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, abbreviation: value });
                    if (value) validateField("abbreviation", value);
                  }}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t">
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
                    <CheckCircleIcon className="h-5 w-5" />
                    Save Changes
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
