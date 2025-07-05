"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import ExcelJS from "exceljs";
import { Listbox } from "@headlessui/react";
import { useRouter } from "next/navigation";
import {
    ChevronUpDownIcon,
    TableCellsIcon,
    ArrowLeftIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import {
    FACULTY_MATRIX_DEPARTMENTS,
    FACULTY_MATRIX_UPLOAD,
    API_ACADEMIC_YEARS,
} from "@/lib/apiEndPoints";

interface Department {
    id: string;
    name: string;
    abbreviation: string;
}

interface TableRow {
    [key: string]: string | null;
}

// Updated AcademicYear interface to match backend's 'yearString'
interface AcademicYear {
    id: string;
    yearString: string; // Changed from 'year' to 'yearString'
}

interface SemesterRun {
    id: string;
    type: "ODD" | "EVEN";
}

// Dummy data for Semester Run (Academic Years will be fetched)
const SEMESTER_RUNS: SemesterRun[] = [
    { id: "odd", type: "ODD" },
    { id: "even", type: "EVEN" },
];

export default function FacultyMatrixUpload() {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]); // State to store fetched academic years
    const [selectedDepartment, setSelectedDepartment] =
        useState<Department | null>(null);
    const [selectedAcademicYear, setSelectedAcademicYear] =
        useState<AcademicYear | null>(null);
    const [selectedSemesterRun, setSelectedSemesterRun] =
        useState<SemesterRun | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTable, setActiveTable] = useState<TableRow[] | null>(null);
    const [isClient, setIsClient] = useState(false);

    // Helper function to get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Authentication token not found. Please log in.");
            router.push("/login"); // Redirect to login page
            return null;
        }
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // For JSON bodies
        };
    };

    const fetchDepartments = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const response = await fetch(FACULTY_MATRIX_DEPARTMENTS, {
                headers,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message ||
                        `HTTP error! status: ${response.status}`
                );
            }
            // --- FIX START ---
            // Assuming the backend response for departments is consistent with academic years,
            // and returns an object like { status: "success", data: { departments: [...] } }
            const { data } = await response.json();
            setDepartments(data.departments || []); // Correctly access the 'departments' array inside 'data'
            // --- FIX END ---
        } catch (error: any) {
            console.error("Error fetching departments:", error);
            toast.error(error.message || "Failed to load departments");
            setDepartments([]);
        }
    };

    // New function to fetch academic years
    const fetchAcademicYears = async () => {
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const response = await fetch(API_ACADEMIC_YEARS, { headers });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message ||
                        `HTTP error! status: ${response.status}`
                );
            }
            const { data } = await response.json(); // Assuming response has a 'data' field containing academicYears
            setAcademicYears(data.academicYears || []); // Accessing data.academicYears
        } catch (error: any) {
            console.error("Error fetching academic years:", error);
            toast.error(error.message || "Failed to load academic years");
            setAcademicYears([]);
        }
    };

    useEffect(() => {
        setIsClient(true);
        // Only fetch data if on client side
        if (typeof window !== "undefined") {
            fetchDepartments();
            fetchAcademicYears();
        }
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && !file.name.match(/\.(xlsx|xls)$/)) {
            toast.error("Please upload only Excel files");
            return;
        }
        setSelectedFile(file || null);
        setActiveTable(null);
    };

    const handlePreview = async () => {
        if (!selectedFile) {
            toast.error("Please select a file first");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await selectedFile.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);

        const worksheet = workbook.worksheets[0];
        const headers = worksheet.getRow(1).values as string[];
        const jsonData: TableRow[] = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const rowData: TableRow = {};
                row.eachCell((cell, colNumber) => {
                    rowData[headers[colNumber]] =
                        cell.value?.toString() ?? null;
                });
                jsonData.push(rowData);
            }
        });

        setActiveTable(jsonData);
    };

    const handleClearFile = () => {
        const fileInput = document.querySelector(
            'input[type="file"]'
        ) as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
        }
        setSelectedFile(null);
        setActiveTable(null);
    };

    const handleUpload = async () => {
        if (
            !selectedFile ||
            !selectedDepartment ||
            !selectedAcademicYear ||
            !selectedSemesterRun
        ) {
            toast.error(
                "Please select department, academic year, semester run, and a file"
            );
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("deptAbbreviation", selectedDepartment.abbreviation);
        formData.append("academicYear", selectedAcademicYear.yearString); // Use yearString from the fetched object
        formData.append("semesterRun", selectedSemesterRun.type);

        // --- Start of FIX: Add Authorization header to upload request ---
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Authentication token not found. Please log in.");
            router.push("/login");
            setIsLoading(false);
            return;
        }

        const headers = {
            Authorization: `Bearer ${token}`,
            // Do NOT set 'Content-Type' for FormData, fetch handles it automatically
        };
        // --- End of FIX ---

        try {
            const response = await fetch(FACULTY_MATRIX_UPLOAD, {
                method: "POST",
                body: formData,
                headers: headers, // Pass the headers here
            });

            if (response.ok) {
                const data: { message: string; rowsAffected: number } =
                    await response.json();
                toast.success(
                    "Success! Affected " +
                        JSON.stringify(data.rowsAffected) +
                        " rows."
                );
                setSelectedFile(null);
                setActiveTable(null);
                setSelectedDepartment(null);
                setSelectedAcademicYear(null);
                setSelectedSemesterRun(null);
                handleClearFile();
            } else {
                const { message } = await response.json();
                toast.error(message || "Upload failed");
            }
        } catch (error) {
            toast.error((error as Error).message || "Error processing file");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isClient) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1920px] mx-auto px-6 py-8">
                <div className="space-y-10">
                    {/* Header Section */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            aria-label="Go back"
                            className="p-2 hover:bg-primary-lighter rounded-full transition-colors"
                        >
                            <ArrowLeftIcon className="h-6 w-6 text-secondary-dark" />
                        </button>
                        <h1 className="text-3xl font-semibold text-secondary-darker">
                            Faculty Matrix Upload
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Upload Section */}
                        <div className="lg:col-span-1">
                            <Card className="bg-white shadow-sm border border-primary-lighter p-8 rounded-2xl">
                                <div className="space-y-6">
                                    {/* Department Selection */}
                                    <div>
                                        <Listbox
                                            value={selectedDepartment}
                                            onChange={setSelectedDepartment}
                                        >
                                            <Listbox.Label className="block text-base font-semibold text-secondary-dark mb-2">
                                                Select Department
                                            </Listbox.Label>
                                            <div className="relative">
                                                <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white py-3.5 pl-4 pr-10 text-left border-2 border-primary-lighter focus:outline-none focus:border-primary-dark transition-colors">
                                                    <span className="block truncate font-medium">
                                                        {selectedDepartment?.name ||
                                                            "Choose a Department"}
                                                    </span>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronUpDownIcon className="h-5 w-5 text-secondary-main" />
                                                    </span>
                                                </Listbox.Button>
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                    {departments.map(
                                                        (department) => (
                                                            <Listbox.Option
                                                                key={
                                                                    department.id
                                                                }
                                                                value={
                                                                    department
                                                                }
                                                                className={({
                                                                    active,
                                                                }) =>
                                                                    `relative cursor-pointer select-none py-3 pl-4 pr-4 ${
                                                                        active
                                                                            ? "bg-primary-lighter text-primary-darker"
                                                                            : "text-secondary-darker"
                                                                    }`
                                                                }
                                                            >
                                                                {
                                                                    department.name
                                                                }
                                                            </Listbox.Option>
                                                        )
                                                    )}
                                                </Listbox.Options>
                                            </div>
                                        </Listbox>
                                    </div>

                                    {/* Academic Year Selection */}
                                    <div>
                                        <Listbox
                                            value={selectedAcademicYear}
                                            onChange={setSelectedAcademicYear}
                                        >
                                            <Listbox.Label className="block text-base font-semibold text-secondary-dark mb-2">
                                                Select Academic Year
                                            </Listbox.Label>
                                            <div className="relative">
                                                <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white py-3.5 pl-4 pr-10 text-left border-2 border-primary-lighter focus:outline-none focus:border-primary-dark transition-colors">
                                                    <span className="block truncate font-medium">
                                                        {selectedAcademicYear?.yearString || // Use yearString here
                                                            "Choose Academic Year"}
                                                    </span>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronUpDownIcon className="h-5 w-5 text-secondary-main" />
                                                    </span>
                                                </Listbox.Button>
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                    {academicYears.map(
                                                        // Map over fetched academicYears
                                                        (year) => (
                                                            <Listbox.Option
                                                                key={year.id}
                                                                value={year}
                                                                className={({
                                                                    active,
                                                                }) =>
                                                                    `relative cursor-pointer select-none py-3 pl-4 pr-4 ${
                                                                        active
                                                                            ? "bg-primary-lighter text-primary-darker"
                                                                            : "text-secondary-darker"
                                                                    }`
                                                                }
                                                            >
                                                                {
                                                                    year.yearString
                                                                }{" "}
                                                                {/* Display yearString */}
                                                            </Listbox.Option>
                                                        )
                                                    )}
                                                </Listbox.Options>
                                            </div>
                                        </Listbox>
                                    </div>

                                    {/* Semester Run Selection */}
                                    <div>
                                        <Listbox
                                            value={selectedSemesterRun}
                                            onChange={setSelectedSemesterRun}
                                        >
                                            <Listbox.Label className="block text-base font-semibold text-secondary-dark mb-2">
                                                Select Semester Run
                                            </Listbox.Label>
                                            <div className="relative">
                                                <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white py-3.5 pl-4 pr-10 text-left border-2 border-primary-lighter focus:outline-none focus:border-primary-dark transition-colors">
                                                    <span className="block truncate font-medium">
                                                        {selectedSemesterRun?.type ||
                                                            "Choose Semester Run"}
                                                    </span>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronUpDownIcon className="h-5 w-5 text-secondary-main" />
                                                    </span>
                                                </Listbox.Button>
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                    {SEMESTER_RUNS.map(
                                                        (run) => (
                                                            <Listbox.Option
                                                                key={run.id}
                                                                value={run}
                                                                className={({
                                                                    active,
                                                                }) =>
                                                                    `relative cursor-pointer select-none py-3 pl-4 pr-4 ${
                                                                        active
                                                                            ? "bg-primary-lighter text-primary-darker"
                                                                            : "text-secondary-darker"
                                                                    }`
                                                                }
                                                            >
                                                                {run.type}
                                                            </Listbox.Option>
                                                        )
                                                    )}
                                                </Listbox.Options>
                                            </div>
                                        </Listbox>
                                    </div>

                                    {/* File Upload */}
                                    <div className="space-y-2">
                                        <label className="block text-base font-semibold text-secondary-dark">
                                            Upload Excel File
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls"
                                                onChange={handleFileChange}
                                                aria-label="Upload Excel file"
                                                className="block w-full text-sm text-secondary-lighter0
        file:mr-4 file:py-3 file:px-6
        file:rounded-xl file:border-0
        file:text-sm file:font-semibold
        file:bg-primary-lighter file:text-primary-darker
        hover:file:bg-primary-lighter
        transition-all cursor-pointer"
                                            />
                                            {selectedFile && (
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-sm text-primary-dark font-medium flex items-center gap-2 truncate max-w-[80%]">
                                                        <span className="w-2 h-2 bg-primary-dark rounded-full flex-shrink-0"></span>
                                                        <span className="truncate">
                                                            {selectedFile.name}
                                                        </span>
                                                    </p>
                                                    <button
                                                        onClick={
                                                            handleClearFile
                                                        }
                                                        aria-label="Clear file"
                                                        title="Clear file"
                                                        className="p-1.5 hover:bg-primary-lighter rounded-full transition-colors flex-shrink-0"
                                                    >
                                                        <XMarkIcon className="h-4 w-4 text-secondary-lighter0" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-3 pt-4">
                                        <button
                                            onClick={handlePreview}
                                            disabled={
                                                !selectedFile || isLoading
                                            }
                                            className="w-full bg-white border-2 border-primary-dark text-primary-dark py-3 px-6 rounded-xl
                        hover:bg-primary-lighter focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2
                        transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Preview Data
                                        </button>
                                        <button
                                            onClick={handleUpload}
                                            disabled={
                                                !selectedFile ||
                                                !selectedDepartment ||
                                                !selectedAcademicYear ||
                                                !selectedSemesterRun ||
                                                isLoading
                                            }
                                            className="w-full bg-primary-dark text-white py-3 px-6 rounded-xl
                        hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-2
                        transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                                    Processing...
                                                </span>
                                            ) : (
                                                "Upload Matrix"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Preview Section */}
                        <div className="lg:col-span-3">
                            {activeTable ? (
                                <Card className="bg-white shadow-sm border border-primary-lighter rounded-2xl overflow-hidden">
                                    <div className="p-6 border-b border-primary-lighter">
                                        <div className="flex items-center gap-3">
                                            <TableCellsIcon className="h-6 w-6 text-primary-dark" />
                                            <h2 className="text-xl font-semibold text-secondary-darker">
                                                Data Preview
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary-lighter scrollbar-track-transparent hover:scrollbar-thumb-primary-light">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-secondary-lighter">
                                                <thead className="bg-primary-lighter sticky top-0 z-10">
                                                    <tr>
                                                        {Object.keys(
                                                            activeTable[0] || {}
                                                        ).map((header) => (
                                                            <th
                                                                key={header}
                                                                className="px-6 py-4 text-left text-xs font-semibold text-secondary-dark uppercase tracking-wider bg-primary-lighter"
                                                            >
                                                                {header}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-secondary-lighter">
                                                    {activeTable.map(
                                                        (row, index) => (
                                                            <tr
                                                                key={index}
                                                                className="hover:bg-primary-lighter transition-colors"
                                                            >
                                                                {Object.values(
                                                                    row as Record<
                                                                        string,
                                                                        | string
                                                                        | null
                                                                    >
                                                                ).map(
                                                                    (
                                                                        value,
                                                                        cellIndex
                                                                    ) => (
                                                                        <td
                                                                            key={
                                                                                cellIndex
                                                                            }
                                                                            className="px-6 py-4 whitespace-nowrap text-sm text-secondary-dark"
                                                                        >
                                                                            {value?.toString()}
                                                                        </td>
                                                                    )
                                                                )}
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                <div className="h-[600px] flex items-center justify-center bg-white rounded-2xl border border-primary-lighter">
                                    <p className="text-secondary-lighter0 text-lg">
                                        Select a file to preview data
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
