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

interface GroupedBarChartProps {
  data: {
    facultyName: string;
    subjects: {
      subjectName: string;
      overallAverage: number;
      facultyAverage: number;
    }[];
  };
}

const GroupedBarChart: React.FC<GroupedBarChartProps> = ({ data }) => {
  return (
    <div style={{ width: "100%", height: 400 }}>
      <h3>Performance Comparison - {data.facultyName}</h3>
      <ResponsiveContainer>
        <BarChart
          data={data.subjects}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="subjectName" />
          <YAxis domain={[0, 10]} tickCount={6} />

          <Tooltip />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
              fontFamily: "Inter",
              color: "#475569",
              fontSize: "14px",
            }}
            iconType="circle"
            iconSize={12}
            verticalAlign="bottom"
          />

          <Bar dataKey="overallAverage" fill="#94a3b8" name="Overall Average" />
          <Bar dataKey="facultyAverage" fill="#fb923c" name="Faculty Average" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GroupedBarChart;
