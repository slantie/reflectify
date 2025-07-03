"use client";

import GroupedBarChart from "@/components/analytics/groupChart";
import LineChart from "@/components/analytics/lineChart";
import RadarChart from "@/components/analytics/radarChart";
import {
  GET_ALL_FACULTIES,
  GET_SUBJECTS,
  GROUPED_BAR_CHART,
  LINE_CHART,
  RADAR_CHART,
  SUBJECT_WISE,
} from "@/lib/apiEndPoints";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Faculty {
  id: string;
  name: string;
  abbreviation: string;
}

interface RadarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

interface Subject {
  id: string;
  name: string;
  abbreviation: string;
  subjectCode: string;
}

interface SubjectPerformance {
  facultyId: string;
  facultyName: string;
  facultyAbbr: string;
  divisionId: string;
  divisionName: string;
  type: string;
  batch: string;
  averageScore: number;
  responseCount: number;
}

interface SubjectWiseData {
  lectures: SubjectPerformance[];
  labs: SubjectPerformance[];
}

export default function ReportsPage() {
  const router = useRouter();
  const [radarData, setRadarData] = useState<RadarChartData | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [groupedBarData, setGroupedBarData] = useState<any>(null);
  const [lineChartData, setLineChartData] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [subjectWiseData, setSubjectWiseData] =
    useState<SubjectWiseData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFaculties = async () => {
    try {
      const response = await fetch(GET_ALL_FACULTIES);
      const data = await response.json();
      setFaculties(data || []);
      if (data && data.length > 0) {
        setSelectedFacultyId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching faculties:", error);
      setFaculties([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(GET_SUBJECTS);
      const data = await response.json();
      setSubjects(data || []);
      if (data && data.length > 0) {
        setSelectedSubjectId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    }
  };

  const fetchRadarData = async (facultyId: string) => {
    try {
      const response = await fetch(RADAR_CHART, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyId }),
      });
      const data = await response.json();
      setRadarData(data);
    } catch (error) {
      console.error("Error fetching radar data:", error);
    }
  };

  const fetchGroupedBarData = async (facultyId: string) => {
    try {
      const response = await fetch(GROUPED_BAR_CHART, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyId }),
      });
      const data = await response.json();
      setGroupedBarData(data);
    } catch (error) {
      console.error("Error fetching grouped bar data:", error);
    }
  };

  const fetchLineChartData = async (facultyId: string) => {
    try {
      const response = await fetch(LINE_CHART, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyId }),
      });
      const data = await response.json();
      setLineChartData(data);
    } catch (error) {
      console.error("Error fetching line chart data:", error);
    }
  };

  const fetchSubjectWiseData = async (subjectId: string) => {
    try {
      const response = await fetch(SUBJECT_WISE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId }),
      });
      const data = await response.json();
      setSubjectWiseData(data);
    } catch (error) {
      console.error("Error fetching subject wise data:", error);
    }
  };

  useEffect(() => {
    fetchFaculties();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedFacultyId) {
      fetchRadarData(selectedFacultyId);
      fetchGroupedBarData(selectedFacultyId);
      fetchLineChartData(selectedFacultyId);
      const faculty = faculties.find((f) => f.id === selectedFacultyId);
      setSelectedFaculty(faculty || null);
    }
  }, [selectedFacultyId, faculties]);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchSubjectWiseData(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1920px] mx-auto px-8 py-10">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-orange-100 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-semibold text-gray-900">
              Faculty Analytics Center
            </h1>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-white rounded-2xl shadow-md border border-orange-100 p-8">
            <div className="flex items-center justify-between">
              <div className="pr-8 space-y-2">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Faculty Performance Analytics
                </h2>
                <p className="text-gray-600">
                  Select a faculty member to view their detailed analytics
                </p>
              </div>
              <div className="relative w-96">
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full appearance-none rounded-lg border-2 border-gray-200 bg-white px-4 py-3 pr-10 text-lg shadow-sm transition-colors hover:border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                >
                  {Array.isArray(faculties) &&
                    faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name} ({faculty.abbreviation})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-10">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-800">
                  Performance Overview
                </h3>
                <div>
                  {selectedFacultyId && radarData && (
                    <RadarChart data={radarData} />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-800">
                  Subject-wise Comparison
                </h3>
                <div>
                  {groupedBarData && <GroupedBarChart data={groupedBarData} />}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-800">
                  Performance Trends
                </h3>
                <div>{lineChartData && <LineChart data={lineChartData} />}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl shadow-md border border-blue-100 p-8">
            <div className="flex items-center justify-between">
              <div className="pr-8 space-y-2">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Subject-wise Performance Analysis
                </h2>
                <p className="text-gray-600">
                  Select a subject to view faculty performance across divisions
                </p>
              </div>
              <div className="relative w-96">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full appearance-none rounded-lg border-2 border-gray-200 bg-white px-4 py-3 pr-10 text-lg shadow-sm transition-colors hover:border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                >
                  {Array.isArray(subjects) &&
                    subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.subjectCode})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {subjectWiseData && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-xl font-medium text-gray-800 mb-6">
                  Lecture Performance
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  {subjectWiseData.lectures.map((lecture, idx) => (
                    <div
                      key={idx}
                      className="bg-orange-50 rounded-lg p-6 border border-orange-100"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">
                            Division {lecture.divisionName}
                          </span>
                          <span className="text-sm font-medium text-gray-500">
                            Responses: {lecture.responseCount}
                          </span>
                        </div>
                        <h4 className="text-lg font-medium text-gray-800">
                          {lecture.facultyName}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {lecture.facultyAbbr}
                          </span>
                          <span className="text-2xl font-semibold text-orange-600">
                            {lecture.averageScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-xl font-medium text-gray-800 mb-6">
                  Lab Performance
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  {subjectWiseData.labs.map((lab, idx) => (
                    <div
                      key={idx}
                      className="bg-blue-50 rounded-lg p-6 border border-blue-100"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">
                            Division {lab.divisionName} (Batch {lab.batch})
                          </span>
                          <span className="text-sm font-medium text-gray-500">
                            Responses: {lab.responseCount}
                          </span>
                        </div>
                        <h4 className="text-lg font-medium text-gray-800">
                          {lab.facultyName}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {lab.facultyAbbr}
                          </span>
                          <span className="text-2xl font-semibold text-blue-600">
                            {lab.averageScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
