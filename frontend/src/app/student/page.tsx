"use client";

import { StatCard } from "@/components/common/statCard";
import { AddStudentModal } from "@/components/modals/AddStudentModal";
import { EditStudentModal } from "@/components/modals/EditStudentModal";
import { DASHBOARD_STUDENTS } from "@/lib/apiEndPoints";
import {
  ArrowLeftIcon,
  ChartBarIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
// import router from "next/router";

interface Student {
  id: string;
  name: string;
  enrollmentNumber: string;
  departmentId: string;
  semesterId: string;
  divisionId: string;
  batch: string;
  email: string;
  image: string | null;
  phoneNumber: string;
  academicYear: string;
  department: {
    id: string;
    name: string;
    abbreviation: string;
    hodName: string;
    hodEmail: string;
    collegeId: string;
  };
  semester: {
    id: string;
    departmentId: string;
    semesterNumber: number;
    academicYear: string;
  };
  division: {
    id: string;
    departmentId: string;
    semesterId: string;
    divisionName: string;
    studentCount: number;
  };
}

interface DepartmentStats {
  departmentName: string;
  count: number;
}

export interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (studentData: Partial<Student>) => Promise<void>;
}

export default function StudentManagement() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(
    undefined
  );

  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch(DASHBOARD_STUDENTS, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStudents(data);
      calculateDepartmentStats(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const calculateDepartmentStats = (studentData: Student[]) => {
    const stats = studentData.reduce((acc: DepartmentStats[], curr) => {
      const existingStat = acc.find(
        (stat) => stat.departmentName === curr.department.name
      );
      if (existingStat) {
        existingStat.count++;
      } else {
        acc.push({ departmentName: curr.department.name, count: 1 });
      }
      return acc;
    }, []);
    setDepartmentStats(stats);
  };

  const handleCreate = async (studentData: Partial<Student>) => {
    const response = await fetch(DASHBOARD_STUDENTS, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(studentData),
    });
    if (response.ok) {
      await fetchStudents();
      setIsAddModalOpen(false);
    }
  };

  const handleUpdate = async (id: string, studentData: Partial<Student>) => {
    const response = await fetch(`${DASHBOARD_STUDENTS}/${id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(studentData),
    });
    if (response.ok) {
      await fetchStudents();
      setIsEditModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      const response = await fetch(`${DASHBOARD_STUDENTS}/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchStudents();
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1920px] mx-auto px-6 py-8">
        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-orange-100 rounded-full transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <h1 className="text-3xl font-semibold text-gray-900">
                Student Management Portal
              </h1>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add Student
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Students"
              value={students.length}
              icon={UserGroupIcon}
            />
            {departmentStats.map((stat) => (
              <StatCard
                onClick={() => router.push("/department")}
                key={stat.departmentName}
                title={stat.departmentName}
                value={stat.count}
                icon={ChartBarIcon}
              />
            ))}
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment Number
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">
                      Division
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-md font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-orange-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-orange-600 font-medium">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-md font-medium text-gray-900">
                              {student.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        {student.enrollmentNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        {student.department.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        {student.semester.semesterNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        {student.division.divisionName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-500">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-md font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsEditModalOpen(true);
                            }}
                            className="text-orange-500 hover:text-orange-700"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <AddStudentModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleCreate}
          />
          <EditStudentModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onEdit={handleUpdate}
            student={selectedStudent as Student}
          />
        </div>
      </div>
    </div>
  );
}
