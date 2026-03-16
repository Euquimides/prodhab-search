"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Scatter, Doughnut } from "react-chartjs-2";
import Footer from "@/components/Footer";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import {
  calculateStatistics,
  DatasetStatistics,
  Dataset,
} from "@/utils/statisticsCalculator";

ChartJS.register(
  // Registrar los componentes de Chart.js
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const colors = {
  // Paleta de colores para los gráficos
  primary: "rgba(59, 130, 246, 0.8)",
  primaryBorder: "rgba(59, 130, 246, 1)",
  secondary: "rgba(16, 185, 129, 0.8)",
  secondaryBorder: "rgba(16, 185, 129, 1)",
  accent: "rgba(245, 158, 11, 0.8)",
  accentBorder: "rgba(245, 158, 11, 1)",
  danger: "rgba(239, 68, 68, 0.8)",
  dangerBorder: "rgba(239, 68, 68, 1)",
  purple: "rgba(139, 92, 246, 0.8)",
  purpleBorder: "rgba(139, 92, 246, 1)",
  pink: "rgba(236, 72, 153, 0.8)",
  pinkBorder: "rgba(236, 72, 153, 1)",
  palette: [
    "rgba(59, 130, 246, 0.7)",
    "rgba(16, 185, 129, 0.7)",
    "rgba(245, 158, 11, 0.7)",
    "rgba(239, 68, 68, 0.7)",
    "rgba(139, 92, 246, 0.7)",
    "rgba(236, 72, 153, 0.7)",
    "rgba(20, 184, 166, 0.7)",
    "rgba(249, 115, 22, 0.7)",
  ],
  paletteBorder: [
    "rgba(59, 130, 246, 1)",
    "rgba(16, 185, 129, 1)",
    "rgba(245, 158, 11, 1)",
    "rgba(239, 68, 68, 1)",
    "rgba(139, 92, 246, 1)",
    "rgba(236, 72, 153, 1)",
    "rgba(20, 184, 166, 1)",
    "rgba(249, 115, 22, 1)",
  ],
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6">
      <h3 className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
        {title}
      </h3>
      <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100 break-words">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, children, className = "" }: ChartCardProps) {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        {title}
      </h3>
      <div className="relative">{children}</div>
    </div>
  );
}

