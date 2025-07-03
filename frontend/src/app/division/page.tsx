"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { StatCard } from "@/components/common/statCard";
import { ArrowLeftIcon } from "lucide-react";
import * as ExcelJS from "exceljs";
import { AddDivisionModal } from "@/components/modals/division/AddDivisionModal";
import { EditDivisionModal } from "@/components/modals/division/EditDivisionModal";
import { DeleteDivisionModal } from "@/components/modals/division/DeleteDivisionModal";
import {
  DASHBOARD_DEPARTMENTS,
  DASHBOARD_DIVISION,
  DASHBOARD_DIVISIONS_CREATE,
} from "@/lib/apiEndPoints";

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
  studentCount: number;
}

interface DepartmentDivisionCount {
  departmentName: string;
  abbreviation: string;
  divisionCount: number;
}

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

interface DivisionStats {
  totalDivisions: number;
  totalStudents: number;
}

export default function DivisionManagement() {
  const router = useRouter();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [divisionStats, setDivisionStats] = useState<DivisionStats>({
    totalDivisions: 0,
    totalStudents: 0,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(
    null
  );
  const [divisionToDelete, setDivisionToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [sortField, setSortField] = useState<
    "name" | "department" | "semester" | "studentCount"
  >("name");

  const [departmentDivisionCounts, setDepartmentDivisionCounts] = useState<
    DepartmentDivisionCount[]
  >([]);

  const fetchDivisions = useCallback(async () => {
    try {
      const response = await fetch(DASHBOARD_DIVISION);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setDivisions(data);
      calculateStats(data);
    } catch {
      console.error("Error fetching divisions");
      setDivisions([]);
    }
  }, []);

  useEffect(() => {
    fetchDivisions();
  }, [fetchDivisions]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(DASHBOARD_DEPARTMENTS);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      toast.error("Failed to fetch departments");
    }
  };

  const semesterNumbers = Array.from({ length: 8 }, (_, i) => i + 1);
  const academicYears = Array.from({ length: 11 }, (_, i) => {
    const year = 2020 + i;
    return `${year}`;
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const calculateStats = (divisionData: Division[]) => {
    const stats = {
      totalDivisions: divisionData.length,
      totalStudents: divisionData.reduce(
        (acc, curr) => acc + curr.studentCount,
        0
      ),
    };
    setDivisionStats(stats);

    // Calculate department-wise division counts
    const deptCounts = divisionData.reduce((acc, division) => {
      const dept = division.department;
      const existing = acc.find((d) => d.departmentName === dept.name);
      if (existing) {
        existing.divisionCount++;
      } else {
        acc.push({
          departmentName: dept.name,
          abbreviation: dept.abbreviation,
          divisionCount: 1,
        });
      }
      return acc;
    }, [] as DepartmentDivisionCount[]);

    setDepartmentDivisionCounts(deptCounts);
  };

  const getFilteredDivisions = () => {
    return divisions
      .filter((d) => {
        const matchesSearch =
          d.divisionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.department.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment = selectedDepartment
          ? d.departmentId === selectedDepartment
          : true;
        const matchesSemester = selectedSemester
          ? d.semester.semesterNumber.toString() === selectedSemester
          : true;
        const matchesYear = selectedYear
          ? d.semester.academicYear === selectedYear
          : true;

        return (
          matchesSearch && matchesDepartment && matchesSemester && matchesYear
        );
      })
      .sort((a, b) => {
        const multiplier = sortOrder === "asc" ? 1 : -1;

        // Add studentCount case to the sort logic in getFilteredDivisions
        switch (sortField) {
          case "name":
            return multiplier * a.divisionName.localeCompare(b.divisionName);
          case "department":
            return (
              multiplier * a.department.name.localeCompare(b.department.name)
            );
          case "semester":
            return (
              multiplier *
              (a.semester.semesterNumber - b.semester.semesterNumber)
            );
          case "studentCount":
            return multiplier * (a.studentCount - b.studentCount);
          default:
            return 0;
        }
      });
  };

  const handleExportToExcel = async () => {
    const filteredData = getFilteredDivisions();

    if (filteredData.length === 0) {
      toast.error("No division data available to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Division Data");

    worksheet.columns = [
      { header: "Sr. No.", key: "srNo", width: 8 },
      { header: "Division Name", key: "divisionName", width: 20 },
      { header: "Department", key: "department", width: 30 },
      { header: "Semester", key: "semester", width: 15 },
      { header: "Academic Year", key: "academicYear", width: 20 },
      { header: "Student Count", key: "studentCount", width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E5E5" },
    };

    filteredData.forEach((d, index) => {
      worksheet.addRow({
        srNo: index + 1,
        divisionName: d.divisionName,
        department: d.department.name,
        semester: d.semester.semesterNumber,
        academicYear: d.semester.academicYear,
        studentCount: d.studentCount,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `division_data_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success("Division data exported successfully");
  };

  const handleCreate = async (divisionData: DivisionFormData) => {
    try {
      const response = await fetch(DASHBOARD_DIVISIONS_CREATE, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(divisionData),
      });

      if (response.ok) {
        toast.success("Division created successfully");
        await fetchDivisions();
        setIsAddModalOpen(false);
      } else {
        toast.error("Failed to create division");
      }
    } catch {
      toast.error("Failed to create division");
    }
  };

  const handleUpdate = async (id: string, divisionData: DivisionFormData) => {
    try {
      const response = await fetch(`${DASHBOARD_DIVISION}/${id}/update`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(divisionData),
      });

      if (response.ok) {
        toast.success("Division updated successfully");
        await fetchDivisions();
        setIsEditModalOpen(false);
      } else {
        toast.error("Failed to update division");
      }
    } catch {
      toast.error("Failed to update division");
    }
  };

  const handleDelete = (id: string) => {
    setDivisionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (divisionToDelete) {
      const promise = fetch(`${DASHBOARD_DIVISION}/${divisionToDelete}`, {
        method: "DELETE",
      });

      toast.promise(promise, {
        loading: "Deleting division...",
        success: "Division deleted successfully",
        error: "Failed to delete division",
      });

      const response = await promise;
      if (response.ok) {
        await fetchDivisions();
      }
      setIsDeleteModalOpen(false);
      setDivisionToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1920px] min-h-screen mx-auto space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-orange-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-3xl font-semibold text-gray-900">
            Division Management Portal
          </h1>
        </div>
        <button
          onClick={handleExportToExcel}
          className="flex items-center justify-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-lg hover:bg-green-600 transition-colors duration-200 shadow-sm whitespace-nowrap"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Export Excel
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Divisions"
          value={divisionStats.totalDivisions}
          icon={ViewColumnsIcon}
        />
        {/* <StatCard
          title="Total Students"
          value={divisionStats.totalStudents}
          icon={UserGroupIcon}
          onClick={() => router.push("/student")}
        /> */}
        {departmentDivisionCounts.map((dept) => (
          <StatCard
            onClick={() => router.push(`/department`)}
            key={dept.departmentName}
            title={`${dept.departmentName}`}
            value={dept.divisionCount}
            icon={BuildingOfficeIcon}
          />
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex gap-6 items-center bg-white p-5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search divisions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <BuildingOfficeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
        </div>

        <div className="flex gap-4">
          <select
            className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">All Semesters</option>
            {semesterNumbers.map((num) => (
              <option key={num} value={num.toString()}>
                Semester {num}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">All Years</option>
            {academicYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
            value={sortField}
            onChange={(e) =>
              setSortField(
                e.target.value as
                  | "name"
                  | "department"
                  | "semester"
                  | "studentCount"
              )
            }
          >
            <option value="name">Sort by Name</option>
            <option value="department">Sort by Department</option>
            <option value="semester">Sort by Semester</option>
            <option value="studentCount">Sort by Student Count</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
          >
            <span className="text-gray-700">
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </span>
            {sortOrder === "asc" ? (
              <ArrowUpIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-orange-400 text-white px-5 py-2.5 rounded-lg hover:bg-orange-500 transition-colors duration-200 shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          Add Division
        </button>
      </div>

      {/* Divisions Table */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Division Name
                </th>
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Academic Year
                </th>
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Student Count
                </th>
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getFilteredDivisions().length > 0 ? (
                getFilteredDivisions().map((division) => (
                  <tr
                    key={division.id}
                    className="hover:bg-orange-50/50 hover:shadow-sm transition-all duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-orange-100/50 flex items-center justify-center">
                          <span className="text-orange-600 font-medium">
                            {division.divisionName}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-md font-medium text-gray-900">
                            {division.divisionName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-md text-gray-900">
                        {division.department.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-md text-gray-600">
                      Semester {division.semester.semesterNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-md text-gray-600">
                      {division.semester.academicYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-md text-gray-900">
                          {division.studentCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-md font-medium">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedDivision(division);
                            setIsEditModalOpen(true);
                          }}
                          className="text-orange-400 hover:text-orange-500 transition-colors"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(division.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <BuildingOfficeIcon className="h-8 w-8 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        No matching divisions found
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddDivisionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleCreate}
      />
      <EditDivisionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEdit={handleUpdate}
        division={selectedDivision}
      />
      <DeleteDivisionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
