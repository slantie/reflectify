"use client";

import { Card } from "@/components/ui/Card";
import {
    UPLOAD_FACULTY,
    UPLOAD_STUDENT,
    UPLOAD_SUBJECT,
} from "@/lib/apiEndPoints";
import {
    ArrowLeftIcon,
    DocumentArrowUpIcon,
    TableCellsIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import ExcelJS from "exceljs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface UploadData {
    [key: string]: string | number | boolean | null;
}

interface TableData {
    data: UploadData[];
    type: string;
}

const FILE_ROUTES = {
    studentData: {
        route: UPLOAD_STUDENT,
        label: "Student Data",
        icon: "👥",
    },
    facultyData: {
        route: UPLOAD_FACULTY,
        label: "Faculty Data",
        icon: "👨‍🏫",
    },
    subjectData: {
        route: UPLOAD_SUBJECT,
        label: "Subject Data",
        icon: "📚",
    },
} as const;

interface AffectedRows {
    added: number;
    updated: number;
}

export default function UploadPage() {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        studentData: null,
        facultyData: null,
        subjectData: null,
    });
    const [loadingStates, setLoadingStates] = useState<{
        [key: string]: boolean;
    }>({
        studentData: false,
        facultyData: false,
        subjectData: false,
    });
    const [activeTable, setActiveTable] = useState<TableData | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        fileKey: string
    ) => {
        const file = event.target.files?.[0] || null;
        if (file && !file.name.match(/\.(xlsx|xls)$/)) {
            toast.error("Please upload only Excel files");
            return;
        }
        setFiles((prev) => ({ ...prev, [fileKey]: file }));
        setActiveTable(null);
    };

    const handleClearFile = (fileKey: string) => {
        const fileInput = document.querySelector(
            `input[name="${fileKey}"]`
        ) as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
        }
        setFiles((prev) => ({ ...prev, [fileKey]: null }));
        setActiveTable(null);
    };

    const handlePreview = async (fileKey: string) => {
        const file = files[fileKey];
        if (!file) {
            toast.error("Please select a file first");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);

        const worksheet = workbook.worksheets[0];
        const jsonData: Record<string, string | number | boolean | null>[] = [];

        const headers = worksheet.getRow(1).values as string[];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const rowData: Record<
                    string,
                    string | number | boolean | null
                > = {};
                row.eachCell((cell, colNumber) => {
                    const cellValue = cell.value;
                    rowData[headers[colNumber]] = cellValue?.toString() ?? null;
                });
                jsonData.push(rowData);
            }
        });

        setActiveTable({
            data: jsonData,
            type: FILE_ROUTES[fileKey as keyof typeof FILE_ROUTES].label,
        });
    };

    const handleSubmit = async (fileKey: string) => {
        const formData = new FormData();
        const file = files[fileKey];

        if (!file) {
            toast.error("Please select a file first");
            return;
        }

        setLoadingStates((prev) => ({ ...prev, [fileKey]: true }));
        formData.append(fileKey, file);

        try {
            const response = await fetch(
                FILE_ROUTES[fileKey as keyof typeof FILE_ROUTES].route,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data: { message: string; rowsAffected: AffectedRows } =
                await response.json();

            if (response.ok) {
                toast.success(
                    "Success! Affected " +
                        JSON.stringify(data.rowsAffected) +
                        " rows."
                );
                setFiles((prev) => ({ ...prev, [fileKey]: null }));
                handleClearFile(fileKey);
            } else {
                toast.error(data.message);
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";
            toast.error(
                `Upload failed for ${
                    FILE_ROUTES[fileKey as keyof typeof FILE_ROUTES].label
                }: ${errorMessage}`
            );
        } finally {
            setLoadingStates((prev) => ({ ...prev, [fileKey]: false }));
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
                            className="p-2 hover:bg-orange-100 rounded-full transition-colors"
                            title="Go back"
                            aria-label="Go back"
                        >
                            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                        </button>
                        <h1 className="text-3xl font-semibold text-gray-900">
                            Data Upload Center
                        </h1>
                    </div>

                    {/* Upload Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(FILE_ROUTES).map(([key, { label }]) => (
                            <Card
                                key={key}
                                className="bg-white shadow-sm border border-orange-100 p-6 rounded-2xl"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 rounded-xl">
                                            <DocumentArrowUpIcon className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {label}
                                        </h2>
                                    </div>

                                    <input
                                        name={key}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        title={`Upload ${label} Excel file`}
                                        placeholder={`Choose ${label} Excel file`}
                                        onChange={(e) =>
                                            handleFileChange(e, key)
                                        }
                                        className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-orange-50 file:text-orange-700
                      hover:file:bg-orange-100
                      transition-all cursor-pointer"
                                    />

                                    {files[key] && (
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-orange-600 font-medium flex items-center gap-2 truncate max-w-[60%]">
                                                <span className="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0"></span>
                                                <span className="truncate">
                                                    {files[key]?.name}
                                                </span>
                                            </p>
                                            <button
                                                onClick={() =>
                                                    handleClearFile(key)
                                                }
                                                className="p-1.5 hover:bg-orange-100 rounded-full transition-colors flex-shrink-0"
                                                title="Clear file"
                                                aria-label="Clear file"
                                            >
                                                <XMarkIcon className="h-4 w-4 text-gray-500" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePreview(key)}
                                            disabled={!files[key]}
                                            className="flex-1 bg-white border-2 border-orange-500 text-orange-600 py-2.5 px-4 rounded-xl
                        hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                        transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Preview
                                        </button>
                                        <button
                                            onClick={() => handleSubmit(key)}
                                            disabled={
                                                !files[key] ||
                                                loadingStates[key]
                                            }
                                            className="flex-1 bg-orange-500 text-white py-2.5 px-4 rounded-xl
                        hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                        transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loadingStates[key] ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                                    Processing
                                                </span>
                                            ) : (
                                                "Upload"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Preview Section - Full Width */}
                    <div className="w-full">
                        {activeTable ? (
                            <Card className="bg-white shadow-sm border border-orange-100 rounded-2xl overflow-hidden">
                                <div className="pb-6 pl-2 pr-6 pt-2 border-b border-orange-100">
                                    <div className="flex items-center gap-3">
                                        <TableCellsIcon className="h-8 w-8 text-orange-500" />
                                        <h2 className="text-2xl font-semibold text-gray-900">
                                            {activeTable.type} Preview
                                        </h2>
                                    </div>
                                </div>
                                <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent hover:scrollbar-thumb-orange-300">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-orange-50 sticky top-0 z-10">
                                                <tr>
                                                    {Object.keys(
                                                        activeTable.data[0] ||
                                                            {}
                                                    ).map((header) => (
                                                        <th
                                                            key={header}
                                                            className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-orange-50"
                                                        >
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {activeTable.data.map(
                                                    (row, index) => (
                                                        <tr
                                                            key={index}
                                                            className="hover:bg-orange-50 transition-colors"
                                                        >
                                                            {Object.values(
                                                                row
                                                            ).map(
                                                                (
                                                                    value:
                                                                        | string
                                                                        | number
                                                                        | boolean
                                                                        | null,
                                                                    cellIndex
                                                                ) => (
                                                                    <td
                                                                        key={
                                                                            cellIndex
                                                                        }
                                                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
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
                            <div className="h-[600px] flex items-center justify-center bg-white rounded-2xl border border-orange-100">
                                <p className="text-gray-500 text-lg">
                                    Select a file and click preview to see the
                                    content
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
