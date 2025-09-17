import { useEffect, useRef } from "react";
import { Chart, ChartConfiguration } from "chart.js/auto";
import type { UserToolWithTool } from "@shared/schema";

interface PopularityChartProps {
  userTools: UserToolWithTool[];
}

export function PopularityChart({ userTools }: PopularityChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Categorize tools by popularity score
    const popularityBuckets = {
      "High (9+)": 0,
      "Medium (7-9)": 0,
      "Growing (5-7)": 0,
      "Early (<5)": 0,
    };

    userTools.forEach((item) => {
      const score = parseFloat(item.tool.popularityScore || "0");
      
      if (score >= 9) {
        popularityBuckets["High (9+)"]++;
      } else if (score >= 7) {
        popularityBuckets["Medium (7-9)"]++;
      } else if (score >= 5) {
        popularityBuckets["Growing (5-7)"]++;
      } else {
        popularityBuckets["Early (<5)"]++;
      }
    });

    const labels = Object.keys(popularityBuckets);
    const data = Object.values(popularityBuckets);

    if (userTools.length === 0) {
      // Show empty state
      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);
        ctx.fillStyle = "#6b7280";
        ctx.font = "14px Inter";
        ctx.textAlign = "center";
        ctx.fillText("No data available", chartRef.current.width / 2, chartRef.current.height / 2);
      }
      return;
    }

    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Number of Tools",
            data,
            backgroundColor: "hsl(158 64% 52%)", // secondary color
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                return `${value} tool${value !== 1 ? 's' : ''}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    };

    chartInstance.current = new Chart(chartRef.current, config);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [userTools]);

  return (
    <div className="relative h-[300px] w-full">
      <canvas ref={chartRef} data-testid="chart-popularity"></canvas>
    </div>
  );
}
