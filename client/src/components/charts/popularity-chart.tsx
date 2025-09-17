import { useEffect, useRef } from "react";
import { Chart, ChartConfiguration } from "chart.js/auto";
import type { UserToolWithTool } from "@shared/schema";

interface PopularityChartProps {
  userTools: UserToolWithTool[];
}

const getToolPopularityScore = (tool: UserToolWithTool['tool']): number => {
  const raw = tool?.metrics?.popularity ?? tool?.popularityScore ?? tool?.popularity?.score ?? null;
  const numeric = typeof raw === 'number' ? raw : raw !== null && raw !== undefined ? parseFloat(raw) : NaN;
  return Number.isFinite(numeric) ? numeric : 0;
};

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
      "High (80-100)": 0,
      "Rising (60-79)": 0,
      "Steady (40-59)": 0,
      "Early (<40)": 0,
    };

    userTools.forEach((item) => {
      const score = getToolPopularityScore(item.tool);

      if (score >= 80) {
        popularityBuckets["High (80-100)"]++;
      } else if (score >= 60) {
        popularityBuckets["Rising (60-79)"]++;
      } else if (score >= 40) {
        popularityBuckets["Steady (40-59)"]++;
      } else {
        popularityBuckets["Early (<40)"]++;
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
