"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type Lang = "en" | "es";

const en: Record<string, string> = {
  "nav.home": "Home",
  "nav.datasets": "Data",
  "nav.alerts": "Tech",
  "nav.about": "About",
  // Datasets
  "datasets.title": "Data Sources & Methodology",
  "datasets.subtitle": "Every data point on OC Infographics is sourced from official U.S. government publications. No estimates, no AI-generated numbers.",
  "datasets.sources": "Primary Sources",
  "datasets.updated": "Updated",
  "datasets.points": "data points",
  "datasets.census.title": "ACS 5-Year Estimates",
  "datasets.census.desc": "American Community Survey 2019–2023 from the U.S. Census Bureau. Covers demographics, income, housing, education, and employment across all 34 Orange County cities.",
  "datasets.geojson.title": "OC Cities GeoJSON",
  "datasets.geojson.desc": "Boundary polygons for all 34 incorporated cities in Orange County, California. Used to render the interactive choropleth map with Leaflet.",
  "datasets.census_raw.title": "Census Bureau Raw Tables",
  "datasets.census_raw.desc": "Direct extracts from data.census.gov for cross-validation. Includes detailed tables B19013 (median income), B25077 (median home value), and S1501 (educational attainment).",
  "datasets.stats": "Dataset Statistics",
  "datasets.cities": "Cities Covered",
  "datasets.metrics": "Metrics Tracked",
  "datasets.size": "Total File Size",
  "datasets.methodology": "Methodology",
  "datasets.methodology.desc": "Data is collected annually from the Census Bureau API, validated against published tables, and compiled into a static JSON file. The choropleth map uses pre-computed quintile breaks for 7-color classification. All figures are inflation-adjusted to 2023 dollars where applicable.",
  "datasets.metrics_title": "Metric Definitions",
  "datasets.metrics_subtitle": "Every metric on the dashboard maps to a specific Census Bureau table. Hover over any metric pill on the map to see what it measures.",
  "datasets.source_table": "Source Table",
  "datasets.datafile_title": "Data File Structure",
  "datasets.datafile_desc": "The entire dataset is a single static GeoJSON file (oc-cities.json, 26 KB). Each feature represents one city with geometry (polygon) and properties (demographic data). No database, no API — the file is loaded once and rendered entirely in the browser.",
  "datasets.datafile_field": "Field",
  "datasets.datafile_type": "Type",
  "datasets.datafile_desc_col": "Description",
  // Tech
  "alerts.title": "Technology & Infrastructure",
  "alerts.subtitle": "How OC Infographics is built and operated. All infrastructure runs on Oracle Cloud Always Free tier at $0/month.",
  "alerts.production": "Production",
  "alerts.production_spec": "Oracle Cloud compute instance running Nginx to serve static files and handle analytics. Always Free tier eligible.",
  "alerts.standby": "Standby",
  "alerts.standby_spec": "Failover instance on standby for high availability. Automatically takes over if the production instance becomes unreachable.",
  "alerts.build": "Build Server",
  "alerts.build_spec": "CI/CD build server for automated deployments. Runs static site generation and pushes artifacts to production.",
  "alerts.healthy": "Healthy",
  "alerts.monitoring": "Infrastructure Monitoring",
  "alerts.monitoring.desc": "Automated monitoring checks instance health, CPU utilization, and memory usage. Alerts are triggered when thresholds are exceeded to ensure platform reliability.",
  "alerts.alarm1": "Instance Unreachable",
  "alerts.alarm1.desc": "Triggers when a production instance stops responding to health checks for 5 consecutive minutes.",
  "alerts.alarm2": "High Resource Utilization",
  "alerts.alarm2.desc": "Warns when CPU or memory utilization exceeds 90% for more than 10 minutes, indicating potential need for scaling.",
  "alerts.uptime": "Uptime",
  "alerts.last_checked": "Last checked",
  "alerts.tech": "Technology Stack",
  "alerts.tech.desc": "Every technology choice reflects a deliberate trade-off: performance vs. simplicity, capability vs. cost. Here's the complete stack powering OC Infographics — and why each piece was chosen.",
  "alerts.tech.frontend": "The entire frontend is built with Next.js 16 using its App Router and React 19. Static site generation (SSG) pre-renders every page at build time, producing pure HTML/CSS/JS with zero server-side runtime. TypeScript provides end-to-end type safety from data models to UI components. Tailwind CSS 4 keeps the stylesheet under 3 KB with utility-first classes and no unused CSS.",
  "alerts.tech.frontend_why": "Static export means the site loads instantly from any CDN or Nginx server with no Node.js process, no cold starts, and no server costs — critical for sustainable $0/month operation.",
  "alerts.tech.map": "Leaflet renders the interactive choropleth map at just 42 KB gzipped — a fraction of Mapbox or Google Maps. react-leaflet v5 bridges Leaflet's imperative API into React's declarative component model. City boundaries are pre-rendered as GeoJSON polygons with 7-color quantile classification, recalculated client-side on metric switch for instant visual feedback.",
  "alerts.tech.map_why": "No API key, no usage quotas, no vendor lock-in. Leaflet works entirely offline once loaded, which aligns with the platform's philosophy of zero-dependency public infrastructure.",
  "alerts.tech.charts": "Chart.js drives the comparison bar charts in the city detail panel. Each bar represents a city's value on a shared scale with an OC average reference line. The library's small footprint (60 KB) and Canvas-based rendering ensure smooth animations across devices.",
  "alerts.tech.charts_why": "Chosen over D3.js for its simplicity — Chart.js provides 90% of the visualization capability with 10% of the code, keeping the bundle lean and the developer experience fast.",
  "alerts.tech.infra": "The entire platform runs on Oracle Cloud Infrastructure's Always Free tier. A single compute instance serves static files through Nginx with gzip compression, cache headers, and security hardening. Cloudflare provides DNS and optional CDN proxying. Let's Encrypt handles SSL certificate automation via certbot.",
  "alerts.tech.infra_why": "The Always Free tier includes 4 OCPUs and 24 GB of RAM across Ampere ARM-based instances — vastly overprovisioned for static file serving. This headroom ensures the platform stays responsive under any realistic traffic load while maintaining exactly $0 in monthly costs.",
  "alerts.tech.data": "All demographic data lives in a single 26 KB GeoJSON file (`oc-cities.json`) sourced from the U.S. Census Bureau ACS 2019–2023 5-Year Estimates. The file is loaded once on page load and all filtering, sorting, and aggregation happens entirely client-side. No database queries, no API round-trips, no backend at all.",
  "alerts.tech.data_why": "This architecture inverts the typical web app model. Instead of querying a database per request, the entire dataset ships to the browser — smaller than a single JPEG — and becomes instantly queryable. This eliminates every category of backend cost, latency, and failure mode.",
  // About
  "about.title": "About OC Infographics",
  "about.subtitle": "Public data should be free, visual, and useful — for everyone in our community.",
  "about.why_title": "Why We Started",
  "about.why.desc": "Orange County is home to 34 diverse cities — each with its own character, challenges, and opportunities. Yet public data about our communities sits buried in census tables and PDF reports, inaccessible to most residents. OC Infographics was born from a simple belief: when people can see and understand the data about where they live, they make better decisions — for their families, their neighborhoods, and their future.",
  "about.why.desc2": "This project started with one person's curiosity about how Irvine compared to neighboring cities. That curiosity grew into a commitment to make Orange County's public data available to everyone — not just researchers and policymakers, but families choosing where to live, small business owners deciding where to open shop, teachers helping students understand their community, and anyone who calls OC home.",
  "about.purpose_title": "Our Purpose",
  "about.purpose.desc": "OC Infographics is a public good. We believe that government data — paid for by taxpayers — should be freely accessible, beautifully presented, and genuinely useful. There are no ads, no paid features, no accounts required. The entire platform runs on Oracle Cloud's free tier at $0/month, ensuring long-term sustainability without commercial pressure.",
  "about.purpose.desc2": "We want this data to be used. By residents choosing a neighborhood, by journalists investigating inequality, by real estate professionals helping clients, by students learning about data visualization, by city planners understanding regional trends. The more people who use this data, the more informed our community becomes — and that benefits everyone.",
  "about.use_title": "How You Can Use This",
  "about.use.residents": "Compare cities before moving — see income, education, housing costs at a glance.",
  "about.use.journalists": "Find and visualize demographic patterns across Orange County for data-driven stories.",
  "about.use.realtors": "Show clients how different cities compare on key livability metrics.",
  "about.use.students": "Explore real census data in an interactive format for projects and research.",
  "about.use.planners": "Understand regional disparities in income, poverty, and housing across 34 cities.",
  "about.overview_title": "Project Overview",
  "about.overview.desc": "OC Infographics is an interactive data platform that visualizes demographic and economic data for all 34 incorporated cities in Orange County, California. Every data point comes from the U.S. Census Bureau's American Community Survey (ACS) 5-Year Estimates, ensuring accuracy and reliability.",
  "about.overview.feature1": "Interactive choropleth map with 7 color-coded metric layers",
  "about.overview.feature2": "Side-by-side city comparison with OC average benchmarks",
  "about.overview.feature3": "Sortable, filterable data table of all 34 cities",
  "about.overview.feature4": "English/Spanish bilingual support throughout",
  "about.overview.feature5": "Sharable URLs — send someone a link directly to any city and metric",
  "about.overview.feature6": "Fully static — loads instantly, works on any device, no server required",
  "about.stats": "Platform Stats",
  "about.cities": "Cities",
  "about.metrics_about": "Data Metrics",
  "about.cost": "Monthly Cost",
  "about.tech": "How It's Built",
  "about.tech.desc": "The entire platform is a static website with no backend server, no database, and no API calls at runtime. This keeps it fast, secure, and free to operate.",
  "about.tech.frontend": "Next.js 16 + React 19 + TypeScript. Static export with zero JS server requirement.",
  "about.tech.map": "Leaflet + react-leaflet v5. Lightweight (42 KB) interactive choropleth maps with no API key needed.",
  "about.tech.charts": "Chart.js + react-chartjs-2. City comparison bar charts with 7-category color scales.",
  "about.tech.infra": "Oracle Cloud Always Free tier. Nginx, Cloudflare DNS, Let's Encrypt SSL.",
  "about.tech.data": "Static JSON baked at build time. No database queries, no API calls — instant page loads.",
  "about.invite_title": "Open to Everyone",
  "about.invite.desc": "This project is open source and community-driven. The code is on GitHub, the data is freely available, and contributions — whether code, ideas, or simply sharing the site with someone who might find it useful — are always welcome. Better data leads to better decisions, and better decisions build better communities.",
};

