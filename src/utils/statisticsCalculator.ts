/**
 * Calculadora de estadísticas para el conjunto de resoluciones PRODHAB
 * Proporciona un análisis estadístico integral del conjunto de datos
 */

export interface DataRecord {
  id: string;
  metadatos: {
    expediente?: string;
    resolucion?: string;
    anio?: number | null;
    fecha?: string;
    hora?: string | null;
    lugar?: string | null;
    resultado?: string;
    tipo_procedimiento?: string | null;
    denunciante?: string | null;
    denunciado?: string;
    recurso_disponible?: string | null;
    firmante?: string;
    elaborado_por?: string | null;
    resoluciones_citadas?: string[];
    archivo_origen?: string;
  };
  titulo: string;
  secciones?: {
    resultando?: string;
    considerando?: string;
    por_tanto?: string;
  };
  texto: string;
  vector?: number[];
}

export interface DatasetMetadata {
  titulo: string;
  descripcion: string;
  publicador: string;
  fecha_generacion: string;
  licencia: string;
  idioma: string;
  formato: string;
  total_registros: number;
  modelo_embedding?: string;
  dimension_embedding?: number;
  modelo_ia_utilizado?: string; // legacy field
}

export interface Dataset {
  metadatos: DatasetMetadata;
  datos: DataRecord[];
}

export interface BasicStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  stddev: number;
}

export interface VectorDimensionStats {
  dimension: number;
  min: number;
  max: number;
  mean: number;
  median: number;
}

export interface Cluster {
  id: number;
  centroid: number[];
  members: number[];
  size: number;
}

export interface ScatterPoint {
  x: number;
  y: number;
  expediente: string;
  resolucion: string;
  clusterId: number;
  recordIndex: number;
}

export interface ClusterAnalysis {
  numClusters: number;
  clusters: Cluster[];
  outlierCount: number;
  outlierIndices: number[];
  mostPopulated: { clusterId: number; size: number };
  leastPopulated: { clusterId: number; size: number };
  clusterDistributionOverTime: { [year: string]: { [clusterId: string]: number } };
  scatterData: ScatterPoint[];
}

export interface DatasetStatistics {
  totalRecords: number;
  uniqueExpedientes: number;
  uniqueResoluciones: number;
  recordsPerYear: { [year: string]: number };
  earliestDate: string | null;
  latestDate: string | null;
  recordsPerSourceFile: { [source: string]: number };
  languageDistribution: { [lang: string]: number };
  licenseDistribution: { [license: string]: number };
  missingMetadata: {
    expediente: number;
    resolucion: number;
    fecha: number;
    vector: number;
    archivoOrigen: number;
    denunciante: number;
    recursoDisponible: number;
    elaboradoPor: number;
    secciones: number;
  };
  recursoDisponibleDistribution: { [recurso: string]: number };
  resultadoDistribution: { [resultado: string]: number };
  tipoProcedimientoDistribution: { [tipo: string]: number };
  firmantesTop: { firmante: string; count: number }[];
  vectorLengthStats: BasicStats | null;
  vectorNormStats: BasicStats | null;
  vectorDimensionStats: VectorDimensionStats[];
  vectorValueDistribution: {
    overall: { min: number; max: number; mean: number; stddev: number };
    histogram: { bin: string; count: number }[];
  } | null;
  clusterAnalysis: ClusterAnalysis | null;
}

// Funciones auxiliares
function parseDate(dateStr: string): Date | null {
  // Formato: YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
}

function getYearFromDate(dateStr: string): string | null {
  const date = parseDate(dateStr);
  return date ? date.getFullYear().toString() : null;
}

function calculateBasicStats(values: number[]): BasicStats {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stddev: 0 };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
  
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stddev = Math.sqrt(variance);
  
  return { min, max, mean, median, stddev };
}

