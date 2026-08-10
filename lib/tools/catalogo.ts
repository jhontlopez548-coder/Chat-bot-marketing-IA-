export type CategoriaHerramienta =
  | "Finanzas y métricas"
  | "Meta Ads"
  | "Creativos y contenido"
  | "Ventas y cierre"
  | "Web y retención"
  | "Colombia";

export const CATEGORIAS_HERRAMIENTAS: CategoriaHerramienta[] = [
  "Finanzas y métricas",
  "Meta Ads",
  "Creativos y contenido",
  "Ventas y cierre",
  "Web y retención",
  "Colombia",
];

export interface FichaHerramienta {
  titulo: string;
  icono: string;
  categoria: CategoriaHerramienta;
  resumen: string;
}

export const CATALOGO: Record<string, FichaHerramienta> = {
  calculadora_roas: {
    titulo: "Calculadora de ROAS",
    icono: "💰",
    categoria: "Finanzas y métricas",
    resumen: "Sabe si está ganando o perdiendo plata con su pauta.",
  },
  simulador_presupuesto_meta: {
    titulo: "Simulador de presupuesto",
    icono: "📊",
    categoria: "Finanzas y métricas",
    resumen: "Cuánto invertir y cuántas ventas puede esperar.",
  },
  proyeccion_embudo: {
    titulo: "Proyección de embudo",
    icono: "🕳️",
    categoria: "Finanzas y métricas",
    resumen: "Dónde se le está fugando la plata en el embudo.",
  },
  calculadora_precio_margen: {
    titulo: "Precio y margen",
    icono: "🏷️",
    categoria: "Finanzas y métricas",
    resumen: "A cómo vender, con IVA, envío y devoluciones.",
  },
  calculadora_ltv_cac: {
    titulo: "LTV y CAC",
    icono: "🔁",
    categoria: "Finanzas y métricas",
    resumen: "Cuánto vale un cliente y cuánto puede pagar por uno nuevo.",
  },
  plan_escalamiento: {
    titulo: "Plan de escalamiento",
    icono: "🚀",
    categoria: "Finanzas y métricas",
    resumen: "Subir presupuesto sin romper el aprendizaje del algoritmo.",
  },
  estructura_de_campana: {
    titulo: "Estructura de campaña",
    icono: "🏗️",
    categoria: "Meta Ads",
    resumen: "Campañas, conjuntos, presupuestos y nomenclatura.",
  },
  constructor_publicos: {
    titulo: "Constructor de públicos",
    icono: "🎯",
    categoria: "Meta Ads",
    resumen: "Intereses, lookalikes y exclusiones para Colombia.",
  },
  plan_remarketing: {
    titulo: "Plan de remarketing",
    icono: "🪜",
    categoria: "Meta Ads",
    resumen: "La escalera completa con ventanas, mensajes y presupuesto.",
  },
  diagnostico_campana: {
    titulo: "Diagnóstico de campaña",
    icono: "🩺",
    categoria: "Meta Ads",
    resumen: "Por qué gasta y no vende, con acciones priorizadas.",
  },
  checklist_pixel_capi: {
    titulo: "Pixel y API de Conversiones",
    icono: "📡",
    categoria: "Meta Ads",
    resumen: "Checklist técnico de medición paso a paso.",
  },
  checklist_catalogo_advantage: {
    titulo: "Catálogo y Advantage+",
    icono: "🛒",
    categoria: "Meta Ads",
    resumen: "Feed, conjuntos de productos y campañas ASC.",
  },
  plan_test_ab: {
    titulo: "Plan de prueba A/B",
    icono: "🧪",
    categoria: "Meta Ads",
    resumen: "Presupuesto, duración y criterio para decidir el ganador.",
  },
  constructor_utm: {
    titulo: "Constructor de UTMs",
    icono: "🔗",
    categoria: "Meta Ads",
    resumen: "URLs con parámetros dinámicos listos para pegar.",
  },
  framework_copy_ads: {
    titulo: "Frameworks de copy",
    icono: "✍️",
    categoria: "Creativos y contenido",
    resumen: "Ángulos, ganchos y CTA en dialecto colombiano.",
  },
  guion_video_ugc: {
    titulo: "Guion de video UGC",
    icono: "🎬",
    categoria: "Creativos y contenido",
    resumen: "Reel segundo a segundo con textos en pantalla.",
  },
  calendario_contenido: {
    titulo: "Calendario de contenido",
    icono: "📅",
    categoria: "Creativos y contenido",
    resumen: "Piezas, formatos y qué promocionar cada semana.",
  },
  plantillas_whatsapp: {
    titulo: "Plantillas de WhatsApp",
    icono: "💬",
    categoria: "Ventas y cierre",
    resumen: "Del saludo al cierre, listo para copiar y pegar.",
  },
  manejo_objeciones: {
    titulo: "Manejo de objeciones",
    icono: "🛡️",
    categoria: "Ventas y cierre",
    resumen: "Qué responder cuando dicen «está muy caro».",
  },
  buyer_persona_colombia: {
    titulo: "Cliente ideal colombiano",
    icono: "👤",
    categoria: "Ventas y cierre",
    resumen: "Perfil, dolores, disparadores y dónde encontrarlo.",
  },
  auditoria_landing_cro: {
    titulo: "Auditoría de conversión",
    icono: "🔍",
    categoria: "Web y retención",
    resumen: "Checklist con puntaje para su landing o checkout.",
  },
  plan_email_sms_whatsapp: {
    titulo: "Flujos de retención",
    icono: "⚙️",
    categoria: "Web y retención",
    resumen: "Carrito abandonado, postventa, recompra y reactivación.",
  },
  calendario_comercial_colombia: {
    titulo: "Calendario comercial Colombia",
    icono: "🇨🇴",
    categoria: "Colombia",
    resumen: "Día de la Madre, Amor y Amistad, primas y quincenas.",
  },
  benchmarks_colombia: {
    titulo: "Benchmarks Colombia",
    icono: "📈",
    categoria: "Colombia",
    resumen: "CPM, CTR, CPA y ROAS de referencia en pesos.",
  },
  metodos_pago_envios: {
    titulo: "Pagos y envíos",
    icono: "🚚",
    categoria: "Colombia",
    resumen: "Nequi, contraentrega, financiación y transportadoras.",
  },
  normativa_publicidad: {
    titulo: "Normativa y políticas",
    icono: "⚖️",
    categoria: "Colombia",
    resumen: "SIC, Habeas Data, IVA y políticas de Meta.",
  },
  web_search: {
    titulo: "Búsqueda en la web",
    icono: "🌐",
    categoria: "Meta Ads",
    resumen: "Trae información actualizada de internet.",
  },
};

export function fichaDe(nombre: string): FichaHerramienta {
  return (
    CATALOGO[nombre] ?? {
      titulo: nombre,
      icono: "🔧",
      categoria: "Meta Ads",
      resumen: "",
    }
  );
}
