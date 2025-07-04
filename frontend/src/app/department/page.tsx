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
    AcademicCapIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ClipboardIcon,
    CheckIcon,
    ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { AddDepartmentModal } from "@/components/modals/department/AddDepartmentModal";
import { EditDepartmentModal } from "@/components/modals/department/EditDepartmentModal";
import { DeleteDepartmentModal } from "@/components/modals/department/DeleteDepartmentModal";
import * as ExcelJS from "exceljs";
import { StatCard } from "@/components/common/statCard";
import { ArrowLeftIcon } from "lucide-react";
import { DASHBOARD_DEPARTMENT } from "@/lib/apiEndPoints";

interface Department {
    id: string;
    name: string;
    abbreviation: string;
    hodName: string;
    hodEmail: string;
    collegeId: string;
    _count: {
        faculties: number;
        students: number;
    };
}

interface DepartmentFormData {
    name: string;
    abbreviation: string;
    hodName: string;
    hodEmail: string;
    collegeId: string;
}

interface DepartmentStats {
    totalFaculty: number;
    totalStudents: number;
}

export default function DepartmentManagement() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [departmentStats, setDepartmentStats] = useState<DepartmentStats>({
        totalFaculty: 0,
        totalStudents: 0,
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] =
        useState<Department | null>(null);
    const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(
        null
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [copiedEmails, setCopiedEmails] = useState<{
        [key: string]: boolean;
    }>({});

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await fetch(DASHBOARD_DEPARTMENT);
            if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            setDepartments(data);
            calculateStats(data);
        } catch {
            console.error("Error fetching departments");
            setDepartments([]);
        }
    }, []);

    // Update useEffect with dependency
    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const calculateStats = (departmentData: Department[]) => {
        const stats = departmentData.reduce(
            (acc, curr) => ({
                totalFaculty: acc.totalFaculty + curr._count.faculties,
                totalStudents: acc.totalStudents + curr._count.students,
            }),
            { totalFaculty: 0, totalStudents: 0 }
        );
        setDepartmentStats(stats);
    };

    const handleCopyEmail = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email);
            setCopiedEmails({ ...copiedEmails, [email]: true });
            toast.success(`${email} copied to clipboard`, {
                duration: 2000,
                style: {
                    background: "#ffffff",
                    color: "#22c55e",
                },
            });
            setTimeout(() => {
                setCopiedEmails({ ...copiedEmails, [email]: false });
            }, 2000);
        } catch {
            toast.error("Failed to copy email");
        }
    };

    const getFilteredDepartments = () => {
        return departments
            .filter((d) => {
                return (
                    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    d.hodName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    d.hodEmail
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    d.abbreviation
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                );
            })
            .sort((a, b) => {
                if (sortOrder === "asc") {
                    return a.name.localeCompare(b.name);
                }
                return b.name.localeCompare(a.name);
            });
    };

    const handleCreate = async (departmentData: DepartmentFormData) => {
        try {
            const response = await fetch(DASHBOARD_DEPARTMENT, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(departmentData),
            });

            if (response.ok) {
                toast.success("Department created successfully");
                await fetchDepartments();
                setIsAddModalOpen(false);
            } else {
                toast.error("Failed to create department");
            }
        } catch {
            toast.error("Failed to create department");
        }
    };

    const handleUpdate = async (
        id: string,
        departmentData: DepartmentFormData
    ) => {
        try {
            const response = await fetch(`${DASHBOARD_DEPARTMENT}/${id}`, {
                method: "PUT",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(departmentData),
            });

            if (response.ok) {
                toast.success("Department updated successfully");
                await fetchDepartments();
                setIsEditModalOpen(false);
            } else {
                toast.error("Failed to update department");
            }
        } catch {
            toast.error("Failed to update department");
        }
    };

    const handleDelete = (id: string) => {
        setDepartmentToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (departmentToDelete) {
            const promise = fetch(
                `${DASHBOARD_DEPARTMENT}/${departmentToDelete}`,
                {
                    method: "DELETE",
                }
            );

            toast.promise(promise, {
                loading: "Deleting department...",
                success: "Department deleted successfully",
                error: "Failed to delete department",
            });

            const response = await promise;
            if (response.ok) {
                await fetchDepartments();
            }
            setIsDeleteModalOpen(false);
            setDepartmentToDelete(null);
        }
    };

    const handleExportToExcel = async () => {
        const filteredData = getFilteredDepartments();

        if (filteredData.length === 0) {
            toast.error("No department data available to export");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Department Data");

        worksheet.columns = [
            { header: "Sr. No.", key: "srNo", width: 8 },
            { header: "Department Name", key: "name", width: 30 },
            { header: "Abbreviation", key: "abbreviation", width: 15 },
            { header: "HOD Name", key: "hodName", width: 30 },
            { header: "HOD Email", key: "hodEmail", width: 35 },
            { header: "Faculty Count", key: "facultyCount", width: 15 },
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
                name: d.name,
                abbreviation: d.abbreviation,
                hodName: d.hodName,
                hodEmail: d.hodEmail,
                facultyCount: d._count.faculties,
                studentCount: d._count.students,
            });
        });

        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `department_data_${
            new Date().toISOString().split("T")[0]
        }.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        toast.success("Department data exported successfully");
    };

    return (
        <div className="p-4 md:p-8 max-w-[1920px] min-h-screen mx-auto space-y-6 md:space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        aria-label="Go back"
                        onClick={() => router.back()}
                        className="p-2 hover:bg-primary-lighter rounded-full transition-colors"
                    >
                        <ArrowLeftIcon className="h-6 w-6 text-secondary-dark" />
                    </button>
                    <h1 className="text-3xl font-semibold text-secondary-darker">
                        Department Management Portal
                    </h1>
                </div>
                <button
                    onClick={handleExportToExcel}
                    className="flex items-center justify-center gap-2 bg-positive-lighter0 text-white px-5 py-2.5 rounded-lg hover:bg-positive-dark transition-colors duration-200 shadow-sm whitespace-nowrap"
                >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Export Excel
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Departments"
                    value={departments.length}
                    icon={BuildingOfficeIcon}
                />
                <StatCard
                    title="Total Faculty"
                    value={departmentStats.totalFaculty}
                    icon={UserGroupIcon}
                    onClick={() => router.push("/faculty")}
                />
                <StatCard
                    title="Total Students"
                    value={departmentStats.totalStudents}
                    icon={AcademicCapIcon}
                    onClick={() => router.push("/student")}
                />
            </div>

            {/* Search and Actions */}
            <div className="flex gap-6 items-center bg-white p-5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-secondary-lighter">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search departments..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-secondary-lighter focus:border-primary-light focus:ring-2 focus:ring-primary-lighter transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <BuildingOfficeIcon className="h-5 w-5 text-secondary-main absolute left-3 top-3" />
                </div>

                <button
                    onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="px-4 py-2.5 rounded-lg border border-secondary-lighter hover:bg-secondary-lighter flex items-center gap-2 transition-colors shadow-sm"
                >
                    <span className="text-secondary-dark">
                        Sort {sortOrder === "asc" ? "A→Z" : "Z→A"}
                    </span>
                    {sortOrder === "asc" ? (
                        <ArrowUpIcon className="h-4 w-4 text-secondary-lighter0" />
                    ) : (
                        <ArrowDownIcon className="h-4 w-4 text-secondary-lighter0" />
                    )}
                </button>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-light-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors duration-200 shadow-sm"
                >
                    <PlusIcon className="h-5 w-5" />
                    Add Department
                </button>
            </div>

            {/* Departments Table */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-secondary-lighter overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-secondary-lighter">
                        <thead>
                            <tr className="bg-secondary-lighter">
                                <th className="px-6 py-4 text-left text-md font-semibold text-secondary-dark uppercase tracking-wider">
                                    Department Name
                                </th>
                                <th className="px-6 py-4 text-left text-md font-semibold text-secondary-dark uppercase tracking-wider">
                                    Head of Department
                                </th>
                                <th className="px-6 py-4 text-left text-md font-semibold text-secondary-dark uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-md font-semibold text-secondary-dark uppercase tracking-wider">
                                    Faculty Count
                                </th>
                                <th className="px-6 py-4 text-left text-md font-semibold text-secondary-dark uppercase tracking-wider">
                                    Student Count
                                </th>
                                <th className="px-6 py-4 text-left text-md font-semibold text-secondary-dark uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-lighter">
                            {getFilteredDepartments().length > 0 ? (
                                getFilteredDepartments().map((department) => (
                                    <tr
                                        key={department.id}
                                        className="hover:bg-primary-lighter/50 hover:shadow-sm transition-all duration-200"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-primary-lighter/50 flex items-center justify-center">
                                                    <span className="text-primary-dark font-medium">
                                                        {
                                                            department.abbreviation
                                                        }
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-md font-medium text-secondary-darker">
                                                        {department.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-md text-secondary-dark">
                                            {department.hodName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-md text-secondary-dark">
                                            <div className="flex items-center gap-2">
                                                <span>
                                                    {department.hodEmail}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleCopyEmail(
                                                            department.hodEmail
                                                        )
                                                    }
                                                    className="text-secondary-main hover:text-primary-dark transition-colors"
                                                >
                                                    {copiedEmails[
                                                        department.hodEmail
                                                    ] ? (
                                                        <CheckIcon className="h-4 w-4" />
                                                    ) : (
                                                        <ClipboardIcon className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <AcademicCapIcon className="h-5 w-5 text-secondary-main mr-2" />
                                                <span className="text-md text-secondary-darker">
                                                    {
                                                        department._count
                                                            .faculties
                                                    }
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <UserGroupIcon className="h-5 w-5 text-secondary-main mr-2" />
                                                <span className="text-md text-secondary-darker">
                                                    {department._count.students}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-md font-medium">
                                            <div className="flex gap-3">
                                                <button
                                                    aria-label="Edit department"
                                                    onClick={() => {
                                                        setSelectedDepartment(
                                                            department
                                                        );
                                                        setIsEditModalOpen(
                                                            true
                                                        );
                                                    }}
                                                    className="text-light-primary hover:text-primary-dark transition-colors"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    aria-label="Delete department"
                                                    onClick={() =>
                                                        handleDelete(
                                                            department.id
                                                        )
                                                    }
                                                    className="text-secondary-main hover:text-negative-main transition-colors"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-6 py-8 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <BuildingOfficeIcon className="h-8 w-8 text-secondary-light" />
                                            <p className="text-secondary-lighter0 font-medium">
                                                No matching departments found
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddDepartmentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleCreate}
            />
            <EditDepartmentModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onEdit={handleUpdate}
                department={selectedDepartment}
            />
            <DeleteDepartmentModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
