
<p align="center">
	<img src="public/privatasearch_logo.png" alt="PrivataSearch Logo" width="120" />
</p>

# PrivataSearch: Buscador De Resoluciones Sobre Protección De Datos Personales En Costa Rica

PrivataSearch es un buscador de texto completo e inteligente de resoluciones emitidas por la Agencia de Protección de Datos de los Habitantes (PRODHAB) de Costa Rica. Permite realizar búsquedas rápidas sobre el contenido de las resoluciones despersonalizadas disponibles públicamente. El proyecto opera sin conexión a base de datos: se construye sobre un índice JSON generado a partir del conjunto de resoluciones públicas, siguiendo principios de datos abiertos según la legislación costarricense.

## Funcionalidades

- **Búsqueda de texto completo** sobre el contenido de las resoluciones, usando FlexSearch.
- **Similitud semántica** mediante similitud coseno y Máxima Relevancia Marginal (MMR) para sugerir resoluciones relacionadas con cada resultado.
- **Filtros avanzados**: período (rango de años), resultado de la resolución, tipo de procedimiento, tema jurídico (descriptores) y número de resultados por página.
- **Resaltado de coincidencias** para términos de búsqueda y descriptores jurídicos en los resultados.
- **Página de estadísticas** con métricas del conjunto de datos, distribución temporal, agrupación temática (clustering), y análisis de resultados y recursos, visualizados con Chart.js.
- **Modo oscuro** con persistencia de preferencia del usuario.
- **Sitio completamente estático** exportado como HTML/CSS/JS: no requiere servidor backend.
- **Accesibilidad**: skip-links, roles ARIA, y navegación por teclado.
- **Página de descargo de responsabilidad**.

## Instalación y desarrollo local

1. Clona el repositorio:
	```bash
	git clone https://github.com/Euquimides/prodhab-search.git
	cd prodhab-search
	```
2. Instala las dependencias:
	```bash
	npm install
	```
3. Inicia el servidor de desarrollo:
	```bash
	npm run dev
	```
4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Despliegue en GitHub Pages

El proyecto está configurado para exportar el sitio como estático y desplegarlo automáticamente en GitHub Pages usando GitHub Actions.

### Exportar el sitio manualmente
```bash
npm run build
npx serve out/privatasearch
```
Los archivos estáticos se generan en la carpeta `out/privatasearch`.

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx               — Página principal (buscador)
│   ├── layout.tsx             — Layout raíz y metadatos
│   ├── estadisticas/page.tsx  — Página de estadísticas y gráficas
│   └── disclaimer/page.tsx    — Descargo de responsabilidad
├── components/
│   ├── SearchClient.tsx       — Lógica de búsqueda del lado cliente
│   ├── SearchResults.tsx      — Presentación de resultados
│   ├── SearchConfigPanel.tsx  — Panel de filtros y configuración
│   ├── RelatedResolutions.tsx — Resoluciones relacionadas (MMR)
│   ├── DarkModeToggle.tsx     — Toggle de modo oscuro
│   └── Footer.tsx             — Pie de página
├── context/
│   └── SearchContext.tsx      — Contexto de búsqueda e índice FlexSearch
└── utils/
    ├── semanticSimilarity.ts  — Similitud coseno y algoritmo MMR
    ├── statisticsCalculator.ts — Cálculo de estadísticas del dataset
    └── highlightText.tsx      — Resaltado de términos en resultados

public/
└── indice-resoluciones-prodhab.json  — Índice de resoluciones
```

## Tecnologías utilizadas

- [Next.js](https://nextjs.org/) (exportación estática)
- [React](https://react.dev/)
- [FlexSearch](https://github.com/nextapps-de/flexsearch)
- [Chart.js](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)

## Contribuir

Puedes abrir issues o enviar pull requests (PR) para mejorar el buscador o la interfaz. Para ello realice antes un fork, prueba los cambios respectivos y envíe su PR.

## Licencia

Este proyecto está bajo la licencia MIT.
