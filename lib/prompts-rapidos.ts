export interface PromptRapido {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  categoria: Categoria;
  negocio: "perfumeria" | "muebleria" | "ambos";
  prompt: string;
}

export type Categoria =
  | "Estrategia y plata"
  | "Meta Ads"
  | "Creativos y contenido"
  | "Ventas y WhatsApp"
  | "Web y conversión"
  | "Colombia";

export const CATEGORIAS: Categoria[] = [
  "Estrategia y plata",
  "Meta Ads",
  "Creativos y contenido",
  "Ventas y WhatsApp",
  "Web y conversión",
  "Colombia",
];

export const PROMPTS_RAPIDOS: PromptRapido[] = [
  // ───────────── Estrategia y plata ─────────────
  {
    id: "roas",
    titulo: "¿Estoy ganando o perdiendo plata?",
    descripcion: "ROAS real, ROAS de equilibrio y utilidad neta",
    icono: "💰",
    categoria: "Estrategia y plata",
    negocio: "ambos",
    prompt:
      "Quiero saber si mi pauta está siendo rentable de verdad. Le doy los números: invertí $[INVERSIÓN] en Meta Ads este mes, facturé $[VENTAS] con [NÚMERO] pedidos, mi costo de producto es el [X]% del precio de venta, el envío me cuesta $[ENVÍO] por pedido y la pasarela me cobra [X]%. Calcúleme el ROAS real, el de equilibrio y dígame si escalo o freno.",
  },
  {
    id: "presupuesto",
    titulo: "¿Cuánto debo invertir?",
    descripcion: "Simulador de presupuesto y ventas proyectadas",
    icono: "📊",
    categoria: "Estrategia y plata",
    negocio: "ambos",
    prompt:
      "Necesito saber cuánto invertir en Meta Ads. Mi ticket promedio es $[TICKET] y quiero llegar a [NÚMERO] ventas al mes. Simúleme el presupuesto que necesito, cuántas ventas puedo esperar con tres escenarios distintos y cuál es el mínimo por debajo del cual ni vale la pena arrancar.",
  },
  {
    id: "precio",
    titulo: "¿A cómo debo vender?",
    descripcion: "Precio, margen, IVA y CPA máximo",
    icono: "🏷️",
    categoria: "Estrategia y plata",
    negocio: "ambos",
    prompt:
      "Ayúdeme a poner el precio correcto. El producto me cuesta $[COSTO], quiero un margen del [X]%, el envío vale $[ENVÍO], la pasarela cobra [X]% y trabajo contraentrega con una devolución cercana al [X]%. Dígame el precio que debo poner, el precio psicológico y cuánto es lo máximo que puedo pagar por una venta en Meta.",
  },
  {
    id: "ltv",
    titulo: "¿Cuánto vale un cliente?",
    descripcion: "LTV, CAC y cuánto puedo pagar por cliente nuevo",
    icono: "🔁",
    categoria: "Estrategia y plata",
    negocio: "ambos",
    prompt:
      "Calcúleme el valor de vida de mi cliente. Ticket promedio $[TICKET], me compran [X] veces al año, duran unos [X] años conmigo y mi margen bruto es [X]%. Este mes invertí $[INVERSIÓN] y conseguí [X] clientes nuevos. Dígame si mi relación LTV:CAC aguanta que escale.",
  },
  {
    id: "escalar",
    titulo: "Plan para escalar sin romper la campaña",
    descripcion: "Escalamiento vertical y horizontal paso a paso",
    icono: "🚀",
    categoria: "Estrategia y plata",
    negocio: "ambos",
    prompt:
      "Tengo una campaña funcionando bien con $[ACTUAL] diarios y quiero llegar a $[META] diarios sin dañarla. Mi CPA actual es $[CPA] y el máximo que aguanto es $[CPA_MAX]. Deme el plan de escalamiento día por día y las señales de alerta para frenar.",
  },
  {
    id: "plan90",
    titulo: "Plan completo a 90 días",
    descripcion: "Hoja de ruta de marketing con metas y presupuesto",
    icono: "🗺️",
    categoria: "Estrategia y plata",
    negocio: "ambos",
    prompt:
      "Ármeme un plan de marketing digital completo a 90 días para mi negocio. Presupuesto de pauta $[PRESUPUESTO] al mes, ticket promedio $[TICKET], vendo principalmente en [CIUDAD]. Quiero mes a mes: qué campañas montar, cuánto invertir en cada una, qué contenido producir, qué métricas revisar y cuál es la meta de facturación realista.",
  },

  // ───────────── Meta Ads ─────────────
  {
    id: "estructura",
    titulo: "Estructura completa de la cuenta",
    descripcion: "Campañas, conjuntos, presupuestos y nomenclatura",
    icono: "🏗️",
    categoria: "Meta Ads",
    negocio: "ambos",
    prompt:
      "Ármeme la estructura completa de mi cuenta de Meta Ads. Tengo $[PRESUPUESTO] mensuales, quiero vender por [WhatsApp / web] y mi cuenta está [nueva / con historial]. Deme campañas, conjuntos, presupuesto de cada uno, objetivos, ubicaciones y la nomenclatura exacta que debo usar.",
  },
  {
    id: "diagnostico",
    titulo: "Mi campaña no está funcionando",
    descripcion: "Diagnóstico con causas y acciones priorizadas",
    icono: "🩺",
    categoria: "Meta Ads",
    negocio: "ambos",
    prompt:
      "Mi campaña está gastando y no vende. Los números: CPM $[CPM], CTR [X]%, CPC $[CPC], frecuencia [X], CPA $[CPA], [X] conversiones a la semana, lleva [X] días activa con $[PRESUPUESTO] diarios y la landing convierte al [X]%. Diagnostíqueme qué está pasando y qué arreglo primero.",
  },
  {
    id: "publicos",
    titulo: "Públicos e intereses para Colombia",
    descripcion: "Segmentaciones, lookalikes y exclusiones",
    icono: "🎯",
    categoria: "Meta Ads",
    negocio: "ambos",
    prompt:
      "Ármeme los públicos de Meta Ads para vender en Colombia. Quiero prospección en frío, remarketing y recompra: intereses concretos, lookalikes, públicos personalizados, exclusiones obligatorias y qué ciudades priorizar.",
  },
  {
    id: "remarketing",
    titulo: "Escalera de remarketing completa",
    descripcion: "Ventanas, mensajes y presupuesto por escalón",
    icono: "🪜",
    categoria: "Meta Ads",
    negocio: "ambos",
    prompt:
      "Diséñeme la escalera de remarketing completa. Tengo $[PRESUPUESTO] diarios para remarketing y [sí/no] tengo catálogo cargado en Meta. Deme cada escalón con su ventana de días, el mensaje, la oferta y cuánta plata poner en cada uno.",
  },
  {
    id: "pixel",
    titulo: "Configurar Pixel y API de Conversiones",
    descripcion: "Medición completa paso a paso",
    icono: "📡",
    categoria: "Meta Ads",
    negocio: "ambos",
    prompt:
      "Necesito dejar la medición perfecta. Mi tienda está en [Shopify / WooCommerce / web propia / solo WhatsApp]. Deme el checklist completo de Pixel, API de Conversiones, deduplicación, eventos priorizados y cómo verifico que todo esté midiendo bien.",
  },
  {
    id: "catalogo",
    titulo: "Catálogo y campañas Advantage+",
    descripcion: "Feed, conjuntos de productos y ASC",
    icono: "🛒",
    categoria: "Meta Ads",
    negocio: "ambos",
    prompt:
      "Quiero montar el catálogo de productos y campañas Advantage+ Shopping. Deme los campos obligatorios del feed, cómo organizar los conjuntos de productos, cuándo conviene ASC y los errores típicos que debo evitar.",
  },
  {
    id: "test",
    titulo: "Diseñar una prueba A/B",
    descripcion: "Presupuesto, duración y criterio de decisión",
    icono: "🧪",
    categoria: "Meta Ads",
    negocio: "ambos",
    prompt:
      "Quiero probar [creativo / copy / público / oferta / landing] en Meta Ads. Mi CPA esperado es $[CPA] y mi conversión actual es [X]%. Diséñeme la prueba: cuántas variantes, qué presupuesto, cuántos días y con qué criterio decido el ganador.",
  },
  {
    id: "novedades",
    titulo: "¿Qué cambió en Meta Ads?",
    descripcion: "Actualizaciones recientes de la plataforma",
    icono: "🆕",
    categoria: "Meta Ads",
    negocio: "ambos",
    prompt:
      "Búsqueme en la web qué ha cambiado recientemente en Meta Ads y en marketing digital que me afecte, y explíqueme qué debo ajustar en mis campañas en Colombia por cuenta de esos cambios.",
  },
  {
    id: "utm",
    titulo: "Generar UTMs",
    descripcion: "Parámetros dinámicos listos para pegar",
    icono: "🔗",
    categoria: "Meta Ads",
    negocio: "ambos",
    prompt:
      "Genéreme los UTM para mis anuncios de Meta. Mi URL es [https://miweb.com/producto] y la campaña se llama [NOMBRE]. Deme la versión con parámetros dinámicos y explíqueme dónde exactamente la pego.",
  },

  // ───────────── Creativos y contenido ─────────────
  {
    id: "copys",
    titulo: "10 copys listos para publicar",
    descripcion: "Ángulos, ganchos y CTA en dialecto colombiano",
    icono: "✍️",
    categoria: "Creativos y contenido",
    negocio: "ambos",
    prompt:
      "Escríbame 10 copys completos para anuncios de Meta de [PRODUCTO], para público [frío / tibio / caliente]. Quiero ángulos distintos, gancho fuerte en la primera línea, precio visible y CTA claro. Todo en español colombiano, nada de español neutro.",
  },
  {
    id: "guion",
    titulo: "Guion de Reel / video UGC",
    descripcion: "Segundo a segundo, con textos en pantalla",
    icono: "🎬",
    categoria: "Creativos y contenido",
    negocio: "ambos",
    prompt:
      "Escríbame el guion de un Reel de [30] segundos para vender [PRODUCTO], formato [testimonio / antes y después / unboxing / recorrido]. Quiero segundo a segundo: qué digo, qué muestro, qué va en pantalla y las especificaciones técnicas.",
  },
  {
    id: "ganchos",
    titulo: "20 ganchos de 3 segundos",
    descripcion: "Primeras frases que frenan el scroll",
    icono: "🪝",
    categoria: "Creativos y contenido",
    negocio: "ambos",
    prompt:
      "Deme 20 ganchos distintos de máximo 3 segundos para videos de [PRODUCTO] en Reels y TikTok, pensados para que el colombiano frene el scroll. Ordénemelos del más agresivo al más suave.",
  },
  {
    id: "calendario",
    titulo: "Calendario de contenido del mes",
    descripcion: "Piezas, formatos, plataformas y qué pautar",
    icono: "📅",
    categoria: "Creativos y contenido",
    negocio: "ambos",
    prompt:
      "Ármeme el calendario de contenido de las próximas 4 semanas, 5 piezas por semana para Instagram, Facebook y TikTok. Dígame día, formato, pilar, objetivo y cuáles piezas debo promocionar con pauta.",
  },
  {
    id: "creativos-ganadores",
    titulo: "Qué creativos producir este mes",
    descripcion: "Lista priorizada según la temporada",
    icono: "🎨",
    categoria: "Creativos y contenido",
    negocio: "ambos",
    prompt:
      "Dígame exactamente qué creativos debo producir este mes para Meta Ads según la temporada comercial colombiana: cuántos, de qué formato, con qué ángulo y en qué orden de prioridad. Tengo poco tiempo de producción.",
  },

  // ───────────── Ventas y WhatsApp ─────────────
  {
    id: "whatsapp",
    titulo: "Guion de venta por WhatsApp",
    descripcion: "Del saludo al cierre, listo para copiar",
    icono: "💬",
    categoria: "Ventas y WhatsApp",
    negocio: "ambos",
    prompt:
      "Ármeme el guion completo de venta por WhatsApp: primer contacto, calificación, cómo presento el precio, seguimiento cuando no contestan y cierre. Quiero las plantillas listas para copiar y pegar, en dialecto colombiano.",
  },
  {
    id: "objeciones",
    titulo: "Manejo de objeciones",
    descripcion: "Qué responder cuando dicen que está caro",
    icono: "🛡️",
    categoria: "Ventas y WhatsApp",
    negocio: "ambos",
    prompt:
      "Deme las objeciones más frecuentes de mis clientes colombianos y cómo responder cada una palabra por palabra: «está muy caro», «lo voy a pensar», «¿es original?», «¿cuánto el envío?» y las propias de mi negocio.",
  },
  {
    id: "persona",
    titulo: "Mi cliente ideal colombiano",
    descripcion: "Perfil, dolores, disparadores y dónde encontrarlo",
    icono: "👤",
    categoria: "Ventas y WhatsApp",
    negocio: "ambos",
    prompt:
      "Constrúyame el perfil de mi cliente ideal en Colombia: quién es, en qué estrato está, qué le duele, qué lo hace comprar, qué objeciones pone y cómo lo encuentro en Meta. Vendo en [CIUDAD] con precios entre $[MÍNIMO] y $[MÁXIMO].",
  },
  {
    id: "recuperar",
    titulo: "Recuperar clientes que no cerraron",
    descripcion: "Secuencia de seguimiento sin sonar desesperado",
    icono: "🎣",
    categoria: "Ventas y WhatsApp",
    negocio: "ambos",
    prompt:
      "Tengo un montón de gente que cotizó por WhatsApp y no cerró. Ármeme la secuencia de seguimiento y reactivación: cuántos mensajes, cada cuánto, qué digo en cada uno y cuándo los suelto para pasarlos a remarketing.",
  },

  // ───────────── Web y conversión ─────────────
  {
    id: "cro",
    titulo: "Auditar mi página web",
    descripcion: "Checklist de conversión para Colombia",
    icono: "🔍",
    categoria: "Web y conversión",
    negocio: "ambos",
    prompt:
      "Audíteme mi [landing / ficha de producto / checkout]. Convierte al [X]%, carga en [X] segundos, [sí/no] tengo contraentrega y [sí/no] tengo financiación. Deme el checklist con puntaje y el orden exacto en que debo arreglar las cosas.",
  },
  {
    id: "flujos",
    titulo: "Flujos automáticos de retención",
    descripcion: "Carrito abandonado, postventa y recompra",
    icono: "⚙️",
    categoria: "Web y conversión",
    negocio: "ambos",
    prompt:
      "Diséñeme los flujos automáticos de WhatsApp y email: bienvenida, carrito abandonado, postventa, recompra y reactivación. Deme los tiempos exactos y el mensaje de cada paso.",
  },
  {
    id: "embudo",
    titulo: "¿Dónde se me fuga la plata?",
    descripcion: "Proyección de embudo y punto débil",
    icono: "🕳️",
    categoria: "Web y conversión",
    negocio: "ambos",
    prompt:
      "Analíceme el embudo. Tuve [X] impresiones, CTR de [X]%, de las visitas me escribe el [X]% y de esos cierro el [X]%, con ticket de $[TICKET] e inversión de $[INVERSIÓN]. Dígame dónde se me está fugando la plata y qué arreglo primero.",
  },

  // ───────────── Colombia ─────────────
  {
    id: "temporada",
    titulo: "¿Qué se viene este mes?",
    descripcion: "Fechas comerciales y cómo aprovecharlas",
    icono: "🇨🇴",
    categoria: "Colombia",
    negocio: "ambos",
    prompt:
      "¿Qué fechas comerciales se vienen en Colombia y cómo las aprovecho en mi negocio? Dígame cuándo empiezo a calentar públicos, cuánto presupuesto reservar y qué comunicar en cada una.",
  },
  {
    id: "benchmarks",
    titulo: "¿Cómo voy contra el mercado?",
    descripcion: "CPM, CTR, CPA y ROAS de referencia",
    icono: "📈",
    categoria: "Colombia",
    negocio: "ambos",
    prompt:
      "Muéstreme los rangos de referencia del mercado colombiano para mi negocio: CPM, CTR, CPC, costo por conversación de WhatsApp, CPA y ROAS sano. Y dígame contra cuáles debo compararme según el tipo de campaña.",
  },
  {
    id: "pagos",
    titulo: "Pagos y envíos que más convierten",
    descripcion: "Nequi, contraentrega, financiación, transportadoras",
    icono: "🚚",
    categoria: "Colombia",
    negocio: "ambos",
    prompt:
      "¿Qué métodos de pago y qué transportadoras debo tener para vender más en Colombia con un ticket promedio de $[TICKET]? Dígame qué priorizo y cómo manejo la contraentrega sin que me maten las devoluciones.",
  },
  {
    id: "legal",
    titulo: "Qué puedo y qué no puedo decir",
    descripcion: "SIC, Habeas Data y políticas de Meta",
    icono: "⚖️",
    categoria: "Colombia",
    negocio: "ambos",
    prompt:
      "Explíqueme qué puedo y qué no puedo decir en mi publicidad en Colombia: reglas de la SIC, Habeas Data, derecho de retracto y las políticas de Meta que más rechazan anuncios. Deme ejemplos de frases prohibidas y sus alternativas.",
  },

  // ───────────── Específicos por negocio ─────────────
  {
    id: "perf-lanzamiento",
    titulo: "Lanzar una fragancia nueva",
    descripcion: "Plan de lanzamiento de 14 días",
    icono: "🌸",
    categoria: "Estrategia y plata",
    negocio: "perfumeria",
    prompt:
      "Voy a lanzar una fragancia nueva. Ármeme el plan de lanzamiento de 14 días: contenido de expectativa, campañas de Meta, presupuesto por día, ángulos de venta y cómo manejo la objeción de originalidad.",
  },
  {
    id: "perf-decants",
    titulo: "Estrategia de decants",
    descripcion: "Convertir muestras en clientes de frasco completo",
    icono: "🧪",
    categoria: "Estrategia y plata",
    negocio: "perfumeria",
    prompt:
      "Quiero usar los decants como puerta de entrada. Diséñeme la estrategia: cómo los pauto, a qué precio, cómo hago el seguimiento para que el cliente se lleve después el frasco completo y qué automatizaciones monto.",
  },
  {
    id: "mue-financiacion",
    titulo: "Vender con financiación",
    descripcion: "Comunicar la cuota, no el precio",
    icono: "🏦",
    categoria: "Ventas y WhatsApp",
    negocio: "muebleria",
    prompt:
      "Quiero vender con financiación (Addi, Sistecrédito, cuotas). Dígame cómo comunicarlo en los anuncios, en la web y en WhatsApp para que la cuota mensual sea el argumento principal, con ejemplos de copy y de guion de venta.",
  },
  {
    id: "mue-showroom",
    titulo: "Llevar gente al showroom",
    descripcion: "Campañas de tráfico a punto físico",
    icono: "🏬",
    categoria: "Meta Ads",
    negocio: "muebleria",
    prompt:
      "Tengo showroom físico en [CIUDAD] y quiero llevar gente. Ármeme las campañas de Meta para tráfico a punto físico: objetivo, segmentación por radio, creativos, oferta gancho y cómo mido las visitas que sí llegaron.",
  },
];