export default function EstadisticasPage() {
  const [stats, setStats] = useState<DatasetStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/indice-resoluciones-prodhab.json");
      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }
      const dataset: Dataset = await response.json();
      const calculatedStats = calculateStatistics(dataset);
      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Calculando estadísticas...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/30">
          <p className="font-medium text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Theme-aware chart colors
  const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";
  const tickColor = isDark ? "#a3a3a3" : "#737373";

  const yearsKeys = Object.keys(stats.recordsPerYear).sort();
  // Preparar datos para los gráficos
  const recordsPerYearData = {
    labels: yearsKeys,
    datasets: [
      {
        label: "Resoluciones por Año",
        data: yearsKeys.map((y) => stats.recordsPerYear[y]),
        backgroundColor: colors.primary,
        borderColor: colors.primaryBorder,
        borderWidth: 2,
      },
    ],
  };

  // Cluster size distribution
  const clusterSizeData = stats.clusterAnalysis
    ? {
        // Distribución del tamaño de los clústeres
        labels: stats.clusterAnalysis.clusters.map(
          (c) => `Grupo ${c.id + 1}`,
        ),
        datasets: [
          {
            label: "Tamaño del grupo",
            data: stats.clusterAnalysis.clusters.map((c) => c.size),
            backgroundColor: colors.palette,
            borderColor: colors.paletteBorder,
            borderWidth: 2,
          },
        ],
      }
    : null;

  // Cluster distribution over time
  const clusterTimeData = stats.clusterAnalysis
    ? (() => {
        // Distribución de clústeres a lo largo del tiempo
        const years = Object.keys(
          stats.clusterAnalysis.clusterDistributionOverTime,
        ).sort();
        const clusters = stats.clusterAnalysis.clusters;

        return {
          labels: years,
          datasets: clusters.map((c, i) => ({
            label: `Grupo ${c.id + 1}`,
            data: years.map(
              (y) =>
                stats.clusterAnalysis!.clusterDistributionOverTime[y]?.[
                  c.id.toString()
                ] || 0,
            ),
            backgroundColor: colors.palette[i % colors.palette.length],
            borderColor: colors.paletteBorder[i % colors.paletteBorder.length],
            borderWidth: 1,
          })),
        };
      })()
    : null;

  // Scatter plot 
  const scatterData = stats.clusterAnalysis
    ? (() => {
        // Datos para el diagrama de dispersión de la visualización de clústeres
        const clusters = stats.clusterAnalysis.clusters;
        const scatterPoints = stats.clusterAnalysis.scatterData;

        // Group points by cluster
        const datasets = clusters.map((cluster, idx) => {
          // Agrupar puntos por clúster
          const clusterPoints = scatterPoints.filter(
            (p) => p.clusterId === cluster.id,
          );
          return {
            label: `Grupo ${cluster.id + 1}`,
            data: clusterPoints.map((p) => ({
              x: p.x,
              y: p.y,
              expediente: p.expediente,
              resolucion: p.resolucion,
            })),
            backgroundColor: colors.palette[idx % colors.palette.length],
            borderColor:
              colors.paletteBorder[idx % colors.paletteBorder.length],
            borderWidth: 1,
            pointRadius: 5,
            pointHoverRadius: 8,
          };
        });

        return { datasets };
      })()
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          color: tickColor,
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      x: {
        grid: { display: false },
        ticks: { color: tickColor },
      },
    },
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          color: tickColor,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const point = context.raw as { expediente?: string };
            return [
              `${context.dataset.label}`,
              `Expediente: ${point.expediente || "N/A"}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Componente Principal 1", color: tickColor },
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
      y: {
        title: { display: true, text: "Componente Principal 2", color: tickColor },
        grid: { color: gridColor },
        ticks: { color: tickColor },
      },
    },
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <div className="flex justify-end px-4 sm:px-6 pt-4 sm:pt-6">
        <DarkModeToggle />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <a
            href="/"
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← Volver al buscador
          </a>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Estadísticas del conjunto de datos
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Análisis estadístico de las resoluciones de PRODHAB
          </p>
        </div>

        {/* Key Metrics */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Métricas Principales
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard
              title="Total de Registros"
              value={stats.totalRecords.toLocaleString()}
              subtitle="Resoluciones en el dataset"
            />
            <StatCard
              title="Expedientes Únicos"
              value={stats.uniqueExpedientes.toLocaleString()}
            />
            <StatCard
              title="Resoluciones Únicas"
              value={stats.uniqueResoluciones.toLocaleString()}
            />
            <StatCard
              title="Fecha Más Antigua"
              value={stats.earliestDate || "N/A"}
            />
            <StatCard
              title="Fecha Más Reciente"
              value={stats.latestDate || "N/A"}
            />
          </div>
        </section>

        {/* Records per Year */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Distribución Temporal
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Resoluciones por Año">
              <div className="h-64 sm:h-80">
                <Bar data={recordsPerYearData} options={barOptions} />
              </div>
            </ChartCard>

            <ChartCard title="Tendencia Anual">
              <div className="h-64 sm:h-80">
                <Line
                  data={{
                    ...recordsPerYearData,
                    datasets: [
                      {
                        ...recordsPerYearData.datasets[0],
                        tension: 0.3,
                        fill: true,
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              </div>
            </ChartCard>
          </div>
        </section>

        {/* Clustering Analysis */}
        {stats.clusterAnalysis && (
          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Análisis de Similitud de Resoluciones
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              Las resoluciones se agrupan por similitud semántica usando
              clustering K-means. Los puntos cercanos representan resoluciones
              con contenido similar.
            </p>

            {/* Clustering summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Grupos de Similitud"
                value={stats.clusterAnalysis.numClusters}
                subtitle="grupos identificados"
              />
              <StatCard
                title="Grupo Más Grande"
                value={stats.clusterAnalysis.mostPopulated.size}
                subtitle={`Grupo ${stats.clusterAnalysis.mostPopulated.clusterId + 1}`}
              />
              <StatCard
                title="Grupo Más Pequeño"
                value={stats.clusterAnalysis.leastPopulated.size}
                subtitle={`Grupo ${stats.clusterAnalysis.leastPopulated.clusterId + 1}`}
              />
              <StatCard
                title="Resoluciones Atípicas"
                value={stats.clusterAnalysis.outlierCount}
                subtitle="casos únicos"
              />
            </div>

            {/* Scatter Plot - Main visualization */}
            {scatterData && (
              <ChartCard
                title="Mapa de Similitud de Resoluciones"
                className="mb-6"
              >
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  Haga clic o pase el cursor sobre los puntos para ver el
                  expediente y resolución. Los colores representan grupos de
                  resoluciones similares.
                </p>
                <div className="h-96 sm:h-[500px]">
                  <Scatter data={scatterData} options={scatterOptions} />
                </div>
              </ChartCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {clusterSizeData && (
                <ChartCard title="Distribución por Grupos">
                  <div className="h-64 sm:h-80 flex items-center justify-center">
                    <Doughnut data={clusterSizeData} options={chartOptions} />
                  </div>
                </ChartCard>
              )}

              {clusterTimeData && (
                <ChartCard title="Evolución de Grupos por Año">
                  <div className="h-64 sm:h-80">
                    <Bar
                      data={clusterTimeData}
                      options={{
                        ...barOptions,
                        scales: {
                          x: {
                            stacked: true,
                            grid: { display: false },
                            ticks: { color: tickColor },
                          },
                          y: {
                            stacked: true,
                            beginAtZero: true,
                            grid: { color: gridColor },
                            ticks: { color: tickColor },
                          },
                        },
                      }}
                    />
                  </div>
                </ChartCard>
              )}
            </div>

            {/* Cluster details table */}
            <div className="mt-6 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 overflow-x-auto">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Detalle de Grupos de Similitud
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th scope="col" className="text-left py-2 px-3 text-neutral-600 dark:text-neutral-400">
                      Grupo
                    </th>
                    <th scope="col" className="text-right py-2 px-3 text-neutral-600 dark:text-neutral-400">
                      Resoluciones
                    </th>
                    <th scope="col" className="text-right py-2 px-3 text-neutral-600 dark:text-neutral-400">
                      % del Total
                    </th>
                    <th scope="col" className="text-left py-2 px-3 text-neutral-600 dark:text-neutral-400">
                      Distribución
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.clusterAnalysis.clusters
                    .sort((a, b) => b.size - a.size)
                    .map((cluster, idx) => {
                      const percentage = (
                        (cluster.size / stats.totalRecords) *
                        100
                      ).toFixed(1);
                      const colorIndex = cluster.id % colors.palette.length;
                      return (
                        <tr
                          key={cluster.id}
                          className="border-b border-neutral-100 dark:border-neutral-800"
                        >
                          <td scope="row" className="py-2 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                            <span
                              className="inline-block w-3 h-3 rounded-full mr-2"
                              style={{
                                backgroundColor: colors.palette[colorIndex],
                              }}
                            />
                            Grupo {cluster.id + 1}
                          </td>
                          <td className="py-2 px-3 text-right text-neutral-700 dark:text-neutral-300">
                            {cluster.size.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-neutral-700 dark:text-neutral-300">
                            {percentage}%
                          </td>
                          <td className="py-2 px-3">
                            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden w-32">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: colors.palette[colorIndex],
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}
