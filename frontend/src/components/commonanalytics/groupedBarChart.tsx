"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface SubjectRatingData {
  subjectName: string;
  lectureAverage: number;
  labAverage: number;
  totalLectureResponses: number;
  totalLabResponses: number;
}

interface GroupedBarChartProps {
  data: SubjectRatingData[];
}

const GroupedBarChart: React.FC<GroupedBarChartProps> = ({ data }) => {
  const chartOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 440,
      stacked: true,
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    colors: ["#fb923c", "#94a3b8"],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "50%",
        borderRadius: 6,
        columnWidth: "70%",
        distributed: false,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: false,
      style: {
        fontSize: "12px",
        fontFamily: "Inter",
      },
    },
    stroke: {
      width: 0,
      curve: "smooth",
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      padding: {
        left: 10,
        right: 20, // Added padding from the right side
      },
      strokeDashArray: 4,
    },
    yaxis: {
      min: -10,
      max: 10,
      title: {
        text: "Subjects",
        style: {
          fontSize: "14px",
          fontFamily: "Inter",
          fontWeight: 500,
        },
      },
      labels: {
        style: {
          fontSize: "12px",
          fontFamily: "Inter",
        },
      },
    },
    xaxis: {
      categories: data.map((item) => item.subjectName),
      title: {
        text: "Rating",
        style: {
          fontSize: "14px",
          fontFamily: "Inter",
          fontWeight: 500,
        },
      },
      labels: {
        formatter: (val) => Math.abs(Number(val)).toFixed(0), // Format as integers
        style: {
          fontSize: "12px",
          fontFamily: "Inter",
        },
      },
      tickAmount: 21,
    },
    tooltip: {
      theme: "light",
      style: {
        fontSize: "12px",
        fontFamily: "Inter",
      },
      y: {
        formatter: (val) => Math.abs(val).toFixed(1) + " / 10",
      },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "14px",
      fontFamily: "Inter",
      fontWeight: 500,
        markers: {
            shape: "circle",
            size: 5.5,
        },
    },
  };

  const series = [
    {
      name: "Lecture Rating",
      data: data.map((item) => item.lectureAverage * -1),
    },
    {
      name: "Lab Rating",
      data: data.map((item) => item.labAverage),
    },
  ];

  return (
    <div className="w-full rounded-2xl relative">
      <ReactApexChart
        options={chartOptions}
        series={series}
        type="bar"
        height={400}
      />
    </div>
  );
};

export default GroupedBarChart;
