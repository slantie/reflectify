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
} from "@/lib/apiEndPoints";

interface Department {
  id: string;
  name: string;
  abbreviation: string;
}

// interface ClassSchedule {
//   [key: string]: {
//     subjects: {
//       subject_code: string;
//       type: "Lecture" | "Lab";
//       faculty: string;
//       batch?: string;
//     }[];
//   };
// }

interface TableRow {
  [key: string]: string | null;
}

export default function FacultyMatrixUpload() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTable, setActiveTable] = useState<TableRow[] | null>(null);
  const [isClient, setIsClient] = useState(false);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(FACULTY_MATRIX_DEPARTMENTS);
      const { data } = await response.json();
      setDepartments(data || []);
    } catch {
      toast.error("Failed to load departments");
      setDepartments([]);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    setIsClient(true);
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
          rowData[headers[colNumber]] = cell.value?.toString() ?? null;
        });
        jsonData.push(rowData);
      }
    });

    setActiveTable(jsonData);
  };

  const handleClearFile = () => {
    // Reset file input by accessing the DOM element
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
    if (!selectedFile || !selectedDepartment) {
      toast.error("Please select both department and file");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("deptAbbreviation", selectedDepartment.abbreviation);

    try {
      const response = await fetch(FACULTY_MATRIX_UPLOAD, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("File processed successfully");
        setSelectedFile(null);
        setActiveTable(null);
        setSelectedDepartment(null);
        handleClearFile();
      } else {
        const { message } = await response.json();
        toast.error(message || "Upload failed");
      }
    } catch {
      toast.error("Error processing file");
    } finally {
      setIsLoading(false);
    }
  };

  // Wrap your return statement
  if (!isClient) {
    return null; // or a loading state
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
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-semibold text-gray-900">
              Faculty Matrix Upload
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              <Card className="bg-white shadow-sm border border-orange-100 p-8 rounded-2xl">
                <div className="space-y-6">
                  {/* Department Selection */}
                  <div>
                    <Listbox
                      value={selectedDepartment}
                      onChange={setSelectedDepartment}
                    >
                      <Listbox.Label className="block text-base font-semibold text-gray-700 mb-2">
                        Select Department
                      </Listbox.Label>
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white py-3.5 pl-4 pr-10 text-left border-2 border-orange-100 focus:outline-none focus:border-orange-500 transition-colors">
                          <span className="block truncate font-medium">
                            {selectedDepartment?.name || "Choose a department"}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          {departments.map((department) => (
                            <Listbox.Option
                              key={department.id}
                              value={department}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-3 pl-4 pr-4 ${
                                  active
                                    ? "bg-orange-50 text-orange-900"
                                    : "text-gray-900"
                                }`
                              }
                            >
                              {department.name}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className="block text-base font-semibold text-gray-700">
                      Upload Excel File
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
        file:mr-4 file:py-3 file:px-6
        file:rounded-xl file:border-0
        file:text-sm file:font-semibold
        file:bg-orange-50 file:text-orange-700
        hover:file:bg-orange-100
        transition-all cursor-pointer"
                      />
                      {selectedFile && (
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm text-orange-600 font-medium flex items-center gap-2 truncate max-w-[80%]">
                            <span className="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0"></span>
                            <span className="truncate">
                              {selectedFile.name}
                            </span>
                          </p>
                          <button
                            onClick={handleClearFile}
                            className="p-1.5 hover:bg-orange-100 rounded-full transition-colors flex-shrink-0"
                            title="Clear file"
                          >
                            <XMarkIcon className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      onClick={handlePreview}
                      disabled={!selectedFile || isLoading}
                      className="w-full bg-white border-2 border-orange-500 text-orange-600 py-3 px-6 rounded-xl
                        hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                        transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Preview Data
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={
                        !selectedFile || !selectedDepartment || isLoading
                      }
                      className="w-full bg-orange-500 text-white py-3 px-6 rounded-xl
                        hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
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
                <Card className="bg-white shadow-sm border border-orange-100 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-orange-100">
                    <div className="flex items-center gap-3">
                      <TableCellsIcon className="h-6 w-6 text-orange-500" />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Data Preview
                      </h2>
                    </div>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent hover:scrollbar-thumb-orange-300">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-orange-50 sticky top-0 z-10">
                          <tr>
                            {Object.keys(activeTable[0] || {}).map((header) => (
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
                          {activeTable.map((row, index) => (
                            <tr
                              key={index}
                              className="hover:bg-orange-50 transition-colors"
                            >
                              {Object.values(
                                row as Record<string, string | null>
                              ).map((value, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                                >
                                  {value?.toString()}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="h-[600px] flex items-center justify-center bg-white rounded-2xl border border-orange-100">
                  <p className="text-gray-500 text-lg">
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
