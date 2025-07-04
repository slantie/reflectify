"use client";

import { Card } from "@/components/ui/Card";
import { DASHBOARD_STATS, GET_TOTAL_RESPONSES } from "@/lib/apiEndPoints";
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

interface DashboardStats {
    facultyCount: number;
    subjectCount: number;
    studentCount: number;
    departmentCount: number;
    divisionCount: number;
    semesterCount: number;
    totalResponses: number;
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
        className="relative overflow-hidden cursor-pointer bg-white hover:bg-orange-50 border border-gray-100 transition-all duration-300 hover:shadow-lg rounded-2xl group"
    >
        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
        <div className="p-4 flex justify-between items-center">
            <div className="space-y-1">
                <p className="text-base font-medium text-gray-600">{title}</p>
                <p className="text-4xl font-bold text-gray-900 group-hover:text-orange-600">
                    <CountUp
                        end={value}
                        duration={2}
                        separator=","
                        enableScrollSpy={true}
                        scrollSpyOnce={true}
                    />
                </p>
            </div>
            <Icon className="h-14 w-14 text-orange-500 group-hover:text-orange-600" />
        </div>
    </Card>
);

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [currentDate, setCurrentDate] = useState("");

    useEffect(() => {
        fetch(DASHBOARD_STATS)
            .then((res) => res.json())
            .then(setStats);

        setCurrentDate(
            new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            })
        );
    }, []);
    useEffect(() => {
        Promise.all([
            fetch(DASHBOARD_STATS).then((res) => res.json()),
            fetch(GET_TOTAL_RESPONSES).then((res) => res.json()),
        ]).then(([dashboardStats, responsesData]) => {
            setStats({
                ...dashboardStats,
                totalResponses: responsesData.data.totalUniqueResponses,
            });
        });

        setCurrentDate(
            new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            })
        );
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6 md:py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content - Right Side */}
                    <div className="lg:w-full space-y-8">
                        {/* Header Section */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                                        Dashboard Overview
                                        <ChartBarIcon className="h-6 w-6 text-orange-500" />
                                    </h1>
                                    <p className="text-sm md:text-base text-gray-600 flex items-center gap-1 mt-1">
                                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                                        System metrics and quick actions
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-3 text-sm md:text-base mb-1">
                                        <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-md">
                                            <ChartBarIcon className="h-4 w-4 text-orange-500" />
                                            <span className="font-medium text-orange-600">
                                                <CountUp
                                                    end={
                                                        stats?.totalResponses ||
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
                                    <p className="text-gray-600">
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
