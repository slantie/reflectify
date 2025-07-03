"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import GroupedBarChart from "@/components/commonanalytics/groupedBarChart";
import { GET_ALL_SEMDIVS, SUBJECT_RATING } from "@/lib/apiEndPoints";

interface Division {
  divisionId: string;
  divisionName: string;
  studentCount: number;
  responseCount: number;
}

interface SemesterData {
  semesterId: string;
  semesterNumber: number;
  academicYear: string;
  divisions: Division[];
}

export interface SubjectRatingData {
  subjectName: string;
  lectureAverage: number;
  labAverage: number;
  totalLectureResponses: number;
  totalLabResponses: number;
  semesterNumber: number;
  semesterId: string;
  divisionId: string;
  divisionName?: string;
}
export default function AnalyticsDashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [semesterData, setSemesterData] = useState<SemesterData[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("0");
  const [selectedDivision, setSelectedDivision] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);
  const [subjectRatingsData, setSubjectRatingsData] = useState<
    SubjectRatingData[] | null
  >(null);

  useEffect(() => {
    setIsMounted(true);
    fetchSemesterData();
  }, []);

  const fetchSemesterData = async () => {
    setLoading(true);
    try {
      const response = await fetch(GET_ALL_SEMDIVS);
      if (!response.ok) throw new Error();
      const { data } = await response.json();
      setSemesterData(data);
    } catch {
      toast.error("Failed to load semester data");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSemesterDivisions = () => {
    if (selectedSemester === "0") {
      return [
        {
          divisionId: "ALL",
          divisionName: "ALL",
          studentCount: 0,
          responseCount: 0,
        },
      ];
    }
    const currentSemester = semesterData.find(
      (sem) => sem.semesterId === selectedSemester
    );
    return currentSemester?.divisions || [];
  };

  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemester(semesterId || "0");
    setSelectedDivision("ALL");
  };

  const fetchSubjectRatings = async () => {
    try {
      const response = await fetch(
        `${SUBJECT_RATING}${
          selectedSemester || "All"
        }&divisionId=${selectedDivision || ""}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      return data.subjectData;
    } catch (error) {
      toast.error("Failed to load subject ratings");
      return null;
    }
  };

  const filterSubjectData = (data: SubjectRatingData[]) => {
    // Get division name for selected division
    const selectedDivisionName =
      selectedDivision === "ALL"
        ? "ALL"
        : getCurrentSemesterDivisions().find(
            (div) => div.divisionId === selectedDivision
          )?.divisionName;

    return data.filter((subject) => {
      // When showing all semesters (0), only show entries with divisionName 'ALL'
      if (parseInt(selectedSemester) === 0) {
        return subject.divisionName === "ALL";
      }

      // For specific semesters, show only that semester's data
      const semesterMatch =
        subject.semesterNumber ===
        semesterData.find((sem) => sem.semesterId === selectedSemester)
          ?.semesterNumber;

      const divisionMatch = subject.divisionName === selectedDivisionName;

      return semesterMatch && divisionMatch;
    });
  };

  useEffect(() => {
    const getSubjectData = async () => {
      setLoading(true);
      const data = await fetchSubjectRatings();
      setSubjectRatingsData(data);
      setLoading(false);
    };

    getSubjectData();
  }, [selectedSemester, selectedDivision]);

  if (!isMounted) return null;

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
              Analytics Dashboard
            </h1>
          </div>

          {/* Filters Section */}
          <Card className="bg-white shadow-sm border border-orange-100 p-6 rounded-2xl">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-xl">
                  <ChartBarIcon className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Select Filters
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Semester Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Semester
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => handleSemesterChange(e.target.value)}
                    className="w-full p-2.5 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Semesters</option>
                    {semesterData.map((sem) => (
                      <option key={sem.semesterId} value={sem.semesterId}>
                        Semester {sem.semesterNumber} ({sem.academicYear})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Division Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Division
                  </label>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    disabled={selectedSemester === "0"}
                    className="w-full p-2.5 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="ALL">All Divisions</option>
                    {getCurrentSemesterDivisions().map((div) => (
                      <option key={div.divisionId} value={div.divisionId}>
                        Division {div.divisionName} ({div.responseCount}{" "}
                        responses)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Analytics Display */}
          <Card className="bg-white shadow-sm border border-orange-100 rounded-2xl">
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              </div>
            ) : !selectedSemester ? (
              <div className="h-[400px] flex items-center justify-center">
                <p className="text-gray-500">
                  Select a semester to view analytics
                </p>
              </div>
            ) : (
              subjectRatingsData && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Subject-wise Lecture & Lab Rating
                  </h2>
                  <GroupedBarChart
                    data={filterSubjectData(subjectRatingsData)}
                  />
                </>
              )
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