function calculateVectorNorm(vector: number[]): number {
  return Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

// Implementación de agrupamiento K-means
function kMeansClustering(
  vectors: number[][],
  k: number,
  maxIterations: number = 100
): { assignments: number[]; centroids: number[][] } {
  if (vectors.length === 0 || k <= 0) {
    return { assignments: [], centroids: [] };
  }
  
  const dimensions = vectors[0].length;
  
  // Inicializar los centroides usando el método de k-means++ para una mejor convergencia
  const centroids: number[][] = [];
  const usedIndices = new Set<number>();
  
  // Primer centroide: elige un punto aleatorio
  const firstIdx = 0;
  centroids.push([...vectors[firstIdx]]);
  usedIndices.add(firstIdx);
  
  // Selecciona los siguientes centroides basados en la distancia al centroide más cercano
  while (centroids.length < k && centroids.length < vectors.length) {
    let maxDist = -1;
    let bestIdx = 0;
    
    for (let i = 0; i < vectors.length; i++) {
      if (usedIndices.has(i)) continue;
      
      let minDistToCentroid = Infinity;
      for (const centroid of centroids) {
        const dist = euclideanDistance(vectors[i], centroid);
        minDistToCentroid = Math.min(minDistToCentroid, dist);
      }
      
      if (minDistToCentroid > maxDist) {
        maxDist = minDistToCentroid;
        bestIdx = i;
      }
    }
    
    centroids.push([...vectors[bestIdx]]);
    usedIndices.add(bestIdx);
  }
  
  let assignments: number[] = new Array(vectors.length).fill(0);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Paso de asignación
    const newAssignments: number[] = [];
    for (const vector of vectors) {
      let minDist = Infinity;
      let closestCentroid = 0;
      
      for (let c = 0; c < centroids.length; c++) {
        const dist = euclideanDistance(vector, centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          closestCentroid = c;
        }
      }
      
      newAssignments.push(closestCentroid);
    }
    
    // Verificar convergencia
    let changed = false;
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i] !== newAssignments[i]) {
        changed = true;
        break;
      }
    }
    
    assignments = newAssignments;
    
    if (!changed) break;
    
    // Paso de actualización
    for (let c = 0; c < centroids.length; c++) {
      const clusterVectors = vectors.filter((_, i) => assignments[i] === c);
      if (clusterVectors.length === 0) continue;
      
      const newCentroid = new Array(dimensions).fill(0);
      for (const v of clusterVectors) {
        for (let d = 0; d < dimensions; d++) {
          newCentroid[d] += v[d];
        }
      }
      for (let d = 0; d < dimensions; d++) {
        newCentroid[d] /= clusterVectors.length;
      }
      centroids[c] = newCentroid;
    }
  }
  
  return { assignments, centroids };
}

// Implementación simple de PCA para proyección 2D
function pca2D(vectors: number[][]): { x: number; y: number }[] {
  if (vectors.length === 0) return [];
  
  const n = vectors.length;
  const dims = vectors[0].length;
  
  // Calcular la media de cada dimensión
  const means: number[] = new Array(dims).fill(0);
  for (const v of vectors) {
    for (let d = 0; d < dims; d++) {
      means[d] += v[d];
    }
  }
  for (let d = 0; d < dims; d++) {
    means[d] /= n;
  }
  
  // Centrar los datos restando la media
  const centered = vectors.map(v => v.map((val, d) => val - means[d]));
  
  // Usar iteración de potencia para encontrar los dos primeros componentes principales
  // Este es un enfoque simplificado: proyectaremos en las dos dimensiones con mayor varianza
  const variances: { dim: number; variance: number }[] = [];
  for (let d = 0; d < dims; d++) {
    let variance = 0;
    for (const v of centered) {
      variance += v[d] * v[d];
    }
    variances.push({ dim: d, variance });
  }
  
  // Ordenar por varianza y tomar las dos principales dimensiones
  variances.sort((a, b) => b.variance - a.variance);
  const dim1 = variances[0].dim;
  const dim2 = variances[1].dim;
  
  // Proyectar en estas dos dimensiones
  return centered.map(v => ({ x: v[dim1], y: v[dim2] }));
}

