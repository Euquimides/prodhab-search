"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Scatter, Doughnut } from "react-chartjs-2";
import Footer from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import {
  calculateStatistics,
  DatasetStatistics,
  Dataset,
} from "@/utils/statisticsCalculator";
import { RESULTADO_LABELS } from "@/context/SearchContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

const colors = {
  primary: "rgba(59, 130, 246, 0.8)",
  primaryBorder: "rgba(59, 130, 246, 1)",
  // Cluster palette: 4 system hues × 2 opacity tiers — no off-system colors
  palette: [
    "rgba(37, 99, 235, 0.75)",   // Civic Blue — full
    "rgba(99, 102, 241, 0.75)",  // Indigo Signal — full
    "rgba(16, 185, 129, 0.75)",  // Ledger Green — full
    "rgba(245, 158, 11, 0.75)",  // Amber — full
    "rgba(37, 99, 235, 0.42)",   // Civic Blue — light
    "rgba(99, 102, 241, 0.42)",  // Indigo Signal — light
    "rgba(16, 185, 129, 0.42)",  // Ledger Green — light
    "rgba(245, 158, 11, 0.42)",  // Amber — light
  ],
  paletteBorder: [
    "rgba(37, 99, 235, 1)",
    "rgba(99, 102, 241, 1)",
    "rgba(16, 185, 129, 1)",
    "rgba(245, 158, 11, 1)",
    "rgba(37, 99, 235, 0.65)",
    "rgba(99, 102, 241, 0.65)",
    "rgba(16, 185, 129, 0.65)",
    "rgba(245, 158, 11, 0.65)",
  ],
};

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  chartLabel?: string;
  headingLevel?: "h2" | "h3";
}

