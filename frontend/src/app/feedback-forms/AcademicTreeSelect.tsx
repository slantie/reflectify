"use client";

import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

// Keep existing interfaces...
interface Department {
  id: string;
  name: string;
  abbreviation: string;
  semesters: Semester[];
}

interface Semester {
  id: string;
  semesterNumber: number;
  divisions: Division[];
}

interface Division {
  id: string;
  divisionName: string;
}

interface AcademicTreeSelectProps {
  data: Department[];
  selection: {
    departmentId: string;
    semesterSelections: {
      [semesterId: string]: {
        selected: boolean;
        indeterminate: boolean;
        divisions: string[];
      };
    };
  };
  onSelectionChange: (selection: {
    departmentId: string;
    semesterSelections: {
      [semesterId: string]: {
        selected: boolean;
        indeterminate: boolean;
        divisions: string[];
      };
    };
  }) => void;
}

// interface Selection {
//   departmentId: string;
//   semesterSelections: {
//     [semesterId: string]: {
//       selected: boolean;
//       indeterminate: boolean;
//       divisions: string[];
//     };
//   };
// }

// interface Question {
//   categoryId: string;
//   text: string;
//   type: string;
//   isRequired: boolean;
//   displayOrder: number;
//   metadata: string;
// }

const AcademicTreeSelect = ({
  data,
  selection,
  onSelectionChange,
}: AcademicTreeSelectProps) => {
  const [expandedDepts, setExpandedDepts] = useState<string[]>([]);
  const [expandedSems, setExpandedSems] = useState<string[]>([]);

  const toggleDepartment = (deptId: string) => {
    setExpandedDepts((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId]
    );
  };

  const toggleSemester = (semId: string) => {
    setExpandedSems((prev) =>
      prev.includes(semId)
        ? prev.filter((id) => id !== semId)
        : [...prev, semId]
    );
  };

  const handleDepartmentSelect = (deptId: string) => {
    const currentDeptId = selection.departmentId === deptId ? "" : deptId;

    // Clear semester selections if department is deselected
    const updatedSemesterSelections =
      currentDeptId === "" ? {} : selection.semesterSelections;

    onSelectionChange({
      departmentId: currentDeptId,
      semesterSelections: updatedSemesterSelections,
    });
  };

  const handleSemesterSelect = (semId: string, divisions: Division[]) => {
    const currentSelection = selection.semesterSelections[semId];
    const allDivisionIds = divisions.map((d) => d.id);

    const newSelection = {
      selected: !currentSelection?.selected,
      indeterminate: false,
      divisions: currentSelection?.selected ? [] : allDivisionIds,
    };

    onSelectionChange({
      ...selection,
      semesterSelections: {
        ...selection.semesterSelections,
        [semId]: newSelection,
      },
    });
  };

  const handleDivisionSelect = (
    semId: string,
    divId: string,
    allDivisions: Division[]
  ) => {
    const currentSemSelection = selection.semesterSelections[semId] || {
      selected: false,
      indeterminate: false,
      divisions: [],
    };

    const newDivisions = currentSemSelection.divisions.includes(divId)
      ? currentSemSelection.divisions.filter((id: string) => id !== divId)
      : [...currentSemSelection.divisions, divId];

    const allDivisionIds = allDivisions.map((d) => d.id);
    const isAllSelected = allDivisionIds.every((id) =>
      newDivisions.includes(id)
    );
    const isPartiallySelected = newDivisions.length > 0 && !isAllSelected;

    onSelectionChange({
      ...selection,
      semesterSelections: {
        ...selection.semesterSelections,
        [semId]: {
          selected: isAllSelected,
          indeterminate: isPartiallySelected,
          divisions: newDivisions,
        },
      },
    });
  };

  const renderCheckbox = (checked: boolean, indeterminate: boolean = false) => (
    <div className="relative flex items-center justify-center w-5 h-5">
      <input
        type="checkbox"
        checked={checked}
        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 transition-colors duration-200"
        readOnly
      />
      {indeterminate && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-orange-500"></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="space-y-4">
        {data.map((dept: Department) => (
          <div
            key={dept.id}
            className="border-b border-gray-100 last:border-b-0 pb-4"
          >
            <div
              className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-md transition-colors duration-200 cursor-pointer"
              onClick={() => handleDepartmentSelect(dept.id)}
            >
              <div className="flex items-center space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDepartment(dept.id);
                  }}
                  className="p-1.5 hover:bg-gray-200 rounded-full transition-colors duration-200"
                >
                  {expandedDepts.includes(dept.id) ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                <span
                  className={`text-sm font-medium ${
                    selection.departmentId === dept.id
                      ? "text-orange-500"
                      : "text-gray-700"
                  }`}
                >
                  {dept.name}{" "}
                  <span className="text-gray-500">({dept.abbreviation})</span>
                </span>
              </div>
              {renderCheckbox(selection.departmentId === dept.id)}
            </div>

            {expandedDepts.includes(dept.id) && (
              <div className="ml-10 mt-2 space-y-2">
                {dept.semesters
                  .filter((sem) => sem.divisions.length > 0)
                  .sort((a, b) => a.semesterNumber - b.semesterNumber)
                  .map((sem) => (
                    <div
                      key={sem.id}
                      className="border-l-2 border-gray-100 pl-4"
                    >
                      <div
                        className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-md transition-colors duration-200 cursor-pointer"
                        onClick={() =>
                          handleSemesterSelect(sem.id, sem.divisions)
                        }
                      >
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSemester(sem.id);
                            }}
                            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors duration-200"
                          >
                            {expandedSems.includes(sem.id) ? (
                              <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                          <span
                            className={`text-sm ${
                              selection.semesterSelections[sem.id]?.selected
                                ? "text-orange-500 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            Semester {sem.semesterNumber}
                          </span>
                        </div>
                        {renderCheckbox(
                          selection.semesterSelections[sem.id]?.selected ||
                            false,
                          selection.semesterSelections[sem.id]?.indeterminate
                        )}
                      </div>

                      {expandedSems.includes(sem.id) && (
                        <div className="ml-8 mt-2">
                          <div className="flex flex-wrap gap-4">
                            {sem.divisions
                              .sort((a, b) =>
                                a.divisionName.localeCompare(b.divisionName)
                              )
                              .map((div) => (
                                <div
                                  key={div.id}
                                  className={`flex flex-col items-center bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-200 min-w-[120px] cursor-pointer ${
                                    selection.semesterSelections[
                                      sem.id
                                    ]?.divisions.includes(div.id)
                                      ? "ring-2 ring-orange-500"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    handleDivisionSelect(
                                      sem.id,
                                      div.id,
                                      sem.divisions
                                    )
                                  }
                                >
                                  {renderCheckbox(
                                    selection.semesterSelections[
                                      sem.id
                                    ]?.divisions.includes(div.id) || false
                                  )}
                                  <span
                                    className={`text-sm mt-2 ${
                                      selection.semesterSelections[
                                        sem.id
                                      ]?.divisions.includes(div.id)
                                        ? "text-orange-500 font-medium"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    Division {div.divisionName}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcademicTreeSelect;
