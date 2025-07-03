import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

interface RadarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  };
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      color: ["#FB923C", "#94A3B8"],
      title: {
        // text: "Faculty Performance Analysis",
        textStyle: {
          fontFamily: "Inter",
          color: "#334155",
          fontSize: 18,
          fontWeight: "normal",
        },
      },
      legend: {
        data: data.datasets.map((set) => set.label),
        textStyle: {
          fontFamily: "Inter",
          color: "#475569",
          fontSize: 14,
        },
        bottom: "0%",
        itemGap: 16,
        itemWidth: 12,
        itemHeight: 12,
        icon: "circle",
        padding: [8, 16],
      },
      radar: {
        indicator: data.labels.map((label) => ({ text: label, max: 10 })),
        radius: "65%",
        shape: "circle",
        axisName: {
          fontFamily: "Inter",
          color: "#475569",
          fontSize: 16,
        },
        splitArea: {
          areaStyle: {
            color: [
              "rgba(255, 255, 255, 1)",
              "rgba(248, 250, 252, 0.9)", // Cool white
              "rgba(255, 255, 255, 1)",
              "rgba(248, 250, 252, 0.9)",
            ],
          },
        },
        axisLine: {
          lineStyle: {
            color: "rgba(148, 163, 184, 0.4)",
            width: 1,
          },
        },
        splitLine: {
          lineStyle: {
            color: "rgba(148, 163, 184, 0.3)",
            width: 1,
          },
        },
      },
      series: data.datasets.map((dataset) => ({
        type: "radar",
        name: dataset.label,
        symbol: "circle",
        symbolSize: 12, // Increased dot size
        data: [
          {
            value: dataset.data,
            name: dataset.label,
            lineStyle: {
              width: 3, // Increased line thickness
              shadowColor: "rgba(0, 0, 0, 0.3)",
              shadowBlur: 10,
            },
            areaStyle: {
              opacity: 0.3,
              shadowColor: "rgba(0, 0, 0, 0.2)",
              shadowBlur: 15,
            },
          },
        ],
        emphasis: {
          focus: "series",
          areaStyle: {
            opacity: 0.6,
          },
          itemStyle: {
            borderWidth: 3,
          },
        },
      })),
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      chart.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, [data]);

  return <div ref={chartRef} style={{ width: "100%", height: "500px" }} />;
};

export default RadarChart;