function ChartCard({ title, children, className = "", chartLabel, headingLevel: Heading = "h3" }: ChartCardProps) {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 ${className}`}
    >
      <Heading className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        {title}
      </Heading>
      <div className="relative" {...(chartLabel ? { role: "img", "aria-label": chartLabel } : {})}>{children}</div>
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
      <div role="status" aria-live="polite" className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400 mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Calculando estadísticas, esto puede tardar unos segundos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/30">
          <p className="font-medium text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Theme-aware chart colors
  const gridColor = isDark ? "rgba(147, 165, 235, 0.07)" : "rgba(37, 99, 235, 0.05)";
  const tickColor = isDark ? "#a3a3a3" : "#737373";

  const resultadoKeys = Object.keys(stats.resultadoDistribution).sort(
    (a, b) => stats.resultadoDistribution[b] - stats.resultadoDistribution[a],
  );
  const resultadoData = {
    labels: resultadoKeys.map((k) => RESULTADO_LABELS[k as keyof typeof RESULTADO_LABELS] ?? k),
    datasets: [
      {
        label: "Resoluciones",
        data: resultadoKeys.map((k) => stats.resultadoDistribution[k]),
        backgroundColor: colors.palette,
        borderColor: colors.paletteBorder,
        borderWidth: 2,
      },
    ],
  };

  const recursoKeys = Object.keys(stats.recursoDisponibleDistribution).sort(
    (a, b) => stats.recursoDisponibleDistribution[b] - stats.recursoDisponibleDistribution[a],
  );
  const recursoData = {
    labels: recursoKeys,
    datasets: [
      {
        label: "Resoluciones",
        data: recursoKeys.map((k) => stats.recursoDisponibleDistribution[k]),
        backgroundColor: colors.palette,
        borderColor: colors.paletteBorder,
        borderWidth: 2,
      },
    ],
  };

  const yearsKeys = Object.keys(stats.recordsPerYear).sort();
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

  const clusterSizeData = stats.clusterAnalysis
    ? {
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

  const clusterTimeData = stats.clusterAnalysis
    ? (() => {
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

  const scatterData = stats.clusterAnalysis
    ? (() => {
        const clusters = stats.clusterAnalysis.clusters;
        const scatterPoints = stats.clusterAnalysis.scatterData;

        const datasets = clusters.map((cluster, idx) => {
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
          label: function (context: { dataset: { label?: string }; raw: unknown }) {
            const raw = context.raw as { expediente?: string };
            return `Expediente: ${raw.expediente || "N/A"}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: false },
        grid: { color: gridColor },
        ticks: { display: false },
      },
      y: {
        title: { display: false },
        grid: { color: gridColor },
        ticks: { display: false },
      },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      <SiteHeader subtitle="Estadísticas" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Estadísticas del conjunto de datos
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-prose">
            {stats.totalRecords.toLocaleString("es-CR")} resoluciones de{" "}
            {stats.uniqueExpedientes.toLocaleString("es-CR")} expedientes únicos,
            desde {stats.earliestDate?.slice(0, 4) ?? "N/A"} hasta{" "}
            {stats.latestDate?.slice(0, 4) ?? "N/A"}.
          </p>
        </div>

        {/* Records per Year */}
        <section className="mb-8 sm:mb-12">
          <ChartCard title="Resoluciones por año" headingLevel="h2" chartLabel="Gráfico de barras mostrando la cantidad de resoluciones emitidas por año">
            <div className="h-64 sm:h-80">
              <Bar data={recordsPerYearData} options={barOptions} />
            </div>
          </ChartCard>
        </section>

        {/* Clustering Analysis */}
        {stats.clusterAnalysis && (
          <section className="mb-8 sm:mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Agrupación Temática de Resoluciones
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              Las resoluciones se agruparon automáticamente según su contenido:
              se identificaron{" "}
              <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
                {stats.clusterAnalysis.numClusters} grupos temáticos
              </strong>
              , el mayor con{" "}
              {stats.clusterAnalysis.mostPopulated.size.toLocaleString()}{" "}
              resoluciones y el menor con{" "}
              {stats.clusterAnalysis.leastPopulated.size.toLocaleString()}.
              {stats.clusterAnalysis.outlierCount > 0 && (
                <>
                  {" "}
                  {stats.clusterAnalysis.outlierCount.toLocaleString()}{" "}
                  resoluciones no encajaron en ningún grupo con claridad.
                </>
              )}{" "}
              Resoluciones del mismo color tratan asuntos parecidos.
            </p>
            <details className="mb-6 text-sm group">
              <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline select-none w-fit list-none flex items-center gap-1">
                <svg
                  className="w-3 h-3 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] group-open:rotate-90"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4 2l5 4-5 4V2z" />
                </svg>
                ¿Cómo interpretar esta sección?
              </summary>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400 max-w-2xl">
                El sistema analizó el texto de cada resolución y la ubicó cerca
                de otras con contenido parecido. No se trata de una
                clasificación legal oficial: es una herramienta exploratoria
                para descubrir patrones en el conjunto de datos. Los grupos no
                tienen nombre fijo; su significado emerge al revisar las
                resoluciones que los componen.
              </p>
            </details>

            {/* Scatter Plot - Main visualization */}
            {scatterData && (
              <ChartCard
                title="Mapa de agrupación temática"
                className="mb-6"
                chartLabel="Gráfico de dispersión mostrando resoluciones agrupadas por similitud temática"
              >
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  Cada punto es una resolución. Los puntos del mismo color
                  pertenecen al mismo grupo temático. Pase el cursor sobre un
                  punto para ver el expediente.
                </p>
                <div className="h-96 sm:h-[500px]">
                  <Scatter data={scatterData} options={scatterOptions} />
                </div>
              </ChartCard>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {clusterSizeData && (
                <ChartCard title="Tamaño de cada grupo temático" chartLabel="Gráfico circular mostrando el tamaño relativo de cada grupo temático">
                  <div className="h-64 sm:h-80 flex items-center justify-center">
                    <Doughnut data={clusterSizeData} options={chartOptions} />
                  </div>
                </ChartCard>
              )}

              {clusterTimeData && (
                <ChartCard title="Evolución de grupos temáticos por año" chartLabel="Gráfico de barras apiladas mostrando la distribución de grupos temáticos a lo largo del tiempo">
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
            <div className="mt-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-6 overflow-x-auto">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Detalle de grupos temáticos
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
                    .map((cluster) => {
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
                              aria-hidden="true"
                            />
                            Grupo {cluster.id + 1}
                          </td>
                          <td className="py-2 px-3 text-right text-neutral-700 dark:text-neutral-300">
                            {cluster.size.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right text-neutral-700 dark:text-neutral-300">
                            {percentage}%
                          </td>
                          <td className="py-2 px-3" role="presentation">
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

        {/* Resultado & Recurso disponible */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Resultados y Recursos
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Resultado de las resoluciones" chartLabel="Gráfico circular mostrando la distribución de resultados de las resoluciones">
              <div className="h-64 sm:h-80 flex items-center justify-center">
                <Doughnut data={resultadoData} options={chartOptions} />
              </div>
            </ChartCard>
            <ChartCard title="Recurso disponible" chartLabel="Gráfico circular mostrando la distribución de recursos disponibles">
              <div className="h-64 sm:h-80 flex items-center justify-center">
                <Doughnut data={recursoData} options={chartOptions} />
              </div>
            </ChartCard>
          </div>
        </section>


      </div>
      <Footer />
    </div>
  );
}