const es: Record<string, string> = {
  "nav.home": "Inicio",
  "nav.datasets": "Datos",
  "nav.alerts": "Tecnología",
  "nav.about": "Acerca de",
  // Datasets
  "datasets.title": "Fuentes de Datos y Metodología",
  "datasets.subtitle": "Cada dato en OC Infographics proviene de publicaciones oficiales del gobierno de EE. UU. Sin estimaciones, sin números generados por IA.",
  "datasets.sources": "Fuentes Principales",
  "datasets.updated": "Actualizado",
  "datasets.points": "puntos de datos",
  "datasets.census.title": "Estimaciones ACS 5 Años",
  "datasets.census.desc": "Encuesta de la Comunidad Americana 2019–2023 de la Oficina del Censo de EE. UU. Cubre demografía, ingresos, vivienda, educación y empleo en las 34 ciudades del Condado de Orange.",
  "datasets.geojson.title": "GeoJSON de Ciudades de OC",
  "datasets.geojson.desc": "Polígonos de límites para las 34 ciudades incorporadas del Condado de Orange, California. Se usa para el mapa coroplético interactivo con Leaflet.",
  "datasets.census_raw.title": "Tablas Originales del Censo",
  "datasets.census_raw.desc": "Extractos directos de data.census.gov para validación cruzada. Incluye tablas detalladas B19013 (ingreso medio), B25077 (valor medio de vivienda) y S1501 (nivel educativo).",
  "datasets.stats": "Estadísticas del Conjunto de Datos",
  "datasets.cities": "Ciudades Cubiertas",
  "datasets.metrics": "Métricas",
  "datasets.size": "Tamaño Total",
  "datasets.methodology": "Metodología",
  "datasets.methodology.desc": "Los datos se recopilan anualmente de la API del Censo, se validan contra tablas publicadas y se compilan en un archivo JSON estático. El mapa coroplético usa cortes de quintiles precalculados para clasificación de 7 colores. Todas las cifras están ajustadas por inflación a dólares de 2023.",
  "datasets.metrics_title": "Definiciones de Métricas",
  "datasets.metrics_subtitle": "Cada métrica en el panel corresponde a una tabla específica de la Oficina del Censo. Pasa el cursor sobre cualquier botón de métrica en el mapa para ver qué mide.",
  "datasets.source_table": "Tabla de Origen",
  "datasets.datafile_title": "Estructura del Archivo de Datos",
  "datasets.datafile_desc": "Todo el conjunto de datos es un único archivo GeoJSON estático (oc-cities.json, 26 KB). Cada elemento representa una ciudad con geometría (polígono) y propiedades (datos demográficos). Sin base de datos, sin API — el archivo se carga una vez y se renderiza completamente en el navegador.",
  "datasets.datafile_field": "Campo",
  "datasets.datafile_type": "Tipo",
  "datasets.datafile_desc_col": "Descripción",
  // Tech
  "alerts.title": "Tecnología e Infraestructura",
  "alerts.subtitle": "Cómo está construido y operado OC Infographics. Toda la infraestructura funciona en el nivel gratuito de Oracle Cloud a $0/mes.",
  "alerts.production": "Producción",
  "alerts.production_spec": "Instancia de Oracle Cloud que ejecuta Nginx para servir archivos estáticos y analíticas. Elegible para el nivel gratuito.",
  "alerts.standby": "Respaldo",
  "alerts.standby_spec": "Instancia de respaldo para alta disponibilidad. Toma el control automáticamente si la instancia de producción deja de responder.",
  "alerts.build": "Servidor de Build",
  "alerts.build_spec": "Servidor de CI/CD para despliegues automatizados. Genera el sitio estático y envía los artefactos a producción.",
  "alerts.healthy": "Saludable",
  "alerts.monitoring": "Monitoreo de Infraestructura",
  "alerts.monitoring.desc": "Monitoreo automatizado que verifica el estado de las instancias, uso de CPU y memoria. Las alertas se activan cuando se superan los umbrales para garantizar la confiabilidad de la plataforma.",
  "alerts.alarm1": "Instancia Sin Respuesta",
  "alerts.alarm1.desc": "Se activa cuando una instancia de producción deja de responder a las verificaciones de estado durante 5 minutos consecutivos.",
  "alerts.alarm2": "Alta Utilización de Recursos",
  "alerts.alarm2.desc": "Advierte cuando el uso de CPU o memoria supera el 90% durante más de 10 minutos, indicando posible necesidad de escalado.",
  "alerts.uptime": "Tiempo Activo",
  "alerts.last_checked": "Última verificación",
  "alerts.tech": "Stack Tecnológico",
  "alerts.tech.desc": "Cada elección tecnológica refleja un equilibrio deliberado: rendimiento vs. simplicidad, capacidad vs. costo. Aquí está el stack completo que impulsa OC Infographics — y por qué se eligió cada pieza.",
  "alerts.tech.frontend": "Todo el frontend está construido con Next.js 16 usando su App Router y React 19. La generación de sitios estáticos (SSG) pre-renderiza cada página en tiempo de compilación, produciendo HTML/CSS/JS puro sin tiempo de ejecución en el servidor. TypeScript proporciona seguridad de tipos de extremo a extremo, desde los modelos de datos hasta los componentes UI. Tailwind CSS 4 mantiene la hoja de estilos por debajo de 3 KB con clases utilitarias y sin CSS no utilizado.",
  "alerts.tech.frontend_why": "La exportación estática significa que el sitio carga instantáneamente desde cualquier CDN o servidor Nginx sin proceso Node.js, sin arranques en frío y sin costos de servidor — crítico para una operación sostenible de $0/mes.",
  "alerts.tech.map": "Leaflet renderiza el mapa coroplético interactivo con solo 42 KB comprimidos — una fracción de Mapbox o Google Maps. react-leaflet v5 conecta la API imperativa de Leaflet con el modelo declarativo de componentes de React. Los límites de las ciudades se renderizan como polígonos GeoJSON con clasificación de 7 colores por cuantiles, recalculados del lado del cliente al cambiar de métrica para respuesta visual instantánea.",
  "alerts.tech.map_why": "Sin clave API, sin cuotas de uso, sin dependencia de proveedores. Leaflet funciona completamente sin conexión una vez cargado, lo que se alinea con la filosofía de la plataforma de infraestructura pública sin dependencias.",
  "alerts.tech.charts": "Chart.js impulsa los gráficos de barras de comparación en el panel de detalles de la ciudad. Cada barra representa el valor de una ciudad en una escala compartida con una línea de referencia del promedio de OC. El tamaño reducido de la biblioteca (60 KB) y el renderizado basado en Canvas garantizan animaciones fluidas en todos los dispositivos.",
  "alerts.tech.charts_why": "Elegido sobre D3.js por su simplicidad — Chart.js proporciona el 90% de la capacidad de visualización con el 10% del código, manteniendo el paquete ligero y la experiencia de desarrollo rápida.",
  "alerts.tech.infra": "Toda la plataforma funciona en el nivel gratuito de Oracle Cloud Infrastructure. Una sola instancia de cómputo sirve archivos estáticos a través de Nginx con compresión gzip, cabeceras de caché y refuerzo de seguridad. Cloudflare proporciona DNS y proxy CDN opcional. Let's Encrypt maneja la automatización de certificados SSL mediante certbot.",
  "alerts.tech.infra_why": "El nivel gratuito incluye 4 OCPUs y 24 GB de RAM en instancias ARM Ampere — vastamente sobreaprovisionado para servir archivos estáticos. Este margen garantiza que la plataforma se mantenga receptiva bajo cualquier carga de tráfico realista mientras mantiene exactamente $0 en costos mensuales.",
  "alerts.tech.data": "Todos los datos demográficos residen en un único archivo GeoJSON de 26 KB (`oc-cities.json`) obtenido de las Estimaciones de 5 Años ACS 2019–2023 de la Oficina del Censo de EE. UU. El archivo se carga una vez al cargar la página y todo el filtrado, ordenamiento y agregación ocurre completamente del lado del cliente. Sin consultas a base de datos, sin viajes de ida y vuelta a API, sin backend.",
  "alerts.tech.data_why": "Esta arquitectura invierte el modelo típico de aplicación web. En lugar de consultar una base de datos por solicitud, todo el conjunto de datos se envía al navegador — más pequeño que un solo JPEG — y se vuelve instantáneamente consultable. Esto elimina toda categoría de costo de backend, latencia y modo de fallo.",
  // About
  "about.title": "Acerca de OC Infographics",
  "about.subtitle": "Los datos públicos deben ser gratuitos, visuales y útiles — para todos en nuestra comunidad.",
  "about.why_title": "Por Qué Comenzamos",
  "about.why.desc": "El Condado de Orange alberga 34 ciudades diversas — cada una con su propio carácter, desafíos y oportunidades. Sin embargo, los datos públicos sobre nuestras comunidades permanecen enterrados en tablas del censo e informes PDF, inaccesibles para la mayoría de los residentes. OC Infographics nació de una simple creencia: cuando las personas pueden ver y comprender los datos sobre dónde viven, toman mejores decisiones — para sus familias, sus vecindarios y su futuro.",
  "about.why.desc2": "Este proyecto comenzó con la curiosidad de una persona sobre cómo Irvine se comparaba con las ciudades vecinas. Esa curiosidad se convirtió en un compromiso de hacer que los datos públicos del Condado de Orange estén disponibles para todos — no solo para investigadores y legisladores, sino para familias que eligen dónde vivir, pequeños empresarios que deciden dónde abrir un negocio, maestros que ayudan a los estudiantes a comprender su comunidad, y cualquier persona que llame hogar a OC.",
  "about.purpose_title": "Nuestro Propósito",
  "about.purpose.desc": "OC Infographics es un bien público. Creemos que los datos del gobierno — pagados por los contribuyentes — deben ser libremente accesibles, bellamente presentados y genuinamente útiles. No hay anuncios, ni funciones de pago, ni cuentas requeridas. Toda la plataforma funciona en el nivel gratuito de Oracle Cloud a $0/mes, garantizando sostenibilidad a largo plazo sin presión comercial.",
  "about.purpose.desc2": "Queremos que estos datos se utilicen. Por residentes que eligen un vecindario, por periodistas que investigan la desigualdad, por profesionales inmobiliarios que ayudan a clientes, por estudiantes que aprenden sobre visualización de datos, por planificadores urbanos que comprenden tendencias regionales. Cuantas más personas utilicen estos datos, más informada estará nuestra comunidad — y eso beneficia a todos.",
  "about.use_title": "Cómo Puedes Usar Esto",
  "about.use.residents": "Compara ciudades antes de mudarte — ve ingresos, educación, costos de vivienda de un vistazo.",
  "about.use.journalists": "Encuentra y visualiza patrones demográficos en el Condado de Orange para historias basadas en datos.",
  "about.use.realtors": "Muestra a los clientes cómo se comparan diferentes ciudades en métricas clave de habitabilidad.",
  "about.use.students": "Explora datos reales del censo en un formato interactivo para proyectos e investigación.",
  "about.use.planners": "Comprende las disparidades regionales en ingresos, pobreza y vivienda en 34 ciudades.",
  "about.overview_title": "Resumen del Proyecto",
  "about.overview.desc": "OC Infographics es una plataforma de datos interactiva que visualiza datos demográficos y económicos de las 34 ciudades incorporadas del Condado de Orange, California. Cada dato proviene de las Estimaciones de 5 Años de la Encuesta de la Comunidad Americana (ACS) de la Oficina del Censo de EE. UU., garantizando precisión y confiabilidad.",
  "about.overview.feature1": "Mapa coroplético interactivo con 7 capas de métricas codificadas por colores",
  "about.overview.feature2": "Comparación de ciudades lado a lado con puntos de referencia del promedio de OC",
  "about.overview.feature3": "Tabla de datos ordenable y filtrable de las 34 ciudades",
  "about.overview.feature4": "Soporte bilingüe inglés/español en toda la plataforma",
  "about.overview.feature5": "URLs compartibles — envía a alguien un enlace directo a cualquier ciudad y métrica",
  "about.overview.feature6": "Completamente estático — carga instantánea, funciona en cualquier dispositivo, sin servidor necesario",
  "about.stats": "Estadísticas de la Plataforma",
  "about.cities": "Ciudades",
  "about.metrics_about": "Métricas",
  "about.cost": "Costo Mensual",
  "about.tech": "Cómo Está Construido",
  "about.tech.desc": "Toda la plataforma es un sitio web estático sin servidor backend, sin base de datos y sin llamadas API en tiempo de ejecución. Esto lo mantiene rápido, seguro y gratuito de operar.",
  "about.tech.frontend": "Next.js 16 + React 19 + TypeScript. Exportación estática sin necesidad de servidor JS.",
  "about.tech.map": "Leaflet + react-leaflet v5. Mapas coropléticos interactivos de solo 42 KB sin clave API.",
  "about.tech.charts": "Chart.js + react-chartjs-2. Gráficos de comparación entre ciudades con escalas de 7 colores.",
  "about.tech.infra": "Oracle Cloud nivel gratuito. Nginx, Cloudflare DNS, Let's Encrypt SSL.",
  "about.tech.data": "JSON estático incorporado en el build. Sin consultas a base de datos, sin llamadas API — cargas de página instantáneas.",
  "about.invite_title": "Abierto a Todos",
  "about.invite.desc": "Este proyecto es de código abierto e impulsado por la comunidad. El código está en GitHub, los datos están disponibles gratuitamente, y las contribuciones — ya sea código, ideas o simplemente compartir el sitio con alguien que pueda encontrarlo útil — son siempre bienvenidas. Mejores datos conducen a mejores decisiones, y mejores decisiones construyen mejores comunidades.",
};

const dicts: Record<Lang, Record<string, string>> = { en, es };

const LangCtx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}>({ lang: "en", setLang: () => {}, t: (k) => k });

export function useLang() {
  return useContext(LangCtx);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    try {
      const stored = localStorage.getItem("oc-lang");
      if (stored === "en" || stored === "es") return stored;
    } catch {}
    return "en";
  });
  const t = (key: string) => dicts[lang][key] ?? key;

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("oc-lang", l); } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangCtx.Provider value={{ lang, setLang, t }}>
      {children}
    </LangCtx.Provider>
  );
}
