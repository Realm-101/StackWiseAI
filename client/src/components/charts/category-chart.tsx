import { useEffect, useRef } from "react";
import { Chart, ChartConfiguration } from "chart.js/auto";
import type { UserToolWithTool } from "@shared/schema";

interface CategoryChartProps {
  userTools: UserToolWithTool[];
}

export function CategoryChart({ userTools }: CategoryChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Calculate cost by category
    const categoryData: Record<string, number> = {};
    
    userTools.forEach((item) => {
      const category = item.tool.category;
      const cost = parseFloat(item.monthlyCost || "0");
      categoryData[category] = (categoryData[category] || 0) + cost;
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    if (labels.length === 0) {
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
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              "hsl(221 83% 53%)", // primary
              "hsl(158 64% 52%)", // secondary
              "hsl(262 83% 58%)", // accent
              "hsl(217 91% 60%)", // blue
              "hsl(24 74% 58%)",  // orange
              "hsl(142 71% 45%)", // green
              "hsl(280 100% 70%)", // purple
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed;
                const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + (b || 0), 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
              },
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
      <canvas ref={chartRef} data-testid="chart-category"></canvas>
    </div>
  );
}