// Detecta valores atípicos usando la distancia al centroide del clúster
function detectOutliers(
  vectors: number[][],
  assignments: number[],
  centroids: number[][],
  threshold: number = 2.0
): number[] {
  const outliers: number[] = [];
  
  // Calcula la distancia media para cada clúster
  const clusterDistances: { [key: number]: number[] } = {};
  for (let i = 0; i < vectors.length; i++) {
    const clusterId = assignments[i];
    const dist = euclideanDistance(vectors[i], centroids[clusterId]);
    if (!clusterDistances[clusterId]) {
      clusterDistances[clusterId] = [];
    }
    clusterDistances[clusterId].push(dist);
  }
  
  // Calcula la media y desviación estándar para cada clúster
  const clusterStats: { [key: number]: { mean: number; stddev: number } } = {};
  for (const [clusterId, distances] of Object.entries(clusterDistances)) {
    const stats = calculateBasicStats(distances);
    clusterStats[parseInt(clusterId)] = { mean: stats.mean, stddev: stats.stddev };
  }
  
  // Identifica valores atípicos
  for (let i = 0; i < vectors.length; i++) {
    const clusterId = assignments[i];
    const dist = euclideanDistance(vectors[i], centroids[clusterId]);
    const { mean, stddev } = clusterStats[clusterId];
    
    if (stddev > 0 && (dist - mean) / stddev > threshold) {
      outliers.push(i);
    }
  }
  
  return outliers;
}

