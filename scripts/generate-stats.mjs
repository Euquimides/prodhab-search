// Precomputa las estadísticas del dataset en build (npm run build lo ejecuta vía prebuild).
// Genera public/estadisticas.json para que la página no descargue el índice completo (~28 MB).
import { readFileSync, writeFileSync } from "node:fs";
import { calculateStatistics } from "../src/utils/statisticsCalculator.ts";

const dataset = JSON.parse(readFileSync("public/indice-resoluciones-prodhab.json", "utf8"));
const stats = calculateStatistics(dataset);

// Recorta campos pesados que la página no usa
if (stats.clusterAnalysis) {
  for (const cluster of stats.clusterAnalysis.clusters) {
    delete cluster.centroid;
    delete cluster.members;
  }
  delete stats.clusterAnalysis.outlierIndices;
  for (const p of stats.clusterAnalysis.scatterData) {
    p.x = Math.round(p.x * 1e4) / 1e4;
    p.y = Math.round(p.y * 1e4) / 1e4;
    delete p.recordIndex;
  }
}

writeFileSync("public/estadisticas.json", JSON.stringify(stats));
console.log(
  `estadisticas.json generado: ${stats.totalRecords} resoluciones, ${stats.clusterAnalysis?.numClusters ?? 0} grupos`,
);
