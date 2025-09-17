import { useEffect, useRef } from "react";
import { Chart, ChartConfiguration } from "chart.js/auto";
import type { CostTrendsResponse } from "@shared/schema";

interface CostTrendsChartProps {
  trendsData: CostTrendsResponse;
  isLoading?: boolean;
}

export function CostTrendsChart({ trendsData, isLoading }: CostTrendsChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || isLoading) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Handle empty state
    if (!trendsData.data || trendsData.data.length === 0) {
      ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);
      ctx.fillStyle = "#6b7280";
      ctx.font = "14px Inter";
      ctx.textAlign = "center";
      ctx.fillText("No cost history available", chartRef.current.width / 2, chartRef.current.height / 2);
      ctx.fillText("Start tracking costs by adding tools to your stack", chartRef.current.width / 2, chartRef.current.height / 2 + 20);
      return;
    }

    // Prepare data for chart
    const labels = trendsData.data.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const data = trendsData.data.map(point => point.totalCost);

    // Determine trend color based on summary
    const getTrendColor = () => {
      switch (trendsData.summary.trend) {
        case 'up': return 'hsl(0, 84%, 60%)'; // Red for increased costs
        case 'down': return 'hsl(142, 71%, 45%)'; // Green for decreased costs
        default: return 'hsl(221, 83%, 53%)'; // Blue for stable
      }
    };

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Monthly Cost",
            data,
            borderColor: getTrendColor(),
            backgroundColor: `${getTrendColor()}20`, // 20% opacity
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: getTrendColor(),
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false, // Hide legend since we only have one dataset
          },
          tooltip: {
            backgroundColor: 'hsl(0, 0%, 9%)',
            titleColor: 'hsl(0, 0%, 98%)',
            bodyColor: 'hsl(0, 0%, 98%)',
            borderColor: 'hsl(217, 32%, 17%)',
            borderWidth: 1,
            cornerRadius: 6,
            padding: 12,
            callbacks: {
              title: function(context) {
                if (context.length > 0) {
                  const dataIndex = context[0].dataIndex;
                  const date = new Date(trendsData.data[dataIndex].date);
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                }
                return '';
              },
              label: function(context) {
                const value = context.parsed.y;
                return `Total Cost: $${value.toFixed(2)}/month`;
              },
              afterLabel: function(context) {
                if (context.dataIndex > 0) {
                  const currentCost = context.parsed.y;
                  const previousCost = data[context.dataIndex - 1];
                  const change = currentCost - previousCost;
                  const changePercentage = previousCost > 0 ? (change / previousCost) * 100 : 0;
                  
                  if (Math.abs(change) > 0.01) {
                    const direction = change > 0 ? '↑' : '↓';
                    const color = change > 0 ? 'increased' : 'decreased';
                    return `${direction} ${color} by $${Math.abs(change).toFixed(2)} (${Math.abs(changePercentage).toFixed(1)}%)`;
                  }
                }
                return '';
              }
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: 'hsl(217, 32%, 17%)',
            },
            ticks: {
              color: 'hsl(215, 20%, 65%)',
              font: {
                size: 12,
              },
              maxTicksLimit: 8, // Limit number of x-axis labels
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'hsl(217, 32%, 17%)',
            },
            ticks: {
              color: 'hsl(215, 20%, 65%)',
              font: {
                size: 12,
              },
              callback: function(value) {
                return `$${Number(value).toFixed(0)}`;
              },
            },
          },
        },
        elements: {
          point: {
            hoverBackgroundColor: getTrendColor(),
          },
        },
      },
    };

    chartInstance.current = new Chart(ctx, config);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [trendsData, isLoading]);

  if (isLoading) {
    return (
      <div className="relative h-[300px] w-full flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[300px] w-full">
      <canvas ref={chartRef} data-testid="chart-cost-trends"></canvas>
    </div>
  );
}