"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import {
    Loader2,
    TrendingUp,
    TrendingDown,
    Minus,
    BarChart3,
    Users,
    Download, // Added for download icon
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
    API_ACADEMIC_YEARS,
    GET_ALL_FACULTY_PERFORMANCE_FOR_YEAR,
} from "@/lib/apiEndPoints";

interface SelectedAcademicYearDisplayProps {
    academicYears: { id: string; yearString: string }[];
    selectedAcademicYear: string;
    placeholder: string;
}

interface FacultyPerformanceData {
    facultyId: string;
    Faculty_name: string;
    academic_year: string;
    total_average: number | null;
    "semester 1": number | null;
    "semester 2": number | null;
    "semester 3": number | null;
    "semester 4": number | null;
    "semester 5": number | null;
    "semester 6": number | null;
    "semester 7": number | null;
    "semester 8": number | null;
}

interface AcademicYear {
    id: string;
    yearString: string;
}

const SelectedAcademicYearDisplay: React.FC<
    SelectedAcademicYearDisplayProps
> = ({ academicYears, selectedAcademicYear, placeholder }) => {
    const displayString = academicYears.find(
        (y) => y.id === selectedAcademicYear
    )?.yearString;

    return <>{displayString || placeholder}</>;
};

const HolisticAnalytics: React.FC = () => {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [selectedAcademicYear, setSelectedAcademicYear] =
        useState<string>("");
    const [facultyPerformanceData, setFacultyPerformanceData] = useState<
        FacultyPerformanceData[]
    >([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Fetch academic years on component mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const academicYearsResponse = await fetch(API_ACADEMIC_YEARS);

                if (academicYearsResponse.ok) {
                    const academicYearsData =
                        await academicYearsResponse.json();

                    const yearsArray = Array.isArray(
                        academicYearsData.academicYears
                    )
                        ? academicYearsData.academicYears
                        : [];

                    console.log("Academic Years Response:", academicYearsData);

                    setAcademicYears(yearsArray);

                    // Auto-select the most recent academic year if available
                    if (yearsArray.length > 0) {
                        const firstYearId = yearsArray[0].id;
                        setSelectedAcademicYear(firstYearId);
                        console.log("Selected Academic Year:", firstYearId);
                    }
                } else {
                    const errorDetailsYears = !academicYearsResponse.ok
                        ? `Status: ${
                              academicYearsResponse.status
                          }, Text: ${await academicYearsResponse.text()}`
                        : "";

                    console.error(
                        "Error fetching initial data. Academic Years:",
                        errorDetailsYears
                    );

                    toast({
                        title: "Error loading initial data",
                        description:
                            "Failed to load academic years. Please try again.",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error("Network error fetching initial data:", error);
                toast({
                    title: "Network Error",
                    description:
                        "Could not connect to the server to load initial data.",
                    variant: "destructive",
                });
            } finally {
                setInitialLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch faculty performance data when academic year is selected or initial load completes
    const fetchAllFacultyPerformance = React.useCallback(async () => {
        if (!selectedAcademicYear) {
            console.warn(
                "No academic year selected, skipping fetchAllFacultyPerformance."
            );
            return;
        }

        setLoading(true);
        setFacultyPerformanceData([]); // Clear previous data while loading
        try {
            const response = await fetch(
                `${GET_ALL_FACULTY_PERFORMANCE_FOR_YEAR}/${selectedAcademicYear}`
            );

            if (response.ok) {
                const data: FacultyPerformanceData[] = await response.json();
                setFacultyPerformanceData(data);
            } else {
                const errorText = await response.text();
                console.error(
                    `Error fetching all faculty performance data: ${response.status}`,
                    errorText
                );
                toast({
                    title: "Error loading performance data",
                    description: `Failed to load faculty performance data: ${
                        errorText || response.statusText
                    }.`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error(
                "Network error fetching all faculty performance data:",
                error
            );
            toast({
                title: "Network Error",
                description:
                    "Could not connect to the server to load performance data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [selectedAcademicYear]);

    useEffect(() => {
        if (selectedAcademicYear && !initialLoading) {
            fetchAllFacultyPerformance();
        }
    }, [selectedAcademicYear, initialLoading, fetchAllFacultyPerformance]);

    const getScoreColor = (score: number | null): string => {
        if (score === null) return "text-secondary-main";
        if (score >= 4.0) return "text-positive-dark";
        if (score >= 3.0) return "text-warning-main";
        return "text-negative-main";
    };

    const getScoreBadgeVariant = (
        score: number | null
    ): "default" | "secondary" | "destructive" | "outline" => {
        if (score === null) return "outline";
        if (score >= 4.0) return "default";
        if (score >= 3.0) return "secondary";
        return "destructive";
    };

    const getTrendIcon = (score: number | null) => {
        if (score === null)
            return (
                <Minus
                    className="h-4 w-4 text-secondary-lighter0"
                    aria-label="No trend data"
                />
            );
        if (score >= 4.0)
            return (
                <TrendingUp
                    className="h-4 w-4 text-positive-dark"
                    aria-label="Positive trend"
                />
            );
        if (score >= 3.0)
            return (
                <Minus
                    className="h-4 w-4 text-warning-main"
                    aria-label="Neutral trend"
                />
            );
        return (
            <TrendingDown
                className="h-4 w-4 text-negative-main"
                aria-label="Negative trend"
            />
        );
    };

    const calculateOverallAverage = (): number | null => {
        const validAverages = (
            Array.isArray(facultyPerformanceData) ? facultyPerformanceData : []
        )
            .map((faculty) => faculty.total_average)
            .filter((avg) => avg !== null) as number[];

        if (validAverages.length === 0) return null;

        const sum = validAverages.reduce((acc, avg) => acc + avg, 0);
        return parseFloat((sum / validAverages.length).toFixed(2));
    };

    const handleDownloadCSV = () => {
        const safeData = Array.isArray(facultyPerformanceData)
            ? facultyPerformanceData
            : [];
        if (safeData.length === 0) {
            toast({
                title: "No data to export",
                description:
                    "There is no faculty performance data to download.",
                variant: "default",
            });
            return;
        }

        const headers = [
            "Faculty Name",
            "Academic Year",
            ...Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`),
            "Overall Average",
        ];

        const csvContent = [
            headers.join(","),
            ...safeData.map((faculty) =>
                [
                    faculty.Faculty_name,
                    academicYears.find((y) => y.id === faculty.academic_year)
                        ?.yearString || "N/A",
                    ...Array.from(
                        { length: 8 },
                        (_, i) =>
                            faculty[
                                `semester ${
                                    i + 1
                                }` as keyof FacultyPerformanceData
                            ] ?? "N/A"
                    ),
                    faculty.total_average ?? "N/A",
                ].join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `faculty_performance_${
                academicYears.find((y) => y.id === selectedAcademicYear)
                    ?.yearString || "data"
            }.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Download Initiated",
            description: "Faculty performance data is being downloaded.",
            variant: "default",
        });
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2
                        className="h-12 w-12 animate-spin text-primary-dark mx-auto mb-4"
                        aria-hidden="true"
                    />
                    <div className="text-xl font-semibold text-secondary-dark">
                        Loading initial data...
                    </div>
                    <div className="text-secondary-lighter0 mt-2">
                        Please wait while we fetch the data
                    </div>
                </div>
            </div>
        );
    }

    const overallAverage = calculateOverallAverage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <BarChart3 className="h-10 w-10 text-primary-dark" />
                        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-secondary-darker to-secondary-dark bg-clip-text text-transparent">
                            Holistic Faculty Analytics
                        </h1>
                    </div>
                    <p className="text-secondary-dark text-lg max-w-2xl mx-auto">
                        Comprehensive performance analysis and insights for
                        academic excellence
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-primary-lighter to-primary-lighter border-t-4 border-t-primary-dark">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-primary-darker">
                                        Total Faculties
                                    </p>
                                    <p className="text-3xl font-bold text-primary-darker">
                                        {Array.isArray(facultyPerformanceData)
                                            ? facultyPerformanceData.length
                                            : 0}
                                    </p>
                                </div>
                                <Users className="h-8 w-8 text-primary-dark" />
                            </div>
                        </CardContent>
                    </Card>

                    {overallAverage !== null && (
                        <Card className="border-0 shadow-lg bg-gradient-to-br from-highlight1-lighter to-highlight1-lighter border-t-4 border-t-highlight1-main">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-highlight1-darker">
                                            Overall Average
                                        </p>
                                        <p
                                            className={`text-3xl font-bold ${getScoreColor(
                                                overallAverage
                                            )}`}
                                        >
                                            {overallAverage}
                                        </p>
                                    </div>
                                    <div className="text-highlight1-dark">
                                        {getTrendIcon(overallAverage)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-positive-lighter to-positive-lighter border-t-4 border-t-positive-lighter0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-positive-dark">
                                        Excellent (≥4.0)
                                    </p>
                                    <p className="text-3xl font-bold text-positive-dark">
                                        {
                                            (Array.isArray(
                                                facultyPerformanceData
                                            )
                                                ? facultyPerformanceData
                                                : []
                                            ).filter(
                                                (f) =>
                                                    f.total_average !== null &&
                                                    f.total_average >= 4.0
                                            ).length
                                        }
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-positive-dark" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-negative-lighter to-negative-lighter border-t-4 border-t-negative-main">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-negative-dark">
                                        Needs Improvement (&lt;3.0)
                                    </p>
                                    <p className="text-3xl font-bold text-negative-dark">
                                        {
                                            (Array.isArray(
                                                facultyPerformanceData
                                            )
                                                ? facultyPerformanceData
                                                : []
                                            ).filter(
                                                (f) =>
                                                    f.total_average !== null &&
                                                    f.total_average < 3.0
                                            ).length
                                        }
                                    </p>
                                </div>
                                <TrendingDown className="h-8 w-8 text-negative-main" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Card */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-secondary-lighter to-secondary-lighter border-b">
                        <CardTitle className="text-2xl font-semibold text-secondary-darker flex items-center gap-2">
                            <div className="w-2 h-8 bg-primary-dark rounded-full"></div>
                            Filters & Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-grow space-y-2">
                                <label
                                    htmlFor="academic-year-select"
                                    className="text-sm font-semibold text-secondary-dark block"
                                >
                                    Select Academic Year
                                </label>
                                <Select
                                    value={selectedAcademicYear}
                                    onValueChange={setSelectedAcademicYear}
                                >
                                    <SelectTrigger
                                        id="academic-year-select"
                                        className="h-12 border-2 border-secondary-lighter focus:border-primary-dark transition-colors w-full"
                                        aria-label="Select academic year"
                                    >
                                        <SelectedAcademicYearDisplay
                                            academicYears={academicYears}
                                            selectedAcademicYear={
                                                selectedAcademicYear
                                            }
                                            placeholder="Select academic year"
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.isArray(academicYears) &&
                                        academicYears.length > 0
                                            ? academicYears.map((year) => (
                                                  <SelectItem
                                                      key={year.id}
                                                      value={year.id}
                                                      aria-label={`Academic year ${year.yearString}`}
                                                  >
                                                      {year.yearString}
                                                  </SelectItem>
                                              ))
                                            : null}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-4 w-full sm:w-auto">
                                <Button
                                    onClick={fetchAllFacultyPerformance}
                                    disabled={!selectedAcademicYear || loading}
                                    className="flex-grow h-12 bg-gradient-to-r from-primary-dark to-primary-darker hover:from-primary-darker hover:to-primary-darker text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
                                    aria-label="Refresh data for selected academic year"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2
                                                className="mr-2 h-5 w-5 animate-spin"
                                                aria-hidden="true"
                                            />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <BarChart3 className="mr-2 h-5 w-5" />
                                            Refresh Data
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleDownloadCSV}
                                    disabled={
                                        !Array.isArray(
                                            facultyPerformanceData
                                        ) ||
                                        facultyPerformanceData.length === 0 ||
                                        loading
                                    }
                                    className="flex-grow h-12 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
                                    aria-label="Download faculty performance data as CSV"
                                >
                                    <Download className="mr-2 h-5 w-5" />
                                    Download CSV
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Faculty Performance Table */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-secondary-lighter to-secondary-lighter border-b">
                        <CardTitle className="text-2xl font-semibold text-secondary-darker flex items-center gap-2">
                            <div className="w-2 h-8 bg-primary-dark rounded-full"></div>
                            Faculty Performance Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-secondary-dark">
                                <Loader2
                                    className="h-8 w-8 animate-spin mb-4 text-primary-dark"
                                    aria-hidden="true"
                                />
                                <div className="text-lg font-medium">
                                    Loading faculty performance data...
                                </div>
                                <div className="text-secondary-lighter0 mt-2">
                                    Analyzing performance metrics
                                </div>
                            </div>
                        ) : (Array.isArray(facultyPerformanceData)
                              ? facultyPerformanceData
                              : []
                          ).length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-secondary-main mb-4">
                                    <BarChart3 className="h-16 w-16 mx-auto" />
                                </div>
                                <div className="text-xl font-medium text-secondary-dark mb-2">
                                    No Performance Data Available
                                </div>
                                <div className="text-secondary-lighter0">
                                    No performance data available for the
                                    selected academic year.
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gradient-to-r from-secondary-lighter to-secondary-lighter">
                                            <TableHead className="w-[250px] py-4 px-6 text-left font-bold text-secondary-dark">
                                                Faculty Name
                                            </TableHead>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(
                                                (sem) => (
                                                    <TableHead
                                                        key={sem}
                                                        className="py-4 px-4 text-center font-bold text-secondary-dark min-w-[80px]"
                                                    >
                                                        Sem {sem}
                                                    </TableHead>
                                                )
                                            )}
                                            <TableHead className="py-4 px-4 text-center font-bold text-secondary-dark min-w-[100px]">
                                                Overall Avg
                                            </TableHead>
                                            <TableHead className="py-4 px-4 text-center font-bold text-secondary-dark min-w-[80px]">
                                                Trend
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(Array.isArray(facultyPerformanceData)
                                            ? facultyPerformanceData
                                            : []
                                        ).map((faculty, index) => (
                                            <TableRow
                                                key={faculty.facultyId}
                                                className={`transition-colors duration-200 hover:bg-secondary-lighter ${
                                                    index % 2 === 0
                                                        ? "bg-white"
                                                        : "bg-secondary-lighter/50"
                                                }`}
                                            >
                                                <TableCell className="py-4 px-6 font-medium text-secondary-darker border-r border-secondary-lighter">
                                                    {faculty.Faculty_name}
                                                </TableCell>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(
                                                    (sem) => {
                                                        const semesterScore =
                                                            faculty[
                                                                `semester ${sem}` as keyof FacultyPerformanceData
                                                            ];
                                                        return (
                                                            <TableCell
                                                                key={sem}
                                                                className="py-4 px-4 text-center"
                                                            >
                                                                {semesterScore !==
                                                                null ? (
                                                                    <Badge
                                                                        variant={getScoreBadgeVariant(
                                                                            semesterScore as number
                                                                        )}
                                                                        className="min-w-[60px] py-1 px-2 text-sm font-semibold"
                                                                        aria-label={`Semester ${sem} score: ${semesterScore}`}
                                                                    >
                                                                        {
                                                                            semesterScore
                                                                        }
                                                                    </Badge>
                                                                ) : (
                                                                    <span
                                                                        className="text-secondary-main text-lg"
                                                                        aria-label={`No data for semester ${sem}`}
                                                                    >
                                                                        -
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                        );
                                                    }
                                                )}
                                                <TableCell className="py-4 px-4 text-center border-l border-secondary-lighter">
                                                    {faculty.total_average !==
                                                    null ? (
                                                        <Badge
                                                            variant={getScoreBadgeVariant(
                                                                faculty.total_average
                                                            )}
                                                            className="min-w-[70px] py-1 px-3 text-sm font-bold"
                                                            aria-label={`Overall average score: ${faculty.total_average}`}
                                                        >
                                                            {
                                                                faculty.total_average
                                                            }
                                                        </Badge>
                                                    ) : (
                                                        <span
                                                            className="text-secondary-main text-lg"
                                                            aria-label="No overall average data"
                                                        >
                                                            -
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-4 px-4 text-center">
                                                    <div className="flex justify-center">
                                                        {getTrendIcon(
                                                            faculty.total_average
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default HolisticAnalytics;
