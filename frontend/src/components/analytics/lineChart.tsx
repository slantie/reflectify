"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LineChartProps {
  data: {
    facultyId: string;
    performanceData: {
      semester: number;
      lectureAverage: number;
      labAverage: number;
    }[];
  };
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  if (!data || !data.performanceData) {
    return null;
  }

  const allSemesters = Array.from({ length: 8 }, (_, i) => ({
    semester: i + 1,
    lectureAverage: null,
    labAverage: null,
  }));

  const completeData = allSemesters.map((sem) => ({
    ...sem,
    ...data.performanceData.find((d) => d.semester === sem.semester),
  }));

  return (
    <div style={{ width: "100%", height: 400 }}>
      <h3>Semester-wise Performance Distribution</h3>
      <ResponsiveContainer>
        <BarChart
          data={completeData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barGap={0}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="semester"
            ticks={[1, 2, 3, 4, 5, 6, 7, 8]}
            label={{
              value: "Semester",
              position: "bottom",
              offset: 0, // Increased offset
            }}
            padding={{ left: 20, right: 20 }}
          />
          <YAxis
            domain={[0, 10]}
            tickCount={6}
            label={{
              value: "Rating",
              angle: -90,
              position: "insideLeft",
              offset: -5,
            }}
            padding={{ top: 20 }}
            tickMargin={8}
            axisLine={true}
            tickLine={true}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
            }}
            iconType="circle"
            iconSize={10}
          />
          <Bar
            dataKey="lectureAverage"
            fill="#fb923c"
            name="Lecture Performance"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="labAverage"
            fill="#94a3b8"
            name="Lab Performance"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
