"use client";

import { Card } from "@/components/ui/Card";
import { DASHBOARD_STATS } from "@/lib/apiEndPoints";
import {
    AcademicCapIcon,
    // BoltIcon,
    BookOpenIcon,
    BuildingOfficeIcon,
    ClipboardDocumentListIcon,
    // DocumentPlusIcon,
    UserGroupIcon,
    // UserIcon,
    // UserPlusIcon,
    ViewColumnsIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CountUp from "react-countup";
import { toast } from "react-hot-toast";

interface DashboardStats {
    responseCount: number;
    facultyCount: number;
    subjectCount: number;
    studentCount: number;
    departmentCount: number;
    divisionCount: number;
    semesterCount: number;
}

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
}

// interface QuickActionCardProps {
//   title: string;
//   icon: React.ComponentType<{ className?: string }>;
//   onClick: () => void;
// }

const StatCard = ({ title, value, icon: Icon, onClick }: StatCardProps) => (
    <Card
        onClick={onClick}
        className="relative overflow-hidden cursor-pointer bg-white hover:bg-primary-lighter border border-secondary-lighter transition-all duration-300 hover:shadow-lg rounded-2xl group"
    >
        <div className="absolute top-0 left-0 w-2 h-full bg-primary-dark transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
        <div className="p-4 flex justify-between items-center">
            <div className="space-y-1">
                <p className="text-base font-medium text-secondary-dark">
                    {title}
                </p>
                <p className="text-4xl font-bold text-secondary-darker group-hover:text-primary-dark">
                    <CountUp
                        end={value}
                        duration={2}
                        separator=","
                        enableScrollSpy={true}
                        scrollSpyOnce={true}
                    />
                </p>
            </div>
            <Icon className="h-14 w-14 text-primary-dark group-hover:text-primary-dark" />
        </div>
    </Card>
);

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [currentDate, setCurrentDate] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            // Retrieve the token from localStorage
            const token = localStorage.getItem("token");

            if (!token) {
                toast.error(
                    "Authentication token not found. Please log in to view dashboard."
                );
                router.push("/login"); // Redirect to login page if no token
                setStats(null);
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json", // Assuming JSON content for these GET requests
            };

            try {
                // Fetch dashboard statistics
                const dashboardStatsResponse = await fetch(DASHBOARD_STATS, {
                    headers,
                });
                const dashboardStatsData = await dashboardStatsResponse.json();
                console.log("Dashboard Stats Data:", dashboardStatsData);

                if (
                    !dashboardStatsResponse.ok ||
                    dashboardStatsData.status === "error"
                ) {
                    throw new Error(
                        dashboardStatsData.message ||
                            "Failed to fetch dashboard stats."
                    );
                }

                setStats({
                    ...dashboardStatsData.data,
                });
            } catch (error: any) {
                console.error("Error fetching dashboard data:", error);
                toast.error(error.message || "Failed to load dashboard data.");
                setStats(null);
            }
        };

        fetchDashboardData();

        setCurrentDate(
            new Date().toLocaleDateString("en-US", {
                // Corrected toLocaleDateString typo
                month: "long",
                day: "numeric",
                year: "numeric",
            })
        );
    }, [router]);

    return (
        <div className="min-h-screen bg-secondary-lighter">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6 md:py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content - Right Side */}
                    <div className="lg:w-full space-y-8">
                        {/* Header Section */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-secondary-lighter">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-secondary-darker flex items-center gap-2">
                                        Dashboard Overview
                                        <ChartBarIcon className="h-6 w-6 text-primary-dark" />
                                    </h1>
                                    <p className="text-sm md:text-base text-secondary-dark flex items-center gap-1 mt-1">
                                        <ArrowTrendingUpIcon className="h-4 w-4 text-positive-lighter0" />
                                        System metrics and quick actions
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-3 text-sm md:text-base mb-1">
                                        <div className="flex items-center gap-2 bg-primary-lighter px-3 py-1 rounded-md">
                                            <ChartBarIcon className="h-4 w-4 text-primary-dark" />
                                            <span className="font-medium text-primary-dark">
                                                <CountUp
                                                    end={
                                                        stats?.responseCount ||
                                                        0
                                                    }
                                                    duration={2}
                                                    separator=","
                                                    enableScrollSpy={true}
                                                    scrollSpyOnce={true}
                                                />{" "}
                                                Responses
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-secondary-dark">
                                        Last updated
                                    </p>
                                    <p className="font-medium">{currentDate}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard
                                title="Faculty"
                                value={stats?.facultyCount || 0}
                                icon={AcademicCapIcon}
                                onClick={() => router.push("/faculty")}
                            />
                            <StatCard
                                title="Students"
                                value={stats?.studentCount || 0}
                                icon={UserGroupIcon}
                                onClick={() => router.push("/student")}
                            />
                            <StatCard
                                title="Departments"
                                value={stats?.departmentCount || 0}
                                icon={BuildingOfficeIcon}
                                onClick={() => router.push("/department")}
                            />
                            <StatCard
                                title="Divisions"
                                value={stats?.divisionCount || 0}
                                icon={ViewColumnsIcon}
                                onClick={() => router.push("/division")}
                            />
                            <StatCard
                                title="Subjects"
                                value={stats?.subjectCount || 0}
                                icon={BookOpenIcon}
                                onClick={() => router.push("/subject")}
                            />
                            <StatCard
                                title="Semesters"
                                value={stats?.semesterCount || 0}
                                icon={ClipboardDocumentListIcon}
                                onClick={() => router.push("/semester")}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
