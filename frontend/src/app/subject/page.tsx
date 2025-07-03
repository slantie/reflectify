"use client";

import { StatCard } from "@/components/common/statCard";
import { AddSubjectModal } from "@/components/modals/subject/AddSubjectModal";
import { DASHBOARD_SUBJECT } from "@/lib/apiEndPoints";
import {
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowUpIcon,
  BookOpenIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import * as ExcelJS from "exceljs";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
// import { EditSubjectModal } from "@/components/modals/subject/EditSubjectModal";
// import { DeleteSubjectModal } from "@/components/modals/subject/DeleteSubjectModal";

interface Subject {
  id: string;
  name: string;
  subjectCode: string;
  code: number;
  type: "MANDATORY" | "ELECTIVE";
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

interface DepartmentSubjectCount {
  departmentName: string;
  abbreviation: string;
  subjectCount: number;
}

interface SubjectStats {
  totalSubjects: number;
  mandatorySubjects: number;
  electiveSubjects: number;
}

export default function SubjectManagement() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats>({
    totalSubjects: 0,
    mandatorySubjects: 0,
    electiveSubjects: 0,
  });
  const [departmentSubjectCounts, setDepartmentSubjectCounts] = useState<
    DepartmentSubjectCount[]
  >([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [sortField, setSortField] = useState<
    "name" | "department" | "semester" | "code"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await fetch(DASHBOARD_SUBJECT);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSubjects(data);
      calculateStats(data);
    } catch (error) {
      console.error("Error details:", error);
      toast.error("Failed to fetch subjects");
      setSubjects([]);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const calculateStats = (subjectData: Subject[]) => {
    const stats = {
      totalSubjects: subjectData.length,
      mandatorySubjects: subjectData.filter((s) => s.type === "MANDATORY")
        .length,
      electiveSubjects: subjectData.filter((s) => s.type === "ELECTIVE").length,
    };
    setSubjectStats(stats);

    const deptCounts = subjectData.reduce((acc, subject) => {
      const dept = subject.department;
      const existing = acc.find((d) => d.departmentName === dept.name);
      if (existing) {
        existing.subjectCount++;
      } else {
        acc.push({
          departmentName: dept.name,
          abbreviation: dept.abbreviation,
          subjectCount: 1,
        });
      }
      return acc;
    }, [] as DepartmentSubjectCount[]);

    setDepartmentSubjectCounts(deptCounts);
  };

  const getFilteredSubjects = () => {
    return subjects
      .filter((s) => {
        const matchesSearch =
          (s.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (s.subjectCode?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (s.department?.name?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          );

        const matchesDepartment = selectedDepartment
          ? s.departmentId === selectedDepartment
          : true;
        const matchesSemester = selectedSemester
          ? s.semester?.semesterNumber?.toString() === selectedSemester
          : true;
        const matchesType = selectedType ? s.type === selectedType : true;

        return (
          matchesSearch && matchesDepartment && matchesSemester && matchesType
        );
      })
      .sort((a, b) => {
        const multiplier = sortOrder === "asc" ? 1 : -1;

        switch (sortField) {
          case "name":
            return multiplier * (a.name || "").localeCompare(b.name || "");
          case "department":
            return (
              multiplier *
              (a.department?.name || "").localeCompare(b.department?.name || "")
            );
          case "semester":
            return (
              multiplier *
              ((a.semester?.semesterNumber || 0) -
                (b.semester?.semesterNumber || 0))
            );
          case "code":
            return multiplier * ((a.code || 0) - (b.code || 0));
          default:
            return 0;
        }
      });
  };

  const handleCreate = async (subjectData: any) => {
    const requestUrl = `${DASHBOARD_SUBJECT}/create`;

    const requestBody = {
      name: subjectData.name,
      abbreviation: subjectData.abbreviation,
      subjectCode: subjectData.subjectCode,
      type: subjectData.type,
      departmentId: subjectData.departmentId,
      semesterId: subjectData.semesterId,
    };

    const promise = fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    toast.promise(promise, {
      loading: "Creating new subject...",
      success: () => {
        fetchSubjects();
        setIsAddModalOpen(false);
        return `Subject ${requestBody.name} created successfully!`;
      },
      error: "Failed to create subject",
    });
  };

  const handleUpdate = async (id: string, subjectData: any) => {
    try {
      const response = await fetch(`${DASHBOARD_SUBJECT}/${id}/update`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subjectData),
      });

      if (response.ok) {
        toast.success("Subject updated successfully");
        await fetchSubjects();
        setIsEditModalOpen(false);
      } else {
        toast.error("Failed to update subject");
      }
    } catch {
      toast.error("Failed to update subject");
    }
  };

  const handleDelete = (id: string) => {
    setSubjectToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (subjectToDelete) {
      const promise = fetch(`${DASHBOARD_SUBJECT}/${subjectToDelete}`, {
        method: "DELETE",
      });

      toast.promise(promise, {
        loading: "Deleting subject...",
        success: "Subject deleted successfully",
        error: "Failed to delete subject",
      });

      const response = await promise;
      if (response.ok) {
        await fetchSubjects();
      }
      setIsDeleteModalOpen(false);
      setSubjectToDelete(null);
    }
  };

  const handleExportToExcel = async () => {
    const filteredData = getFilteredSubjects();

    if (filteredData.length === 0) {
      toast.error("No subject data available to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Subject Data");

    worksheet.columns = [
      { header: "Sr. No.", key: "srNo", width: 8 },
      { header: "Subject Code", key: "subjectCode", width: 15 },
      { header: "Subject Name", key: "name", width: 40 },
      { header: "Department", key: "department", width: 30 },
      { header: "Semester", key: "semester", width: 15 },
      { header: "Subject Code", key: "code", width: 10 },
      { header: "Type", key: "type", width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E5E5" },
    };

    filteredData.forEach((s, index) => {
      worksheet.addRow({
        srNo: index + 1,
        subjectCode: s.subjectCode,
        name: s.name,
        department: s.department.name,
        semester: s.semester.semesterNumber,
        code: s.code,
        type: s.type,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subject_data_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success("Subject data exported successfully");
  };

  return (
    <div
      suppressHydrationWarning
      className="p-4 md:p-8 max-w-[1920px] min-h-screen mx-auto space-y-6 md:space-y-8"
    >
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
            Subject Management Portal
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
          title="Total Subjects"
          value={subjectStats.totalSubjects}
          icon={BookOpenIcon}
        />
        <StatCard
          title="Mandatory Subjects"
          value={subjectStats.mandatorySubjects}
          icon={BookOpenIcon}
        />
        <StatCard
          title="Elective Subjects"
          value={subjectStats.electiveSubjects}
          icon={BookOpenIcon}
        />
        {/* {departmentSubjectCounts.map((dept) => (
          <StatCard
            key={dept.departmentName}
            title={`${dept.abbreviation} Subjects`}
            value={dept.subjectCount}
            icon={BuildingOfficeIcon}
          />
        ))} */}
      </div>

      {/* Search and Actions */}
      <div className="flex gap-6 items-center bg-white p-5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search subjects..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <BookOpenIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
        </div>

        <div className="flex gap-4">
          <select
            className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departmentSubjectCounts.map((dept) => (
              <option key={dept.departmentName} value={dept.departmentName}>
                {dept.departmentName}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">All Semesters</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num.toString()}>
                Semester {num}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="MANDATORY">Mandatory</option>
            <option value="ELECTIVE">Elective</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
            value={sortField}
            onChange={(e) =>
              setSortField(
                e.target.value as "name" | "department" | "semester" | "code"
              )
            }
          >
            <option value="name">Sort by Name</option>
            <option value="department">Sort by Department</option>
            <option value="semester">Sort by Semester</option>
            <option value="code">Sort by Subject Code</option>
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
          Add Subject
        </button>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Subject Name
                </th>
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Subject Code
                </th>
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-md font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getFilteredSubjects().length > 0 ? (
                getFilteredSubjects().map((subject) => (
                  <tr
                    key={subject.id}
                    className="hover:bg-orange-50/50 hover:shadow-sm transition-all duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-orange-100/50 flex items-center justify-center">
                          <span className="text-orange-600 font-medium">
                            {subject.subjectCode.slice(0, 2)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-md font-medium text-gray-900">
                            {subject.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-md text-gray-900">
                        {subject.department.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-md text-gray-600">
                      Semester {subject.semester.semesterNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-md text-gray-600">
                      {subject.subjectCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subject.type === "MANDATORY"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {subject.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-md font-medium">
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedSubject(subject);
                            setIsEditModalOpen(true);
                          }}
                          className="text-orange-400 hover:text-orange-500 transition-colors"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id)}
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
                      <BookOpenIcon className="h-8 w-8 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        No matching subjects found
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
      <AddSubjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleCreate}
      />
      {/* <EditSubjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEdit={handleUpdate}
        subject={selectedSubject}
      />
      <DeleteSubjectModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      /> */}
    </div>
  );
}