export function calculateStatistics(dataset: Dataset): DatasetStatistics {
  const { metadatos, datos } = dataset;
  
  // Conteos básicos
  const totalRecords = datos.length;
  
  // Seguimiento de valores únicos
  const expedientes = new Set<string>();
  const resoluciones = new Set<string>();
  const recordsPerYear: { [year: string]: number } = {};
  const recordsPerSourceFile: { [source: string]: number } = {};
  
  // Conteo de metadatos faltantes
  const missingMetadata = {
    expediente: 0,
    resolucion: 0,
    fecha: 0,
    vector: 0,
    archivoOrigen: 0,
    denunciante: 0,
    recursoDisponible: 0,
    elaboradoPor: 0,
    secciones: 0,
  };

  const recursoDisponibleDistribution: { [recurso: string]: number } = {};
  const resultadoDistribution: { [resultado: string]: number } = {};
  const tipoProcedimientoDistribution: { [tipo: string]: number } = {};
  const firmanteCounts: { [firmante: string]: number } = {};
  
  // Seguimiento de fechas
  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;
  
  // Estadísticas de vectores
  const vectorLengths: number[] = [];
  const vectorNorms: number[] = [];
  const allVectors: number[][] = [];
  const recordDates: (string | null)[] = [];
  const vectorToRecordMap: number[] = []; // Maps vector index to original record index
  
  // Procesa cada registro
  for (let recordIdx = 0; recordIdx < datos.length; recordIdx++) {
    const record = datos[recordIdx];
    const meta = record.metadatos || {};
    
    // Expediente
    if (meta.expediente) {
      expedientes.add(meta.expediente);
    } else {
      missingMetadata.expediente++;
    }
    
    // Resolución
    if (meta.resolucion) {
      resoluciones.add(meta.resolucion);
    } else {
      missingMetadata.resolucion++;
    }
    
    // Fecha
    if (meta.fecha) {
      const date = parseDate(meta.fecha);
      const year = getYearFromDate(meta.fecha);
      recordDates.push(year);
      
      if (date) {
        if (!earliestDate || date < earliestDate) {
          earliestDate = date;
        }
        if (!latestDate || date > latestDate) {
          latestDate = date;
        }
        
        if (year) {
          recordsPerYear[year] = (recordsPerYear[year] || 0) + 1;
        }
      }
    } else {
      missingMetadata.fecha++;
      recordDates.push(null);
    }
    
    // Archivo origen
    if (meta.archivo_origen) {
      const parts = meta.archivo_origen.split('/');
      const filename = parts[parts.length - 1] || meta.archivo_origen;
      recordsPerSourceFile[filename] = (recordsPerSourceFile[filename] || 0) + 1;
    } else {
      missingMetadata.archivoOrigen++;
    }

    // Resultado
    if (meta.resultado) {
      resultadoDistribution[meta.resultado] = (resultadoDistribution[meta.resultado] || 0) + 1;
    }

    // Tipo de procedimiento
    if (meta.tipo_procedimiento) {
      tipoProcedimientoDistribution[meta.tipo_procedimiento] = (tipoProcedimientoDistribution[meta.tipo_procedimiento] || 0) + 1;
    }

    // Firmante
    if (meta.firmante) {
      firmanteCounts[meta.firmante] = (firmanteCounts[meta.firmante] || 0) + 1;
    }

    // Denunciante
    if (!meta.denunciante) {
      missingMetadata.denunciante++;
    }

    // Recurso disponible
    if (meta.recurso_disponible) {
      recursoDisponibleDistribution[meta.recurso_disponible] = (recursoDisponibleDistribution[meta.recurso_disponible] || 0) + 1;
    } else {
      missingMetadata.recursoDisponible++;
    }

    // Elaborado por
    if (!meta.elaborado_por) {
      missingMetadata.elaboradoPor++;
    }

    // Secciones
    if (!record.secciones) {
      missingMetadata.secciones++;
    }

    // Vector
    if (record.vector && Array.isArray(record.vector) && record.vector.length > 0) {
      vectorLengths.push(record.vector.length);
      vectorNorms.push(calculateVectorNorm(record.vector));
      allVectors.push(record.vector);
      vectorToRecordMap.push(recordIdx);
    } else {
      missingMetadata.vector++;
    }
  }
  
  // Calcula estadísticas de los vectores
  let vectorLengthStats: BasicStats | null = null;
  let vectorNormStats: BasicStats | null = null;
  let vectorDimensionStats: VectorDimensionStats[] = [];
  let vectorValueDistribution: { overall: BasicStats; histogram: { bin: string; count: number }[] } | null = null;
  
  if (allVectors.length > 0) {
    vectorLengthStats = calculateBasicStats(vectorLengths);
    vectorNormStats = calculateBasicStats(vectorNorms);
    
    // Estadísticas por dimensión (muestra las primeras dimensiones y el patrón general)
    const numDimensions = allVectors[0].length;
    const dimensionsToShow = Math.min(10, numDimensions); // Show first 10 dimensions
    
    for (let d = 0; d < dimensionsToShow; d++) {
      const dimValues = allVectors.map(v => v[d]);
      const stats = calculateBasicStats(dimValues);
      vectorDimensionStats.push({
        dimension: d,
        ...stats,
      });
    }
    
    // Distribución general de valores de los vectores
    const allValues = allVectors.flat();
    const overallStats = calculateBasicStats(allValues);
    
    // Crea los intervalos del histograma
    const numBins = 20;
    const range = overallStats.max - overallStats.min;
    let histogram: { bin: string; count: number }[] = [];
    if (range === 0) {
      // Todos los valores son iguales, crea un solo intervalo
      const singleValue = overallStats.min;
      const count = allValues.length;
      const binLabel = `${singleValue.toFixed(2)}`;
      histogram.push({ bin: binLabel, count });
    } else {
      const binWidth = range / numBins;
      for (let i = 0; i < numBins; i++) {
        const binStart = overallStats.min + i * binWidth;
        const binEnd = binStart + binWidth;
        const binLabel = `${binStart.toFixed(2)} to ${binEnd.toFixed(2)}`;
        const count = allValues.filter(v => v >= binStart && (i === numBins - 1 ? v <= binEnd : v < binEnd)).length;
        histogram.push({ bin: binLabel, count });
      }
    }
    vectorValueDistribution = { overall: overallStats, histogram };
  }
  
  // Clustering analysis
  let clusterAnalysis: ClusterAnalysis | null = null;
  
  if (allVectors.length > 10) {
    // Determina el número de clústeres (usando una aproximación del método del codo)
    const numClusters = Math.min(8, Math.ceil(Math.sqrt(allVectors.length / 2)));
    
    const { assignments, centroids } = kMeansClustering(allVectors, numClusters);
    const outlierIndices = detectOutliers(allVectors, assignments, centroids);
    
    // Construye la información de los clústeres
    const clusters: Cluster[] = [];
    for (let c = 0; c < centroids.length; c++) {
      const members = assignments
        .map((a, i) => a === c ? i : -1)
        .filter(i => i !== -1);
      
      clusters.push({
        id: c,
        centroid: centroids[c],
        members,
        size: members.length,
      });
    }
    
    // Encuentra el más y el menos poblado
    const sortedBySize = [...clusters].sort((a, b) => b.size - a.size);
    const mostPopulated = { clusterId: sortedBySize[0].id, size: sortedBySize[0].size };
    const leastPopulated = {
      clusterId: sortedBySize[sortedBySize.length - 1].id,
      size: sortedBySize[sortedBySize.length - 1].size,
    };
    
    // Distribución de clústeres a lo largo del tiempo
    const clusterDistributionOverTime: { [year: string]: { [clusterId: string]: number } } = {};
    
    for (let i = 0; i < assignments.length; i++) {
      const recordIdx = vectorToRecordMap[i];
      const year = recordDates[recordIdx];
      if (year) {
        if (!clusterDistributionOverTime[year]) {
          clusterDistributionOverTime[year] = {};
        }
        const clusterId = assignments[i].toString();
        clusterDistributionOverTime[year][clusterId] = 
          (clusterDistributionOverTime[year][clusterId] || 0) + 1;
      }
    }
    
    // Genera la proyección 2D para el diagrama de dispersión
    const projection2D = pca2D(allVectors);
    
    // Construye los datos de dispersión con metadatos
    const scatterData: ScatterPoint[] = [];
    for (let i = 0; i < assignments.length; i++) {
      const recordIdx = vectorToRecordMap[i];
      const record = datos[recordIdx];
      const meta = record.metadatos || {};
      
      scatterData.push({
        x: projection2D[i].x,
        y: projection2D[i].y,
        expediente: meta.expediente || 'N/A',
        resolucion: meta.resolucion || 'N/A',
        clusterId: assignments[i],
        recordIndex: recordIdx,
      });
    }
    
    clusterAnalysis = {
      numClusters,
      clusters,
      outlierCount: outlierIndices.length,
      outlierIndices,
      mostPopulated,
      leastPopulated,
      clusterDistributionOverTime,
      scatterData,
    };
  }
  
  // Top firmantes
  const firmantesTop = Object.entries(firmanteCounts)
    .map(([firmante, count]) => ({ firmante, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Distribución de idioma y licencia (desde los metadatos del conjunto de datos)
  const languageDistribution: { [lang: string]: number } = {
    [metadatos.idioma || 'unknown']: totalRecords,
  };
  
  const licenseDistribution: { [license: string]: number } = {
    [metadatos.licencia || 'unknown']: totalRecords,
  };
  
  return {
    totalRecords,
    uniqueExpedientes: expedientes.size,
    uniqueResoluciones: resoluciones.size,
    recordsPerYear,
    earliestDate: earliestDate ? earliestDate.toLocaleDateString('es-CR') : null,
    latestDate: latestDate ? latestDate.toLocaleDateString('es-CR') : null,
    recordsPerSourceFile,
    languageDistribution,
    licenseDistribution,
    missingMetadata,
    vectorLengthStats,
    vectorNormStats,
    vectorDimensionStats,
    vectorValueDistribution,
    clusterAnalysis,
    recursoDisponibleDistribution,
    resultadoDistribution,
    tipoProcedimientoDistribution,
    firmantesTop,
  };
}
