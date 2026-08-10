import {
  BENCHMARKS,
  CALENDARIO_COMERCIAL,
  CIUDADES_CLAVE,
  METODOS_PAGO,
  NORMATIVA,
  QUINCENAS,
  TRANSPORTADORAS,
  type Vertical,
} from "@/lib/data/colombia";

/* ────────────────────────────── utilidades ────────────────────────────── */

const cop = (n: number) =>
  "$" + Math.round(n).toLocaleString("es-CO", { maximumFractionDigits: 0 }) + " COP";

const pct = (n: number) => `${n.toFixed(2)}%`;
const num = (n: number) => Math.round(n).toLocaleString("es-CO");
const media = ([a, b]: [number, number]) => (a + b) / 2;
const rango = ([a, b]: [number, number], f: (n: number) => string) => `${f(a)} – ${f(b)}`;

type Input = Record<string, any>;

/* ───────────────────────── 1. FINANZAS Y MÉTRICAS ─────────────────────── */

function calculadoraRoas(i: Input) {
  const inv = i.inversion_publicitaria_cop;
  const ing = i.ingresos_cop;
  const costoProdPct = i.costo_producto_pct / 100;
  const pedidos = i.numero_pedidos ?? 0;
  const envio = (i.costo_envio_cop ?? 0) * pedidos;
  const comision = ing * ((i.comision_pasarela_pct ?? 0) / 100);
  const fijos = i.costos_fijos_cop ?? 0;

  const costoProducto = ing * costoProdPct;
  const margenContribucion = ing - costoProducto - envio - comision;
  const margenPct = ing > 0 ? (margenContribucion / ing) * 100 : 0;
  const roas = inv > 0 ? ing / inv : 0;
  const roasEquilibrio = margenPct > 0 ? 100 / margenPct : Infinity;
  const utilidad = margenContribucion - inv - fijos;
  const cpaMaximo = pedidos > 0 ? margenContribucion / pedidos : margenContribucion * 0;
  const ticket = pedidos > 0 ? ing / pedidos : 0;
  const cpaReal = pedidos > 0 ? inv / pedidos : 0;
  const acos = ing > 0 ? (inv / ing) * 100 : 0;

  return {
    roas: roas.toFixed(2) + "x",
    roas_de_equilibrio: Number.isFinite(roasEquilibrio) ? roasEquilibrio.toFixed(2) + "x" : "no calculable",
    veredicto:
      roas > roasEquilibrio * 1.3
        ? "SANO: está ganando plata con holgura."
        : roas > roasEquilibrio
        ? "AJUSTADO: gana, pero sin colchón. Cualquier subida de CPM lo pone en rojo."
        : "EN ROJO: cada venta le está costando más de lo que deja.",
    margen_contribucion: cop(margenContribucion),
    margen_pct: pct(margenPct),
    utilidad_neta: cop(utilidad),
    acos_pct: pct(acos),
    ticket_promedio: pedidos ? cop(ticket) : "no informado",
    cpa_real: pedidos ? cop(cpaReal) : "no informado",
    cpa_maximo_permitido: pedidos ? cop(cpaMaximo) : "informe el número de pedidos para calcularlo",
    desglose: {
      inversion_ads: cop(inv),
      ingresos: cop(ing),
      costo_producto: cop(costoProducto),
      costo_envio_total: cop(envio),
      comision_pasarela: cop(comision),
      costos_fijos: cop(fijos),
    },
    nota: "El ROAS de equilibrio es el mínimo para no perder plata. Apunte a operar mínimo 1.3x por encima de ese número.",
  };
}

function simuladorPresupuesto(i: Input) {
  const v = i.vertical as Vertical;
  const esc = i.escenario as string;
  const b = BENCHMARKS[v][esc] ?? BENCHMARKS[v]["trafico_frio_reels"];
  const dias = i.dias ?? 30;
  const ticket = i.ticket_promedio_cop;

  const cpm = media(b.cpmCop);
  const ctr = media(b.ctrPct) / 100;
  const cvr = media(b.cvrLandingPct) / 100;
  const cpa = media(b.cpaVentaCop);

  const proyectar = (presupuestoDiario: number) => {
    const total = presupuestoDiario * dias;
    const impresiones = (total / cpm) * 1000;
    const clics = impresiones * ctr;
    const conversiones = clics * cvr;
    const ventasPorCpa = total / cpa;
    const ventas = (conversiones + ventasPorCpa) / 2; // promedio de los dos métodos
    const ingresos = ventas * ticket;
    return {
      presupuesto_diario: cop(presupuestoDiario),
      presupuesto_total_periodo: cop(total),
      impresiones_estimadas: num(impresiones),
      clics_estimados: num(clics),
      ventas_estimadas: num(ventas),
      ingresos_estimados: cop(ingresos),
      roas_estimado: (ingresos / total).toFixed(2) + "x",
      cpa_estimado: cop(total / Math.max(ventas, 1)),
    };
  };

  const resultado: Input = {
    vertical: v,
    escenario: esc,
    dias,
    supuestos_usados: {
      cpm: cop(cpm),
      ctr: pct(media(b.ctrPct)),
      tasa_conversion: pct(media(b.cvrLandingPct)),
      cpa_referencia: cop(cpa),
      fuente: "Rangos de mercado colombiano — validar contra los datos reales de la cuenta.",
    },
    nota_benchmark: b.notas,
  };

  if (i.presupuesto_diario_cop) {
    resultado.escenario_con_presupuesto_dado = proyectar(i.presupuesto_diario_cop);
    resultado.escenario_conservador = proyectar(i.presupuesto_diario_cop * 0.7);
    resultado.escenario_optimista = proyectar(i.presupuesto_diario_cop * 1.4);
  }

  if (i.meta_ventas_mes) {
    const presupuestoNecesario = (i.meta_ventas_mes * cpa) / dias;
    resultado.para_alcanzar_la_meta = {
      meta_ventas: num(i.meta_ventas_mes),
      presupuesto_diario_necesario: cop(presupuestoNecesario),
      presupuesto_total_necesario: cop(presupuestoNecesario * dias),
      facturacion_proyectada: cop(i.meta_ventas_mes * ticket),
      roas_implicito: ((i.meta_ventas_mes * ticket) / (presupuestoNecesario * dias)).toFixed(2) + "x",
    };
  }

  const minimoSano = media(b.cpaVentaCop) * 3;
  resultado.presupuesto_minimo_recomendado_diario = cop(minimoSano);
  resultado.por_que =
    "Meta necesita mínimo ~50 conversiones por semana por conjunto para salir de la fase de aprendizaje. Con menos de 3 conversiones diarias, el algoritmo no optimiza bien.";

  return resultado;
}

function proyeccionEmbudo(i: Input) {
  const impresiones = i.impresiones;
  const clics = impresiones * (i.ctr_pct / 100);
  const carga = i.tasa_carga_landing_pct ?? 85;
  const visitas = clics * (carga / 100);
  const contactos = visitas * (i.tasa_contacto_pct / 100);
  const ventas = contactos * (i.tasa_cierre_pct / 100);
  const ingresos = ventas * i.ticket_promedio_cop;
  const inv = i.inversion_cop;

  const etapas = [
    { etapa: "Impresiones", valor: num(impresiones), conversion: "—" },
    { etapa: "Clics en el enlace", valor: num(clics), conversion: pct(i.ctr_pct) },
    { etapa: "Visitas que sí cargaron", valor: num(visitas), conversion: pct(carga) },
    { etapa: "Contactos / carritos", valor: num(contactos), conversion: pct(i.tasa_contacto_pct) },
    { etapa: "Ventas cerradas", valor: num(ventas), conversion: pct(i.tasa_cierre_pct) },
  ];

  const fugas: string[] = [];
  if (i.ctr_pct < 1) fugas.push("CTR por debajo del 1%: el creativo no está enganchando. Es la fuga #1, arréglela primero.");
  if (carga < 85) fugas.push(`Se está perdiendo el ${(100 - carga).toFixed(0)}% de los clics por velocidad de carga. Meta abandona a los 3 segundos.`);
  if (i.tasa_contacto_pct < 2) fugas.push("Menos del 2% de las visitas contacta: revise oferta, precio visible, prueba social y botón de WhatsApp flotante.");
  if (i.tasa_cierre_pct < 15) fugas.push("Cierre bajo: el problema está en el asesor de WhatsApp, no en la pauta. Revise tiempos de respuesta y guiones.");

  return {
    embudo: etapas,
    ingresos_estimados: cop(ingresos),
    inversion: cop(inv),
    roas: (ingresos / inv).toFixed(2) + "x",
    cpa: cop(inv / Math.max(ventas, 1)),
    costo_por_contacto: cop(inv / Math.max(contactos, 1)),
    fugas_detectadas: fugas.length ? fugas : ["No se detectan fugas graves con estos números."],
    palanca_de_mayor_impacto:
      i.ctr_pct < 1
        ? "Creativo (CTR)"
        : i.tasa_contacto_pct < 2
        ? "Landing / oferta"
        : i.tasa_cierre_pct < 15
        ? "Equipo comercial de WhatsApp"
        : "Escalar presupuesto: el embudo está sano",
  };
}

function calculadoraPrecioMargen(i: Input) {
  const costo = i.costo_unitario_cop;
  const margenObj = i.margen_objetivo_pct / 100;
  const envio = i.costo_envio_cop ?? 0;
  const comisionPct = (i.comision_pasarela_pct ?? 0) / 100;
  const devolucionPct = (i.tasa_devolucion_pct ?? 0) / 100;

  const costoTotalUnitario = costo + envio + costo * devolucionPct + envio * devolucionPct;
  const precioSinIva = costoTotalUnitario / (1 - margenObj - comisionPct);
  const precioConIva = precioSinIva * 1.19;
  const precioSugerido = i.incluye_iva ? precioConIva : precioSinIva;

  const evaluar = (precio: number) => {
    const base = i.incluye_iva ? precio / 1.19 : precio;
    const comision = base * comisionPct;
    const utilidad = base - costoTotalUnitario - comision;
    return {
      precio: cop(precio),
      base_sin_iva: cop(base),
      utilidad_por_unidad: cop(utilidad),
      margen_real: pct((utilidad / base) * 100),
      cpa_maximo_para_no_perder: cop(utilidad),
      cpa_recomendado_70pct: cop(utilidad * 0.7),
    };
  };

  const out: Input = {
    costo_unitario: cop(costo),
    costo_real_con_devoluciones: cop(costoTotalUnitario),
    precio_sugerido: evaluar(precioSugerido),
    precios_psicologicos_colombia: [
      cop(Math.ceil(precioSugerido / 1000) * 1000 - 100),
      cop(Math.ceil(precioSugerido / 10000) * 10000 - 1000),
      cop(Math.round(precioSugerido / 5000) * 5000),
    ],
    iva: i.incluye_iva ? "Precio mostrado incluye IVA del 19%." : "Precio mostrado NO incluye IVA del 19%.",
  };

  if (i.precio_actual_cop) out.precio_actual_evaluado = evaluar(i.precio_actual_cop);

  if (devolucionPct > 0) {
    out.alerta_contraentrega = `Con ${pct(i.tasa_devolucion_pct)} de devolución, cada 10 pedidos usted realmente cobra ${(10 * (1 - devolucionPct)).toFixed(1)}. Cárguele ese costo al precio o exija abono del 20% al despachar.`;
  }

  out.recomendacion_colombiana =
    "En Colombia comunicar 'envío gratis' convierte más que bajar el precio el mismo valor. Suba el precio lo que cuesta el envío y ofrézcalo gratis.";

  return out;
}

function calculadoraLtvCac(i: Input) {
  const ltvBruto = i.ticket_promedio_cop * i.compras_por_ano * i.anos_de_vida_cliente;
  const ltv = ltvBruto * (i.margen_bruto_pct / 100);
  const cac = i.inversion_marketing_cop && i.clientes_nuevos ? i.inversion_marketing_cop / i.clientes_nuevos : null;
  const ratio = cac ? ltv / cac : null;
  const margenPrimeraCompra = i.ticket_promedio_cop * (i.margen_bruto_pct / 100);

  return {
    ltv_bruto: cop(ltvBruto),
    ltv_neto_con_margen: cop(ltv),
    cac: cac ? cop(cac) : "informe inversión y clientes nuevos para calcularlo",
    relacion_ltv_cac: ratio ? ratio.toFixed(2) + ":1" : "—",
    veredicto: ratio
      ? ratio >= 3
        ? "SANO: 3:1 o más. Puede escalar con confianza."
        : ratio >= 1.5
        ? "AJUSTADO: rentable pero sin músculo para escalar rápido. Trabaje recompra."
        : "INSOSTENIBLE: el cliente cuesta casi lo que deja. Suba ticket o baje CAC antes de invertir más."
      : "—",
    margen_de_la_primera_compra: cop(margenPrimeraCompra),
    puede_pagar_por_cliente_nuevo: {
      conservador_break_even_primera_compra: cop(margenPrimeraCompra),
      agresivo_apostando_al_ltv: cop(ltv / 3),
      explicacion:
        "Si aguanta el flujo de caja, puede pagar hasta 1/3 del LTV por un cliente. Si no, no pase del margen de la primera compra.",
    },
    meses_de_recuperacion: cac ? (cac / (margenPrimeraCompra * (i.compras_por_ano / 12))).toFixed(1) + " meses" : "—",
  };
}

function planEscalamiento(i: Input) {
  const actual = i.presupuesto_actual_diario_cop;
  const meta = i.presupuesto_meta_diario_cop;
  const pasos: Input[] = [];
  let p = actual;
  let dia = 0;
  let n = 1;
  while (p < meta && n <= 20) {
    const siguiente = Math.min(p * 1.2, meta);
    pasos.push({
      paso: n,
      dia: `Día ${dia}`,
      subir_de: cop(p),
      subir_a: cop(siguiente),
      incremento: "20%",
      esperar: "72 horas antes del siguiente paso",
      revisar: "CPA, frecuencia y CTR. Si el CPA sube más del 20%, se congela y se espera 3 días más.",
    });
    p = siguiente;
    dia += 3;
    n++;
  }

  return {
    vertical: i.vertical,
    de: cop(actual),
    a: cop(meta),
    dias_estimados: dia,
    regla_de_oro: "Máximo +20% cada 72 horas. Subir más de golpe reinicia la fase de aprendizaje y le dispara el CPA.",
    pasos,
    escalamiento_horizontal: [
      "Duplicar el conjunto ganador y cambiar solo el público (nueva ciudad, nuevo interés, nuevo lookalike 1%→2%→3%).",
      "Duplicar la campaña completa a un objetivo distinto (de mensajes a ventas web, por ejemplo).",
      "Abrir ubicaciones nuevas: Reels, Explorar, Audience Network por separado si tienen buen desempeño.",
      "Sumar creativos nuevos al conjunto ganador antes que subir presupuesto: es escalamiento gratis.",
    ],
    semaforo: {
      verde: `CPA por debajo de ${i.cpa_maximo_cop ? cop(i.cpa_maximo_cop) : "su CPA máximo"} y frecuencia < 2.5 → siga subiendo.`,
      amarillo: "CPA sube 10-25% o frecuencia entre 2.5 y 3.5 → congele presupuesto y meta creativos nuevos.",
      rojo: "CPA sube más del 30% o frecuencia > 3.5 → baje al presupuesto anterior y renueve creativos ya.",
    },
    cuando_NO_escalar: [
      "Menos de 50 conversiones por semana en el conjunto: el algoritmo aún no aprende.",
      "Un solo creativo cargando toda la campaña: se le va a fatigar y se le cae todo.",
      "Sin inventario para responder: escalar y quedar sin stock quema plata y reseñas.",
      "El equipo de WhatsApp no da abasto: más leads sin respuesta = más plata botada.",
    ],
  };
}

/* ───────────────────────── 2. ESTRUCTURA META ADS ─────────────────────── */

function estructuraDeCampana(i: Input) {
  const v = i.vertical as Vertical;
  const mensual = i.presupuesto_mensual_cop;
  const diario = mensual / 30;
  const objetivo = i.objetivo;
  const nivel = i.nivel_cuenta ?? "nueva";

  const reparto =
    nivel === "nueva"
      ? { prospeccion: 0.7, remarketing: 0.2, retencion: 0.1 }
      : nivel === "con_historial"
      ? { prospeccion: 0.6, remarketing: 0.3, retencion: 0.1 }
      : { prospeccion: 0.65, remarketing: 0.25, retencion: 0.1 };

  const nombreObjetivo: Record<string, string> = {
    ventas_web: "Ventas (conversión: Compra)",
    mensajes_whatsapp: "Ventas → Conversaciones de WhatsApp (Click to WhatsApp)",
    leads_formulario: "Clientes potenciales (formulario instantáneo)",
    trafico_tienda_fisica: "Reconocimiento / Tráfico con segmentación por radio",
    catalogo: "Ventas del catálogo (Advantage+ Shopping o DPA)",
  };

  return {
    resumen: {
      presupuesto_mensual: cop(mensual),
      presupuesto_diario_total: cop(diario),
      objetivo_meta: nombreObjetivo[objetivo] ?? objetivo,
      nivel_cuenta: nivel,
    },
    nomenclatura_recomendada: {
      campana: "[NEGOCIO]_[OBJETIVO]_[ETAPA]_[MES-AÑO] → PERF_VENTAS_FRIO_ENE-26",
      conjunto: "[PUBLICO]_[UBICACION]_[EDAD] → LAL2%COMPRADORES_CO-BOG_25-45",
      anuncio: "[FORMATO]_[ANGULO]_[VERSION] → REEL_UGC-TESTIMONIO_V3",
      por_que: "Sin nomenclatura no puede leer reportes ni automatizar reglas. Esto no es opcional.",
    },
    campanas: [
      {
        n: 1,
        nombre: "PROSPECCIÓN (frío)",
        presupuesto_diario: cop(diario * reparto.prospeccion),
        tipo_presupuesto: mensual < 3_000_000 ? "CBO (Advantage Campaign Budget)" : "ABO para controlar por público",
        objetivo: nombreObjetivo[objetivo],
        conjuntos: [
          {
            nombre: "Advantage+ / Público amplio",
            publico: "Sin intereses, solo país/ciudades + edad. Deje que el algoritmo busque.",
            porcentaje: "40% del presupuesto de prospección",
          },
          {
            nombre: "Lookalike 1-3% de compradores",
            publico: "Similar a compradores últimos 180 días (mínimo 100 personas de semilla).",
            porcentaje: "35%",
          },
          {
            nombre: "Intereses",
            publico:
              v === "perfumeria"
                ? "Perfumes, Sephora, fragancias de nicho, belleza y cuidado personal, compradores comprometidos."
                : "Decoración del hogar, muebles, mudanza reciente, recién casados, Homecenter, arquitectura de interiores.",
            porcentaje: "25%",
          },
        ],
        creativos_minimos: "4 a 6 anuncios activos, mínimo 3 formatos distintos (Reel, imagen, carrusel).",
      },
      {
        n: 2,
        nombre: "REMARKETING (tibio y caliente)",
        presupuesto_diario: cop(diario * reparto.remarketing),
        tipo_presupuesto: "ABO — cada escalón necesita su propio presupuesto",
        conjuntos: [
          { nombre: "RM 0-3 días", publico: "Vio contenido, visitó web, interactuó IG/FB últimos 3 días.", nota: "Máxima urgencia, oferta directa." },
          { nombre: "RM 4-14 días", publico: "Agregó al carrito / inició conversación y no compró.", nota: "Prueba social + resolver objeción." },
          { nombre: "RM 15-60 días", publico: "Visitantes antiguos.", nota: "Oferta fuerte o novedad." },
        ],
        excluir_siempre: "Compradores de los últimos 30 días (salvo campaña de recompra).",
      },
      {
        n: 3,
        nombre: "RETENCIÓN / RECOMPRA",
        presupuesto_diario: cop(diario * reparto.retencion),
        conjuntos: [
          {
            nombre: "Compradores",
            publico:
              v === "perfumeria"
                ? "Compradores de 30-120 días → recompra, tamaño grande, línea nueva."
                : "Compradores de 60-365 días → complementar el ambiente (compró sala, ofrezca comedor o mesa auxiliar).",
          },
        ],
      },
    ],
    ubicaciones: {
      recomendado: "Ubicaciones Advantage+ (automáticas) al arrancar.",
      cuando_separar: "Solo cuando tenga más de 100 conversiones y vea que Audience Network gasta sin convertir.",
      prioridad_colombia: "Reels e Historias de Instagram concentran el consumo móvil colombiano.",
    },
    reglas_automaticas_sugeridas: [
      "Apagar anuncio si gasta 2x el CPA objetivo sin conversiones.",
      "Avisar si la frecuencia supera 3.0 en un conjunto de remarketing.",
      "Subir 15% el presupuesto si el CPA está 25% por debajo del objetivo por 3 días seguidos.",
    ],
    errores_a_evitar: [
      "Más de 5 conjuntos con presupuesto bajo: se canibalizan y ninguno sale de aprendizaje.",
      "Editar campañas todos los días: cada edición significativa reinicia el aprendizaje.",
      "Prospección y remarketing en la misma campaña con CBO: el algoritmo se come el presupuesto en remarketing.",
    ],
  };
}

function constructorPublicos(i: Input) {
  const v = i.vertical as Vertical;
  const etapa = i.etapa;
  const ciudades = i.ciudades?.length ? i.ciudades : ["Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga"];

  const intereses: Record<Vertical, string[]> = {
    perfumeria: [
      "Perfume", "Fragancia", "Sephora", "Cosméticos", "Belleza",
      "Chanel", "Dior", "Carolina Herrera", "Paco Rabanne", "Lattafa",
      "Compras en línea", "Compradores comprometidos (comportamiento)",
      "Regalos", "Cuidado personal", "Maquillaje",
    ],
    muebleria: [
      "Muebles", "Decoración del hogar", "Diseño de interiores", "Homecenter",
      "IKEA", "Sofá", "Mejoras para el hogar", "Bienes raíces",
      "Mudanza reciente (comportamiento)", "Recién casados (evento de vida)",
      "Propietarios de vivienda", "Arquitectura", "Jardinería",
    ],
  };

  const publicos: Record<string, Input> = {
    frio: {
      nombre: "Prospección — gente que no lo conoce",
      opciones: [
        { tipo: "Advantage+ amplio", detalle: "Sin intereses. Solo ubicación y edad. Es lo que mejor está funcionando en 2025-2026.", tamano: "Millones" },
        { tipo: "Lookalike 1%", detalle: "Similar a compradores últimos 180 días.", tamano: "~280.000 en Colombia" },
        { tipo: "Lookalike 2-3%", detalle: "Para escalar cuando el 1% se satura.", tamano: "~850.000" },
        { tipo: "Intereses", detalle: intereses[v].join(", "), tamano: "Segmentar en grupos de 3-5 intereses afines" },
      ],
      excluir: ["Compradores últimos 180 días", "Visitantes web últimos 30 días"],
    },
    tibio: {
      nombre: "Interacción — ya lo vio pero no compró",
      opciones: [
        { tipo: "Interacción IG/FB", detalle: "Personas que interactuaron con el perfil, últimos 30, 90 y 365 días." },
        { tipo: "Video 50%+", detalle: "Vieron más de la mitad de cualquier video, últimos 30 días. Oro puro para remarketing barato." },
        { tipo: "Visitantes web 30 días", detalle: "Todos los visitantes (requiere Pixel + CAPI)." },
        { tipo: "Lista de leads", detalle: "Base de WhatsApp/CRM subida como público personalizado (con autorización Habeas Data)." },
      ],
      excluir: ["Compradores últimos 30 días"],
    },
    caliente: {
      nombre: "Alta intención — casi compran",
      opciones: [
        { tipo: "Carrito abandonado 0-7 días", detalle: "AddToCart sin Purchase. El más rentable de la cuenta." },
        { tipo: "Checkout iniciado 0-14 días", detalle: "InitiateCheckout sin Purchase." },
        { tipo: "Vieron producto 3+ veces", detalle: "ViewContent con frecuencia alta." },
        { tipo: "Conversación iniciada sin cierre", detalle: "Escribieron al WhatsApp y no compraron." },
      ],
      excluir: ["Compradores últimos 7 días"],
    },
    recompra: {
      nombre: "Clientes — la plata más barata que existe",
      opciones:
        v === "perfumeria"
          ? [
              { tipo: "Compradores 30-90 días", detalle: "Un perfume de 100ml dura ~3 meses. Ese es el momento exacto de la recompra." },
              { tipo: "Compradores de tamaño pequeño", detalle: "Ofrecer el tamaño grande con mejor precio por ml." },
              { tipo: "Compradores de una sola línea", detalle: "Venta cruzada a la familia olfativa vecina." },
            ]
          : [
              { tipo: "Compradores 60-180 días", detalle: "Complementar el ambiente: compró sala → mesa auxiliar, tapete, lámpara." },
              { tipo: "Compradores 12+ meses", detalle: "Renovación y nuevo ambiente de la casa." },
              { tipo: "Compradores de alto ticket", detalle: "Programa de referidos: en mueblería el boca a boca vale más que la pauta." },
            ],
      excluir: [],
    },
  };

  return {
    vertical: v,
    etapa,
    publico: publicos[etapa],
    ubicacion_geografica: {
      ciudades_sugeridas: ciudades,
      detalle_por_ciudad: CIUDADES_CLAVE.filter((c) => ciudades.some((x: string) => c.ciudad.includes(x))),
      consejo:
        "Use 'Personas que viven en este lugar', nunca 'Personas que estuvieron recientemente'. Y excluya ciudades donde no puede entregar.",
    },
    demografia: {
      genero: i.genero ?? (v === "perfumeria" ? "todos (segmentar por línea)" : "todos"),
      edad: i.rango_edad ?? (v === "perfumeria" ? "18-45" : "28-55"),
      nota:
        v === "muebleria"
          ? "En mueblería la decisión suele ser de pareja: no excluya hombres aunque la mujer sea quien busca."
          : "Los decants y árabes pegan fuerte en 18-30; los diseñador originales en 28-45.",
    },
    exclusiones_obligatorias: [
      "Empleados y personal propio (súbalos como público personalizado y exclúyalos).",
      "Compradores recientes en campañas de adquisición.",
      "Públicos que ya están en otro conjunto de la misma campaña (evita superposición).",
    ],
    tip_2026:
      "Meta cada vez premia más el público amplio + creativo fuerte. La segmentación quirúrgica de intereses ya no manda: hoy el creativo ES la segmentación.",
  };
}

function planRemarketing(i: Input) {
  const v = i.vertical as Vertical;
  const presupuesto = i.presupuesto_remarketing_diario_cop ?? 0;
  const conCatalogo = i.tiene_catalogo ?? false;

  const escalones = [
    {
      escalon: 1,
      publico: "Carrito abandonado / conversación sin cierre — 0 a 3 días",
      porcentaje_presupuesto: 30,
      presupuesto: presupuesto ? cop(presupuesto * 0.3) : "—",
      mensaje: v === "perfumeria" ? "«Todavía le guardamos su perfume 🕐 pero quedan poquitas unidades»" : "«Le reservamos su sala 48 horas. ¿Se la despachamos?»",
      oferta: "Envío gratis o un pequeño detalle. NO descuento todavía.",
      formato: conCatalogo ? "Catálogo dinámico (DPA) con el producto exacto que vio" : "Carrusel con el producto + reseñas",
      frecuencia_objetivo: "3 a 5 impresiones por persona",
    },
    {
      escalon: 2,
      publico: "Visitantes y agregados al carrito — 4 a 14 días",
      porcentaje_presupuesto: 30,
      presupuesto: presupuesto ? cop(presupuesto * 0.3) : "—",
      mensaje: "Prueba social pura: testimonios en video, reseñas, cantidad de clientes.",
      oferta: "Descuento del 10% o 2x1 con vencimiento.",
      formato: "Video testimonio UGC + carrusel de reseñas",
      frecuencia_objetivo: "4 a 7",
    },
    {
      escalon: 3,
      publico: "Interacción IG/FB y video 50%+ — 15 a 60 días",
      porcentaje_presupuesto: 25,
      presupuesto: presupuesto ? cop(presupuesto * 0.25) : "—",
      mensaje: "Resolver la objeción principal: garantía, autenticidad, tiempos de entrega, financiación.",
      oferta: v === "perfumeria" ? "Garantía de originalidad + muestra de regalo" : "Financiación sin cuota inicial / cuotas con Addi o Sistecrédito",
      formato: "Video explicativo + preguntas frecuentes en carrusel",
      frecuencia_objetivo: "2 a 4",
    },
    {
      escalon: 4,
      publico: "Compradores — recompra",
      porcentaje_presupuesto: 15,
      presupuesto: presupuesto ? cop(presupuesto * 0.15) : "—",
      mensaje: v === "perfumeria" ? "«¿Ya se le está acabando? Le tenemos el mismo con 15% por ser cliente»" : "«Su sala quedó brutal. Complétela con la mesa auxiliar que le hace juego»",
      oferta: "Beneficio exclusivo de cliente, no descuento público.",
      formato: "Catálogo de productos complementarios",
      frecuencia_objetivo: "2 a 3",
    },
  ];

  return {
    vertical: v,
    presupuesto_diario_total: presupuesto ? cop(presupuesto) : "no informado",
    regla_de_reparto: "20-30% del presupuesto total va a remarketing. Si le pone más, se le acaba el público y le sube la frecuencia.",
    escalera: escalones,
    ventanas_por_vertical:
      v === "perfumeria"
        ? "Ciclo corto (1-7 días). Las ventanas de 3, 7, 14 y 30 días son las que sirven."
        : "Ciclo largo (7-45 días). Use ventanas de 7, 14, 30, 60 y hasta 90 días — el cliente compara y se toma su tiempo.",
    exclusiones_criticas: [
      "Excluir compradores en todos los escalones (menos el 4).",
      "Excluir el escalón anterior en cada escalón para no duplicar impactos.",
    ],
    señal_de_alerta: "Frecuencia arriba de 5 en remarketing = está quemando el público. Renueve creativo o amplíe la ventana.",
  };
}

function diagnosticoCampana(i: Input) {
  const v = i.vertical as Vertical;
  const b = BENCHMARKS[v]["trafico_frio_reels"];
  const hallazgos: Input[] = [];

  if (i.cpm_cop && i.cpm_cop > b.cpmCop[1]) {
    hallazgos.push({
      prioridad: "Alta",
      hallazgo: `CPM de ${cop(i.cpm_cop)} está por encima del rango sano (${rango(b.cpmCop, cop)}).`,
      causas: ["Público demasiado estrecho", "Temporada alta (Black Friday, Navidad)", "Baja calidad del anuncio (ranking negativo)", "Competencia subiendo pujas"],
      acciones: ["Ampliar el público o pasar a Advantage+ amplio", "Renovar creativo para subir el ranking de calidad", "Revisar si está compitiendo consigo mismo (superposición de públicos)"],
    });
  }
  if (i.ctr_pct !== undefined && i.ctr_pct < b.ctrPct[0]) {
    hallazgos.push({
      prioridad: "Crítica",
      hallazgo: `CTR de ${pct(i.ctr_pct)} por debajo del mínimo sano (${pct(b.ctrPct[0])}).`,
      causas: ["El gancho de los primeros 3 segundos no funciona", "Creativo genérico o tipo catálogo", "Público equivocado", "Oferta poco clara"],
      acciones: ["Cambiar el gancho: precio, dolor o resultado en el primer segundo", "Meter UGC real, no foto de estudio", "Poner el precio en el creativo (filtra y sube calidad del clic)"],
    });
  }
  if (i.frecuencia && i.frecuencia > 3.5) {
    hallazgos.push({
      prioridad: "Alta",
      hallazgo: `Frecuencia de ${i.frecuencia.toFixed(1)}: fatiga de creativo confirmada.`,
      causas: ["Mismo creativo demasiado tiempo", "Público pequeño para el presupuesto"],
      acciones: ["Subir 3-5 creativos nuevos esta semana", "Ampliar el público o bajar presupuesto", "Rotar ángulo de venta, no solo el video"],
    });
  }
  if (i.conversiones_semana !== undefined && i.conversiones_semana < 50) {
    hallazgos.push({
      prioridad: "Alta",
      hallazgo: `${i.conversiones_semana} conversiones/semana: el conjunto no sale de la fase de aprendizaje (necesita ~50).`,
      causas: ["Presupuesto muy repartido entre conjuntos", "Evento de conversión demasiado profundo"],
      acciones: ["Consolidar conjuntos: menos conjuntos con más plata cada uno", "Optimizar por un evento más arriba (AddToCart o conversación) mientras junta volumen", "Subir presupuesto del conjunto principal"],
    });
  }
  if (i.dias_activa !== undefined && i.dias_activa < 7) {
    hallazgos.push({
      prioridad: "Informativa",
      hallazgo: `Solo ${i.dias_activa} días activa. Todavía está en aprendizaje.`,
      causas: ["Es normal"],
      acciones: ["NO tocar nada antes de 7 días o 50 conversiones. Cada edición reinicia el aprendizaje.", "Aguante. La ansiedad es el error más caro en Meta Ads."],
    });
  }
  if (i.tasa_conversion_landing_pct !== undefined && i.tasa_conversion_landing_pct < b.cvrLandingPct[0]) {
    hallazgos.push({
      prioridad: "Crítica",
      hallazgo: `Conversión de landing en ${pct(i.tasa_conversion_landing_pct)}: el problema NO es la pauta, es la página.`,
      causas: ["Carga lenta en móvil", "Precio escondido", "Falta prueba social", "Sin métodos de pago colombianos (Nequi, contraentrega)", "Checkout muy largo"],
      acciones: ["Medir velocidad en 4G real, no en wifi", "Precio, envío y garantía visibles sin hacer scroll", "Botón de WhatsApp flotante siempre", "Habilitar contraentrega si el ticket lo permite"],
    });
  }
  if (i.cpa_cop && i.cpa_cop > b.cpaVentaCop[1]) {
    hallazgos.push({
      prioridad: "Crítica",
      hallazgo: `CPA de ${cop(i.cpa_cop)} supera el rango del mercado (${rango(b.cpaVentaCop, cop)}).`,
      causas: ["Suma de los problemas anteriores", "Ticket bajo para el costo de adquisición", "Atribución mal configurada (ventas de WhatsApp que no se registran)"],
      acciones: ["Verificar que TODAS las ventas se estén reportando (CAPI + eventos de WhatsApp)", "Subir el ticket con combos antes que bajar el CPA", "Revisar el embudo completo con la herramienta de proyección"],
    });
  }

  if (!hallazgos.length) {
    hallazgos.push({
      prioridad: "Informativa",
      hallazgo: "Con los datos entregados no se detectan alertas contra los rangos del mercado colombiano.",
      causas: [],
      acciones: ["Pida más datos: CPM, CTR, frecuencia, conversiones semanales y conversión de landing para un diagnóstico fino."],
    });
  }

  return {
    vertical: v,
    sintoma_reportado: i.sintoma ?? "no informado",
    rangos_de_referencia: {
      cpm: rango(b.cpmCop, cop),
      ctr: rango(b.ctrPct, (n) => pct(n)),
      cpc: rango(b.cpcCop, cop),
      cpa: rango(b.cpaVentaCop, cop),
    },
    hallazgos: hallazgos.sort((a, b2) => {
      const orden: Record<string, number> = { Crítica: 0, Alta: 1, Informativa: 2 };
      return orden[a.prioridad] - orden[b2.prioridad];
    }),
    orden_de_revision:
      "Siempre en este orden: 1) Medición (¿está midiendo bien?) → 2) Oferta → 3) Creativo → 4) Público → 5) Presupuesto. La gente arranca por el 5 y por eso no arregla nada.",
  };
}

function checklistPixelCapi(i: Input) {
  const plataforma = i.plataforma;
  return {
    plataforma,
    paso_0_verificacion_dominio: [
      "Verificar el dominio en Meta Business Manager (Configuración del negocio → Seguridad de la marca → Dominios).",
      "Sin dominio verificado no puede priorizar eventos web y pierde señal por iOS.",
    ],
    paso_1_pixel: [
      "Instalar el Pixel base en todas las páginas.",
      "Eventos estándar mínimos: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead, Contact.",
      "Cada evento debe enviar valor (value) y moneda (currency: COP). Sin valor, no hay ROAS ni optimización por valor.",
      "Verificar con la extensión Meta Pixel Helper que no haya eventos duplicados.",
    ],
    paso_2_capi: {
      por_que: "El Pixel solo captura entre el 50 y el 70% de los eventos por bloqueadores e iOS. La API de Conversiones recupera el resto.",
      como:
        plataforma === "shopify"
          ? "Canal de Facebook y Meta en Shopify → activar 'Máximo' en el nivel de intercambio de datos. Sale nativo."
          : plataforma === "woocommerce"
          ? "Plugin oficial 'Facebook for WooCommerce' → activar API de Conversiones y pegar el token de acceso."
          : plataforma === "solo_whatsapp"
          ? "Usar la API de Conversiones para mensajes de WhatsApp o cargar conversiones offline por CSV al menos una vez por semana."
          : "Implementar CAPI vía servidor (Node/PHP) o con Google Tag Manager del lado del servidor. Alternativa rápida: Stape.io.",
      deduplicacion:
        "OBLIGATORIO: enviar el mismo event_id desde Pixel y CAPI. Si no, Meta cuenta doble y usted toma decisiones con datos inflados.",
    },
    paso_3_parametros_de_coincidencia: [
      "Enviar siempre que se pueda: email (hasheado), teléfono (hasheado, formato +57...), nombre, apellido, ciudad, país (co), fbc y fbp.",
      "Meta objetivo: calidad de coincidencia de eventos por encima de 6.0 (idealmente 8+).",
      "El teléfono en Colombia debe ir en formato E.164: +573001234567.",
    ],
    paso_4_priorizacion_eventos_web: [
      "Configurar los 8 eventos priorizados en Business Manager (Administrador de eventos → Configuración de medición de eventos agregados).",
      "Orden sugerido: 1) Purchase 2) InitiateCheckout 3) AddToCart 4) Lead/Contact 5) ViewContent 6) PageView.",
    ],
    paso_5_verificacion: [
      "Probar el flujo completo con Prueba de Eventos en tiempo real.",
      "Confirmar que Purchase llegue con valor correcto en COP (no en USD, error clásico).",
      "Comparar ventas de Meta vs ventas reales de la tienda: si la diferencia supera el 25%, algo está mal medido.",
    ],
    errores_frecuentes_colombia: [
      "Reportar el valor en dólares porque la plantilla venía en USD → ROAS inflado x4000.",
      "No medir las ventas cerradas por WhatsApp → Meta cree que la campaña no vende y deja de optimizar.",
      "Contraentrega contabilizada al momento del pedido y no de la entrega → ROAS falso con 25% de devoluciones.",
    ],
    ventana_de_atribucion:
      "Estándar: 7 días clic / 1 día visualización. En mueblería vale la pena mirar también 28 días clic en el comparador de atribución, porque el ciclo es largo.",
  };
}

function checklistCatalogoAdvantage(i: Input) {
  const v = i.vertical as Vertical;
  return {
    vertical: v,
    campos_obligatorios_del_feed: [
      "id (único y estable, nunca cambiarlo)",
      "title (incluir marca + tipo + tamaño: 'Perfume X EDP 100ml Original')",
      "description",
      "availability (in stock / out of stock — sincronizar a diario)",
      "condition (new)",
      "price (en COP, formato: 189000 COP)",
      "link (URL del producto)",
      "image_link (mínimo 500x500, ideal 1200x1200, fondo limpio)",
      "brand",
    ],
    campos_recomendados: [
      "sale_price y sale_price_effective_date para promociones",
      "google_product_category y product_type para mejor clasificación",
      "custom_label_0 a 4: úselos para marcar margen alto, más vendidos, temporada, línea",
      "additional_image_link (mínimo 3 fotos por producto)",
    ],
    conjuntos_de_productos_sugeridos:
      v === "perfumeria"
        ? ["Más vendidos", "Margen alto", "Línea masculina", "Línea femenina", "Árabes / nicho", "Decants y tamaños pequeños", "Kits y combos"]
        : ["Sala", "Comedor", "Alcoba", "Colchones", "Oficina y estudio", "Exteriores", "Ticket alto (>$3M)", "Entrega inmediata"],
    advantage_plus_shopping: {
      cuando_usarlo: "Con al menos 50 compras en los últimos 30 días en la cuenta. Antes de eso rinde poco.",
      configuracion: [
        "Presupuesto mínimo sugerido: el CPA objetivo x 5 al día.",
        "Definir el % de presupuesto para clientes existentes (empezar en 20%).",
        "Subir mínimo 8-10 creativos variados: el algoritmo necesita con qué jugar.",
        "No tocar durante 7 días completos.",
      ],
      combinar_con: "Mantener 1 campaña manual de prospección y 1 de remarketing en paralelo para no depender de una sola caja negra.",
    },
    dpa_remarketing: {
      que_es: "Anuncios dinámicos que le muestran a cada persona exactamente el producto que vio.",
      requisito: "Catálogo conectado + eventos ViewContent, AddToCart y Purchase enviando content_id que coincida con el id del feed.",
      error_numero_1: "El content_id del Pixel no coincide con el id del catálogo. Si no coinciden, el DPA no funciona y nadie se da cuenta.",
    },
    errores_tipicos_colombia: [
      "Precios sin actualizar tras una promoción → el usuario ve un precio y en la web otro. Meta lo penaliza y el cliente desconfía.",
      "Fotos con marca de agua o texto excesivo.",
      "Productos agotados activos en el catálogo quemando presupuesto.",
      "Descripciones copiadas del proveedor, sin palabras que la gente busca en Colombia.",
    ],
  };
}

function planTestAb(i: Input) {
  const p = (i.tasa_conversion_actual_pct ?? 2) / 100;
  const mde = (i.mejora_minima_detectable_pct ?? 20) / 100;
  const delta = p * mde;
  const nPorVariante = Math.ceil((16 * p * (1 - p)) / (delta * delta));
  const cpaEsperado = i.cpa_esperado_cop;
  const presupuestoDiario = i.presupuesto_diario_cop ?? cpaEsperado * 3;
  const conversionesNecesarias = Math.ceil(nPorVariante * p);
  const presupuestoTotal = conversionesNecesarias * 2 * cpaEsperado;
  const dias = Math.max(7, Math.ceil(presupuestoTotal / presupuestoDiario));

  const queVariar: Record<string, string[]> = {
    creativo: ["Formato (Reel vs carrusel vs imagen)", "Gancho de los primeros 3 segundos", "Con rostro vs sin rostro", "UGC vs producción de estudio"],
    copy: ["Beneficio vs precio", "Texto corto vs largo", "Con emoji vs sin emoji", "Usted vs tú"],
    publico: ["Advantage+ amplio vs intereses", "Lookalike 1% vs 3%", "Ciudad A vs ciudad B", "Rango de edad"],
    oferta: ["Descuento % vs envío gratis", "2x1 vs regalo", "Con urgencia vs sin urgencia", "Precio ancla visible vs no"],
    landing: ["Página de producto vs landing dedicada", "Con contraentrega vs solo prepago", "Formulario corto vs WhatsApp directo"],
    ubicacion: ["Solo Reels vs Advantage+ ubicaciones", "Con Audience Network vs sin"],
    objetivo: ["Ventas web vs mensajes a WhatsApp", "Optimizar por compra vs por AddToCart"],
  };

  return {
    variable_a_probar: i.variable,
    regla_de_oro: "Una sola variable a la vez. Si cambia dos cosas y mejora, nunca va a saber cuál fue.",
    ideas_de_variantes: queVariar[i.variable] ?? [],
    tamano_de_muestra: {
      visitas_o_impresiones_por_variante: num(nPorVariante),
      conversiones_necesarias_por_variante: num(conversionesNecesarias),
      supuesto_tasa_base: pct(p * 100),
      mejora_minima_detectable: pct(mde * 100),
      nota: "Cálculo aproximado para ~95% de confianza y 80% de potencia. Es una guía de planeación, no una prueba estadística formal.",
    },
    presupuesto: {
      diario_sugerido: cop(presupuestoDiario),
      total_estimado_de_la_prueba: cop(presupuestoTotal),
      duracion_estimada: `${dias} días`,
      minimo_recomendado: "Nunca menos de 7 días: hay que cubrir el ciclo semanal completo (fin de semana incluido).",
    },
    como_montarla: [
      "Duplicar el conjunto y cambiar SOLO la variable en prueba.",
      "Mismo presupuesto, mismas fechas, mismo horario en ambas variantes.",
      "Usar la herramienta de Pruebas A/B de Meta si es público, o conjuntos separados si es creativo.",
      "No mirar resultados antes del día 4. Los primeros días son ruido de aprendizaje.",
    ],
    criterio_de_decision: [
      `Gana la variante que baje el CPA por debajo de ${cop(cpaEsperado * 0.85)} sosteniéndolo 3 días.`,
      "Si la diferencia es menor al 15%, considérelo empate: quédese con la más simple de producir.",
      "Documente el resultado. Un aprendizaje sin documentar se repite y se vuelve a pagar.",
    ],
  };
}

/* ─────────────────────── 3. CREATIVOS Y CONTENIDO ────────────────────── */

function frameworkCopyAds(i: Input) {
  const v = i.vertical as Vertical;
  const etapa = i.etapa_embudo;
  const tono: "cercano_usted" | "juvenil_tu" | "paisa_vos" = i.tono ?? "cercano_usted";

  const angulos: Record<Vertical, string[]> = {
    perfumeria: [
      "Duración y proyección: «huele rico 8 horas seguidas, no de esos que se van en dos horas»",
      "Precio vs original: «la misma esencia, la tercera parte del precio»",
      "Cumplido social: «le van a preguntar qué se echó»",
      "Regalo perfecto: resuelve el problema de qué regalar",
      "Autenticidad y garantía: contra el miedo a la falsificación",
      "Identidad: «el perfume que le va a su personalidad»",
      "Ocasión: uno para la oficina, otro para la rumba",
      "Descubrimiento: decants para probar sin gastarse todo",
    ],
    muebleria: [
      "Transformación: antes y después del espacio",
      "Financiación: «llévelo desde $89.000 al mes»",
      "Fabricación propia: «somos fábrica, sin intermediarios»",
      "Medidas a la medida: para apartamentos pequeños colombianos",
      "Durabilidad: madera real vs aglomerado, garantía de años",
      "Entrega e instalación: «se lo llevamos y se lo armamos»",
      "Espacio pequeño: multifuncional para apartaestudios",
      "Orgullo de casa: «que le den ganas de recibir visita»",
    ],
  };

  const ganchos: Record<Vertical, string[]> = {
    perfumeria: [
      "«Si le gusta [perfume caro], le va a encantar este… y le cuesta la tercera parte»",
      "«Deje de comprar perfumes que se le van en 2 horas»",
      "«Este es el que más me preguntan en la calle»",
      "«$XX.000 y huele a millón»",
      "«Perfumes que sí duran, sin pagar de más»",
    ],
    muebleria: [
      "«Así se veía mi sala hace 3 semanas… mire cómo quedó»",
      "«¿Su apartamento es pequeño? Este mueble le cambia todo»",
      "«Somos fábrica: le muestro los precios sin intermediario»",
      "«Desde $XX.000 mensuales y sin cuota inicial»",
      "«La sala que todo el mundo me pregunta dónde la compré»",
    ],
  };

  const frameworks = [
    {
      nombre: "PAS (Problema – Agitación – Solución)",
      cuando: "Frío. Es el que más convierte en Colombia.",
      estructura: "1) Nombre el problema que ya siente. 2) Muestre lo que le cuesta seguir así. 3) Presente su producto como salida. 4) CTA.",
      ejemplo:
        v === "perfumeria"
          ? "«¿Cansado de que su perfume se le vaya antes del almuerzo? Uno gasta $300.000 y a las 2 horas no huele a nada. Este de aquí le dura 8 horas y le cuesta $89.000. Escríbanos y le contamos.»"
          : "«¿Su sala ya se ve cansada y le da pena recibir visita? Cambiarla parece imposible con lo cara que está la vida. Por eso hacemos muebles de fábrica desde $89.000 al mes, sin cuota inicial. Escríbanos y le mandamos el catálogo.»",
    },
    {
      nombre: "AIDA (Atención – Interés – Deseo – Acción)",
      cuando: "Frío y tibio, formatos de video.",
      estructura: "Gancho fuerte → dato o beneficio → prueba social/deseo → CTA claro.",
    },
    {
      nombre: "4U (Útil – Urgente – Único – Ultraespecífico)",
      cuando: "Ofertas y fechas comerciales.",
      estructura: "Cada línea del copy debe cumplir al menos dos de las cuatro U.",
    },
    {
      nombre: "Antes – Después – Puente",
      cuando: "Mueblería y transformaciones.",
      estructura: "Cómo está hoy → cómo quedaría → el producto es el puente.",
    },
    {
      nombre: "Testimonio directo",
      cuando: "Remarketing (tibio y caliente).",
      estructura: "Cliente real hablando: qué dudaba, qué pasó, cómo le fue.",
    },
    {
      nombre: "Objeción frontal",
      cuando: "Caliente. Ataca lo único que lo detiene.",
      estructura: "«¿Le da miedo que no sea original? Le explico cómo lo verifica usted mismo…»",
    },
  ];

  const ctas: Record<string, string[]> = {
    frio: ["Escríbanos al WhatsApp y le mandamos la lista de precios", "Mire el catálogo completo aquí", "Comente PRECIO y le escribimos"],
    tibio: ["Aparte el suyo hoy", "Le reservamos el suyo por 24 horas", "Pida el suyo y le llega a la casa"],
    caliente: ["Compre ahora con envío gratis", "Últimas unidades — pídalo ya", "Escriba «LO QUIERO» y se lo despachamos hoy"],
  };

  return {
    vertical: v,
    producto: i.producto ?? "línea general",
    etapa: etapa,
    tono_solicitado: tono,
    guia_de_tono: {
      cercano_usted: "«Le tengo», «mire pues», «aproveche». Respetuoso y cercano. El que mejor funciona en general.",
      juvenil_tu: "«Te tengo», «mira esto», «no te lo pierdas». Bogotá y público 18-28.",
      paisa_vos: "«Vos sabés», «hágale pues», «una nota». Antioquia y Eje Cafetero, genera mucha cercanía local.",
    }[tono],
    angulos_de_venta: angulos[v],
    ganchos_3_segundos: ganchos[v],
    frameworks_recomendados: frameworks,
    ctas_por_etapa: ctas[etapa],
    oferta_vigente: i.oferta ?? "sin oferta declarada",
    reglas_de_copy_colombia: [
      "Precio siempre en pesos con puntos de mil: $189.000, nunca 189000 ni 189K.",
      "Diga «domicilio» o «envío», no «delivery».",
      "El primer renglón es el 80% del trabajo: debe funcionar aunque nadie expanda el texto.",
      "Emojis: 2 a 4 máximo. Más se ve a spam.",
      "Nada de promesas absolutas ('el mejor del mundo'): la SIC sanciona publicidad engañosa.",
      "Si menciona descuento, el precio anterior debe haber estado realmente vigente.",
    ],
    prohibido_por_meta: [
      "Prometer resultados garantizados.",
      "Interpelar atributos personales («¿Estás gordo?», «¿Te huele mal?»).",
      "Imágenes de antes/después de cuerpo humano en salud y belleza.",
      "Texto excesivo sobre la imagen (no bloquea, pero baja el alcance).",
    ],
  };
}

function guionVideoUgc(i: Input) {
  const v = i.vertical as Vertical;
  const dur = i.duracion_segundos ?? 30;
  const formato = i.formato;

  const bloques = [
    { seg: `0-3s`, bloque: "GANCHO", que_hacer: "Frase que detiene el scroll + movimiento en cámara. Nada de logos ni intros.", texto_pantalla: "Frase corta, 5-7 palabras máximo" },
    { seg: `3-${Math.round(dur * 0.3)}s`, bloque: "CONTEXTO / PROBLEMA", que_hacer: "Por qué esto le importa a quien mira. Hable de la persona, no del producto.", texto_pantalla: "Refuerce el dolor" },
    { seg: `${Math.round(dur * 0.3)}-${Math.round(dur * 0.6)}s`, bloque: "PRODUCTO EN ACCIÓN", que_hacer: "Mostrar el producto usándose de verdad. Planos cortos, cambio cada 2 segundos.", texto_pantalla: "Beneficio concreto" },
    { seg: `${Math.round(dur * 0.6)}-${Math.round(dur * 0.8)}s`, bloque: "PRUEBA", que_hacer: "Testimonio, reseña, cantidad de clientes, garantía o proceso de fabricación.", texto_pantalla: "Dato de credibilidad" },
    { seg: `${Math.round(dur * 0.8)}-${dur}s`, bloque: "OFERTA + CTA", que_hacer: "Precio, beneficio y qué hacer ahora. Decirlo Y mostrarlo en pantalla.", texto_pantalla: "Precio + «Escríbenos al WhatsApp»" },
  ];

  const guiaFormato: Record<string, Input> = {
    testimonio: { grabar: "Persona real hablando a cámara, celular vertical, luz natural, sin guion memorizado.", clave: "Que se note casero. Producción muy pulida baja el rendimiento en UGC." },
    antes_despues: { grabar: "Mismo encuadre exacto antes y después. Trípode o marca en el piso.", clave: "El corte de transición es el momento de mayor retención. Ponga música al golpe." },
    unboxing: { grabar: "Manos abriendo el paquete, primer plano, sonido real del empaque.", clave: "Mostrar el empaque protegido: en Colombia importa mucho que llegue bien." },
    problema_solucion: { grabar: "Escena del problema exagerada (3s) y luego la solución.", clave: "Humor liviano funciona muy bien en el público colombiano." },
    showroom_tour: { grabar: "Recorrido caminando, plano continuo, mostrando escala real de los muebles.", clave: "Poner a una persona al lado del mueble para que se entienda el tamaño." },
    comparativa: { grabar: "Lado a lado: opción cara vs la suya.", clave: "No mencionar marcas de la competencia por nombre (política de Meta y riesgo legal)." },
    trend: { grabar: "Adaptar un audio o formato que esté sonando en TikTok/Reels Colombia.", clave: "Revisar la biblioteca de audios en tendencia; la ventana de un trend es de 7 a 10 días." },
  };

  return {
    vertical: v,
    producto: i.producto ?? "producto principal",
    formato,
    duracion: `${dur} segundos`,
    estructura_por_segundo: bloques,
    guia_de_produccion: guiaFormato[formato],
    especificaciones_tecnicas: {
      relacion_aspecto: "9:16 vertical (1080x1920). Nada horizontal.",
      zona_segura: "Deje 250px libres arriba y 350px abajo: ahí van los botones de Instagram.",
      subtitulos: "OBLIGATORIOS. El 80% ve sin audio. Letra grande, alto contraste, quemados en el video.",
      audio: "Voz clara + música de fondo baja. Usar audios de tendencia cuando aplique.",
      primer_frame: "Debe funcionar como miniatura estática. Nada de pantalla negra.",
    },
    cuantos_producir: "Mínimo 4 variaciones del mismo guion cambiando solo el gancho. El gancho es lo que más mueve la aguja.",
    oferta: i.oferta ?? "definir oferta",
    errores_comunes: [
      "Arrancar con el logo: pierde el 40% de la audiencia en el primer segundo.",
      "Video muy largo sin cortes: cambie de plano cada 2-3 segundos.",
      "No decir el precio: si el producto es barato, el precio ES el gancho.",
      "Grabar en horizontal y recortar: se ve amateur y mal.",
    ],
  };
}

function calendarioContenido(i: Input) {
  const v = i.vertical as Vertical;
  const semanas = i.semanas ?? 4;
  const piezas = i.piezas_por_semana ?? 5;
  const plataformas = i.plataformas ?? ["instagram", "facebook", "tiktok"];
  const mes = i.mes;

  const pilares: Record<Vertical, { pilar: string; peso: string; formatos: string[] }[]> = {
    perfumeria: [
      { pilar: "Educación olfativa", peso: "25%", formatos: ["Reel: familias olfativas explicadas", "Carrusel: qué es EDP vs EDT", "Historia: pregunta abierta"] },
      { pilar: "Producto y venta", peso: "30%", formatos: ["Reel de producto con precio", "Carrusel de combos", "Publicación de lanzamiento"] },
      { pilar: "Prueba social", peso: "25%", formatos: ["Testimonio en video", "Captura de reseña de WhatsApp", "Repost de cliente"] },
      { pilar: "Detrás de cámaras", peso: "20%", formatos: ["Empacando pedidos", "El equipo", "Cómo verificamos originalidad"] },
    ],
    muebleria: [
      { pilar: "Inspiración y decoración", peso: "30%", formatos: ["Reel de ambientes", "Carrusel de paletas de color", "Tips de espacios pequeños"] },
      { pilar: "Producto y precio", peso: "25%", formatos: ["Recorrido del showroom", "Ficha con medidas y precio", "Comparativa de materiales"] },
      { pilar: "Prueba social", peso: "25%", formatos: ["Antes y después de casa de cliente", "Entrega e instalación", "Testimonio"] },
      { pilar: "Fábrica y confianza", peso: "20%", formatos: ["Proceso de fabricación", "Control de calidad", "Garantía explicada"] },
    ],
  };

  const fechaDelMes = mes ? CALENDARIO_COMERCIAL.filter((f) => f.mes === mes) : [];

  const semanasPlan = Array.from({ length: semanas }, (_, s) => ({
    semana: s + 1,
    tema_eje: v === "perfumeria"
      ? ["Duración y proyección", "Regalo y ocasión", "Autenticidad y garantía", "Combos y ahorro"][s % 4]
      : ["Transformar el espacio", "Financiación accesible", "Somos fábrica", "Espacios pequeños"][s % 4],
    piezas: Array.from({ length: piezas }, (_, p) => {
      const pilar = pilares[v][p % pilares[v].length];
      return {
        dia: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][p % 7],
        pilar: pilar.pilar,
        formato: pilar.formatos[s % pilar.formatos.length],
        plataformas,
        objetivo: p % 3 === 0 ? "Venta directa" : p % 3 === 1 ? "Alcance y descubrimiento" : "Confianza",
        se_pauta: p % 3 === 0,
      };
    }),
  }));

  return {
    vertical: v,
    semanas,
    piezas_por_semana: piezas,
    plataformas,
    pilares_de_contenido: pilares[v],
    fechas_comerciales_del_mes: fechaDelMes.length ? fechaDelMes : "sin mes especificado o sin fechas relevantes",
    plan: semanasPlan,
    reglas: [
      "Regla 70/30: 70% aportar valor, 30% vender directo. Si solo vende, el alcance se le cae.",
      "Todo Reel que pase de 3.000 vistas orgánicas se promociona: ya validó que engancha.",
      "Publicar entre 6-8 pm y 12-1 pm, que es cuando Colombia está en el celular.",
      "Estados de WhatsApp: subir 2-3 al día. Es el canal más subestimado y el más barato del país.",
    ],
    reciclaje: "Un Reel bueno se reusa: TikTok, Reels, Shorts, estado de WhatsApp y anuncio. No produzca 5 veces lo mismo.",
  };
}

/* ─────────────────────── 4. VENTAS Y CIERRE ──────────────────────────── */

function plantillasWhatsapp(i: Input) {
  const v = i.vertical as Vertical;
  const momento = i.momento;
  const prod = i.producto ?? (v === "perfumeria" ? "el perfume" : "el mueble");

  const plantillas: Record<string, Input> = {
    primer_contacto: {
      objetivo: "Responder rápido, calificar y no soltar el precio de una sin contexto.",
      tiempo_de_respuesta: "Menos de 5 minutos. Después de 30 minutos la probabilidad de cierre cae más del 50%.",
      mensajes: [
        "¡Hola! 👋 Bienvenido a [NEGOCIO], le habla [NOMBRE]. ¿Con quién tengo el gusto?",
        `Perfecto [NOMBRE]. Cuénteme, ¿está buscando ${prod} para usted o para regalo?`,
        v === "perfumeria"
          ? "¿Le gustan más los aromas dulces, frescos o amaderados? Así le recomiendo el que le va."
          : "¿Para qué espacio lo necesita y cuánto mide más o menos? Así le muestro las opciones que sí le caben.",
        "Le paso las opciones que más se venden 👇 [FOTOS + PRECIOS]",
      ],
      errores: ["Contestar solo «Hola, sí tenemos»", "Mandar el catálogo completo sin preguntar nada", "Dejar en visto y contestar 4 horas después"],
    },
    cotizacion: {
      objetivo: "Presentar el precio con valor alrededor, no el precio pelado.",
      mensajes: [
        `Le cuento: ${prod} le queda en $[PRECIO] 💰`,
        "Eso incluye: ✅ [BENEFICIO 1] ✅ [BENEFICIO 2] ✅ Garantía de [X]",
        v === "perfumeria"
          ? "Y si lleva dos, le queda cada uno en $[PRECIO_COMBO] — la mayoría lleva el combo."
          : "Se lo podemos financiar desde $[CUOTA] al mes sin cuota inicial, con Addi o Sistecrédito.",
        "¿Se lo aparto? Le puedo reservar el suyo hoy.",
      ],
      tip: "Nunca mande solo el número. Precio sin contexto = objeción de precio garantizada.",
    },
    seguimiento: {
      objetivo: "Recuperar al que se enfrió sin sonar desesperado.",
      secuencia: [
        { cuando: "3 horas después", mensaje: "[NOMBRE], ¿alcanzó a mirar las opciones? Si tiene alguna duda me dice y le ayudo 😊" },
        { cuando: "Día 2", mensaje: `Le comparto lo que dice una clienta que compró ${prod} la semana pasada 👇 [CAPTURA/VIDEO]` },
        { cuando: "Día 4", mensaje: "[NOMBRE], le tengo una noticia: hasta mañana le puedo dejar [BENEFICIO/ENVÍO GRATIS]. ¿Lo aprovechamos?" },
        { cuando: "Día 7", mensaje: "Entiendo que de pronto no era el momento 🙌 Le dejo por acá mi contacto y cuando lo necesite me escribe. ¡Que esté muy bien!" },
      ],
      regla: "Máximo 4 seguimientos. Después de eso se pasa a la lista de remarketing, no al WhatsApp.",
    },
    carrito_abandonado: {
      objetivo: "Rescatar la venta con un empujón concreto.",
      mensajes: [
        "[NOMBRE], vi que dejó [PRODUCTO] en el carrito 🛒 ¿Le quedó alguna duda?",
        "Si es por el envío, se lo dejo GRATIS hoy 🚚",
        "Le dejo el link para que termine desde ahí mismo 👉 [LINK DE PAGO]",
      ],
      tiempos: "Primer mensaje a la hora, segundo a las 24 horas, tercero a las 72 horas.",
    },
    postventa: {
      objetivo: "Asegurar la reseña, la foto y la recompra.",
      mensajes: [
        "¡[NOMBRE], su pedido ya salió! 📦 Guía: [GUÍA] con [TRANSPORTADORA]. Le llega el [FECHA].",
        "¿Ya le llegó? Cuénteme cómo le pareció 😊",
        "Si le gustó, ¿me haría el favor de mandarme una fotico o un audio cortico? Nos ayuda muchísimo y le doy [BENEFICIO] en su próxima compra.",
      ],
      valor: "Cada testimonio que recoge acá es un creativo gratis para Meta Ads. Ese es el activo más barato que tiene.",
    },
    recompra: {
      objetivo: "Traer de vuelta al cliente cuando toca.",
      cuando: v === "perfumeria" ? "Entre 60 y 90 días después de la compra (cuando se le está acabando)." : "Entre 3 y 9 meses (complementar el ambiente).",
      mensajes: [
        v === "perfumeria"
          ? "[NOMBRE], ¿ya se le está acabando el [PRODUCTO]? Le tengo el mismo con 15% por ser cliente 🙌"
          : "[NOMBRE], ¡qué tal quedó su [PRODUCTO]! Le tengo [COMPLEMENTO] que le hace juego, con precio de cliente.",
        "Solo por hoy y mañana, y se lo despacho de una.",
      ],
    },
  };

  return {
    vertical: v,
    momento,
    plantilla: plantillas[momento],
    configuracion_whatsapp_business: [
      "Mensaje de bienvenida automático con horario de atención.",
      "Respuestas rápidas (atajos /precio, /envio, /garantia) para responder en segundos.",
      "Etiquetas: Nuevo, Cotizado, En seguimiento, Comprado, Perdido. Sin etiquetas no hay seguimiento.",
      "Catálogo cargado dentro de WhatsApp Business con precios.",
      "Link corto wa.me/57XXXXXXXXXX con mensaje predefinido para los anuncios.",
    ],
    metricas_a_medir: ["Tiempo de primera respuesta", "% de conversaciones que llegan a cotización", "% de cotizaciones que cierran", "Ticket promedio por asesor"],
    regla_de_oro: "El 60% de las campañas de Meta que 'no funcionan' en Colombia en realidad fallan en el WhatsApp, no en la pauta.",
  };
}

function manejoObjeciones(i: Input) {
  const v = i.vertical as Vertical;
  const canal = i.canal ?? "whatsapp";

  const comunes = [
    {
      objecion: "«Está muy caro»",
      que_significa: "Casi nunca es el precio: es que no ve el valor todavía.",
      respuesta:
        v === "perfumeria"
          ? "«Le entiendo. Mire, si lo divide: le rinde unos 4 meses usándolo a diario, o sea unos $1.500 al día. Y no es de esos que se van en 2 horas. ¿Quiere que le muestre uno más económico o prefiere este que sí le dura?»"
          : "«Le entiendo perfectamente. Por eso lo manejamos financiado: le quedaría en $[CUOTA] al mes, sin cuota inicial. Y es madera real con garantía de [X] años, no aglomerado que se abomba al año. ¿Le sirve así?»",
      no_hacer: "Bajar el precio de una. Si lo hace, le enseñó al cliente que su precio era inflado.",
    },
    {
      objecion: "«Lo voy a pensar»",
      que_significa: "Hay una duda concreta que no le dijo.",
      respuesta:
        "«Claro que sí, tómese su tiempo 🙌 Solo por curiosidad, ¿qué es lo que más lo tiene dudando: el precio, el tiempo de entrega o si le va a servir? Se lo pregunto porque de pronto le puedo resolver eso mismo ahorita.»",
      no_hacer: "Decir «bueno, cualquier cosa me avisa» y desaparecer.",
    },
    {
      objecion: "«¿Es original?» / «¿Ustedes sí son de fiar?»",
      que_significa: "Miedo a la estafa. Es LA objeción número uno en Colombia.",
      respuesta:
        v === "perfumeria"
          ? "«Totalmente válida la pregunta 🙌 Le cuento: [garantía de originalidad / código de verificación]. Además puede pagar contraentrega: usted revisa el producto y ahí sí paga. Le mando reseñas de clientes 👇»"
          : "«Súper válido. Somos fábrica en [CIUDAD], puede venir al taller cuando quiera. Le mando fotos de entregas de esta semana y el NIT de la empresa. Y si prefiere, abona el 30% y el resto contra entrega.»",
      no_hacer: "Ofenderse. Es la pregunta más razonable del mundo.",
    },
    {
      objecion: "«¿Cuánto vale el envío?»",
      que_significa: "El envío es el mayor asesino de conversión en Colombia.",
      respuesta: "«El envío se lo dejamos GRATIS a partir de $[MONTO] 🚚 Le llega en [X] días hábiles con [TRANSPORTADORA] y le paso la guía apenas salga.»",
      no_hacer: "Sorprender con el costo del envío al final. Súbalo al precio y ofrézcalo gratis.",
    },
    {
      objecion: "«¿Puedo pagar contraentrega?»",
      que_significa: "No confía todavía o no tiene medio de pago digital.",
      respuesta: "«Sí señor/señora, manejamos contraentrega en [CIUDADES] 🙌 Solo le pedimos confirmar el pedido por acá para que no se nos devuelva.»",
      no_hacer: "Aceptar contraentrega sin confirmar por WhatsApp: ahí es donde se dispara la tasa de devolución.",
    },
    {
      objecion: "«Después le escribo» (y no escribe)",
      que_significa: "Perdió el momento emocional de compra.",
      respuesta: "«De una, [NOMBRE] 🙌 Le dejo apartado el suyo hasta mañana a las 6 pm por si acaso, porque de esa referencia quedan [X]. Si no alcanza, no hay lío.»",
      no_hacer: "Presión falsa. Si dice que quedan 3, que de verdad queden 3.",
    },
  ];

  const especificas: Record<Vertical, Input[]> = {
    perfumeria: [
      { objecion: "«¿Y sí me va a durar?»", respuesta: "«Es EDP, concentración [X]%. Le dura entre 6 y 8 horas. El truco: aplíquelo en pulsos y en la ropa, no lo frote. Si no le convence, tenemos [política de cambio].»" },
      { objecion: "«¿Es igual al original?»", respuesta: "«Le soy honesto: es [original/inspirado]. Comparte la misma familia olfativa y la gente no nota la diferencia, pero prefiero decírselo claro para que compre tranquilo.»" },
      { objecion: "«¿Tiene muestras?»", respuesta: "«¡Claro! Tenemos decants de 5ml y 10ml desde $[PRECIO] para que lo pruebe antes de llevarse el frasco completo.»" },
    ],
    muebleria: [
      { objecion: "«¿Cuánto se demora la entrega?»", respuesta: "«[X] días hábiles si es de inventario, [Y] si es sobre medida. Le voy mandando fotos del avance para que esté tranquilo.»" },
      { objecion: "«¿Me cabe en el apartamento?»", respuesta: "«Le paso las medidas exactas y le hago un plano rápido con las medidas de su espacio. Mándeme el ancho de la pared y le confirmo antes de que compre.»" },
      { objecion: "«¿Y si no me gusta cuando llegue?»", respuesta: "«Tiene [X] días de garantía de satisfacción. Y le mandamos foto del mueble terminado antes de despacharlo para que dé el visto bueno.»" },
      { objecion: "«¿Lo instalan?»", respuesta: "«Sí, entrega e instalación incluidas en [CIUDADES]. Nuestro equipo se lo arma y se lleva el empaque.»" },
    ],
  };

  return {
    vertical: v,
    canal,
    metodo: "Escuchar → Validar («le entiendo») → Reencuadrar → Preguntar de vuelta. Nunca discuta con el cliente.",
    objeciones_universales: comunes,
    objeciones_del_negocio: especificas[v],
    tip_de_canal:
      canal === "comentarios"
        ? "En comentarios: responda público y corto, y lleve al privado («le escribí al interno 📩»). Los comentarios respondidos suben el alcance del anuncio."
        : canal === "llamada"
        ? "En llamada: hable primero de la necesidad, precio en el minuto 3, y cierre con una pregunta de opción («¿se lo despacho hoy o mañana?»)."
        : "En WhatsApp: audios cortos (menos de 30 segundos) generan mucha más confianza que texto en Colombia.",
  };
}

function buyerPersonaColombia(i: Input) {
  const v = i.vertical as Vertical;
  const ciudad = i.ciudad_principal ?? "Bogotá";

  const perfiles: Record<Vertical, Input[]> = {
    perfumeria: [
      {
        nombre: "Camila, 27 años — «la que quiere oler rico sin gastarse el sueldo»",
        perfil: "Vive en " + ciudad + ", estrato 2-3, trabaja en ventas o servicio al cliente. Ingresos 1.5 a 3 SMMLV.",
        dolores: ["Los perfumes de marca le valen medio sueldo", "Compró barato una vez y no le duró nada", "Le da miedo que le vendan falsificado"],
        disparadores: ["Que un video le muestre que dura todo el día", "Precio con puntos de mil visible", "Contraentrega o Nequi", "Que alguien le diga «te huele rico»"],
        objeciones: ["¿Es original?", "¿Sí me dura?", "¿Cuánto el envío?"],
        donde_encontrarla: "Reels de Instagram y TikTok entre 7 y 10 pm. Intereses de belleza, maquillaje y compras en línea.",
        mensaje_que_le_pega: "«Huele a millón, cuesta $89.000 y le dura 8 horas»",
      },
      {
        nombre: "Andrés, 34 años — «el que quiere que le pregunten qué se echó»",
        perfil: "Profesional, estrato 3-4, compra por identidad y estatus.",
        dolores: ["No sabe cuál le va", "No quiere oler igual a todo el mundo", "Los originales están carísimos"],
        disparadores: ["Comparativas con marcas conocidas", "Aromas árabes y de nicho", "Reseñas de hombres reales"],
        objeciones: ["¿Es muy dulce?", "¿Sirve para la oficina?", "¿Proyecta?"],
        donde_encontrarla: "Facebook e Instagram, grupos de fragancias, YouTube de reseñas.",
        mensaje_que_le_pega: "«Este es el que más me preguntan en la calle»",
      },
    ],
    muebleria: [
      {
        nombre: "Marcela, 38 años — «la que acaba de estrenar apartamento»",
        perfil: "Vive en " + ciudad + ", estrato 3-4, pareja con hijos, compró apartamento con subsidio o crédito.",
        dolores: ["El apartamento es pequeño y no le cabe nada", "No tiene la plata de contado", "Le da miedo comprar por internet un mueble caro"],
        disparadores: ["Ver el mueble en un espacio parecido al suyo", "Cuota mensual clara", "Que sea fábrica (sin intermediarios)", "Entrega e instalación incluidas"],
        objeciones: ["¿Me cabe?", "¿Cuánto la cuota?", "¿Y si no me gusta?", "¿Cuánto se demora?"],
        donde_encontrarla: "Facebook e Instagram. Intereses: decoración del hogar, mudanza reciente, propietarios de vivienda, Homecenter.",
        mensaje_que_le_pega: "«Su sala completa desde $89.000 al mes, sin cuota inicial y se la instalamos»",
      },
      {
        nombre: "Don Jorge, 52 años — «el que quiere renovar y le importa que dure»",
        perfil: "Estrato 4-5, casa propia, decide con la esposa, compra cada 5-8 años.",
        dolores: ["Ya le vendieron aglomerado que se dañó", "No quiere ir a 10 almacenes", "Quiere algo que dure"],
        disparadores: ["Madera real, garantía escrita", "Ver el proceso de fabricación", "Poder ir al taller o showroom"],
        objeciones: ["¿Qué material es?", "¿Qué garantía tiene?", "¿Puedo verlo antes?"],
        donde_encontrarla: "Facebook principalmente. Público 45-60, intereses de hogar y mejoras para el hogar.",
        mensaje_que_le_pega: "«Madera real, garantía de 5 años. Somos fábrica, venga y véalo.»",
      },
    ],
  };

  return {
    vertical: v,
    ciudad_base: ciudad,
    rango_precio: i.rango_precio_cop ?? "no informado",
    perfiles: perfiles[v],
    contexto_socioeconomico: {
      salario_minimo_referencia: "Verificar el SMMLV vigente del año en curso antes de calcular capacidad de pago.",
      estratos:
        "Estratos 1-3 concentran la mayoría de la población: sensibles al precio y a la cuota mensual. Estratos 4-6: sensibles a calidad, marca y servicio.",
      poder_de_compra: QUINCENAS.descripcion,
    },
    como_usarlo:
      "Cada perfil es una campaña con su propio creativo, no un ajuste de segmentación. Los intereses hoy importan menos que hablarle a la persona correcta en el video.",
  };
}

function auditoriaLandingCro(i: Input) {
  const v = i.vertical as Vertical;
  const items = [
    { item: "Precio visible sin hacer scroll", peso: 10, critico: true },
    { item: "Botón de WhatsApp flotante siempre visible", peso: 10, critico: true },
    { item: "Carga en menos de 3 segundos en 4G", peso: 9, critico: true },
    { item: "Métodos de pago colombianos visibles (Nequi, Daviplata, PSE, contraentrega)", peso: 9, critico: true },
    { item: "Reseñas o testimonios reales con foto", peso: 8, critico: false },
    { item: "Costo y tiempo de envío claros antes del checkout", peso: 8, critico: true },
    { item: "Fotos del producto en uso, no solo en fondo blanco", peso: 7, critico: false },
    { item: "Garantía y política de cambios visible", peso: 7, critico: false },
    { item: "Diseño móvil primero (más del 85% del tráfico es celular)", peso: 9, critico: true },
    { item: "Checkout en un solo paso, sin obligar a crear cuenta", peso: 8, critico: true },
    { item: "Escasez o urgencia real (unidades disponibles)", peso: 5, critico: false },
    { item: "Video del producto en la ficha", peso: 6, critico: false },
    { item: v === "muebleria" ? "Simulador de cuota / financiación visible" : "Descripción de notas olfativas y duración", peso: 8, critico: true },
    { item: v === "muebleria" ? "Medidas exactas y foto con referencia de escala" : "Tamaños disponibles y precio por ml", peso: 7, critico: true },
    { item: "Datos de contacto reales (NIT, dirección, teléfono)", peso: 6, critico: false },
    { item: "Política de tratamiento de datos (Habeas Data) enlazada", peso: 5, critico: true },
  ];

  const alertas: string[] = [];
  if (i.velocidad_segundos && i.velocidad_segundos > 3)
    alertas.push(`Carga en ${i.velocidad_segundos}s. Cada segundo por encima de 3 le cuesta cerca del 7% de conversión. Comprima imágenes y quite scripts que no usa.`);
  if (i.tasa_conversion_pct !== undefined && i.tasa_conversion_pct < 1)
    alertas.push("Conversión por debajo del 1%: antes de tocar la pauta, arregle la página. Está pagando tráfico para un hueco.");
  if (i.tiene_contraentrega === false)
    alertas.push("Sin contraentrega está dejando plata sobre la mesa: en tráfico frío colombiano puede subir la conversión entre 20% y 40%.");
  if (v === "muebleria" && i.tiene_financiacion === false)
    alertas.push("Sin financiación (Addi, Sistecrédito, cuotas) en mueblería pierde a la mayoría del mercado. La cuota mensual es el argumento de venta, no el precio.");

  return {
    vertical: v,
    tipo_pagina: i.tipo_pagina,
    checklist: items.map((it) => ({ ...it, marcar: "Sí / No" })),
    puntaje_maximo: items.reduce((a, b) => a + b.peso, 0),
    como_puntuar: "Sume el peso de cada ítem que SÍ cumple. Por debajo de 80 puntos la landing está frenando la pauta.",
    alertas_detectadas: alertas.length ? alertas : ["Sin alertas automáticas con los datos entregados."],
    orden_de_arreglo: [
      "1. Velocidad y móvil (afecta todo lo demás).",
      "2. Precio, envío y métodos de pago visibles.",
      "3. Prueba social.",
      "4. Fricción del checkout.",
      "5. Urgencia y escasez (solo al final, y que sea real).",
    ],
    prueba_del_celular:
      "Ábrala en su celular con datos móviles, en la calle, con una mano. Si no entiende qué vende y cuánto cuesta en 5 segundos, hay trabajo por hacer.",
  };
}

function planEmailSmsWhatsapp(i: Input) {
  const v = i.vertical as Vertical;
  const canal = i.canal ?? "whatsapp";

  const flujos: Record<string, Input> = {
    bienvenida: {
      objetivo: "Convertir al suscriptor nuevo en primera compra.",
      mensajes: [
        { cuando: "Inmediato", contenido: "Bienvenida + cupón de primera compra + qué esperar. Presente el negocio en 3 líneas." },
        { cuando: "Día 2", contenido: "Historia del negocio y por qué confiar (fábrica, garantía, clientes)." },
        { cuando: "Día 4", contenido: "Los 3 más vendidos con precio y link." },
        { cuando: "Día 7", contenido: "Recordatorio de que el cupón vence + testimonio." },
      ],
    },
    carrito_abandonado: {
      objetivo: "Recuperar entre el 10% y el 25% de los carritos.",
      mensajes: [
        { cuando: "1 hora", contenido: "«Se le quedó algo» + foto del producto + link directo al carrito." },
        { cuando: "24 horas", contenido: "Resolver la objeción probable: envío gratis, garantía, contraentrega." },
        { cuando: "72 horas", contenido: "Último llamado con beneficio o descuento real." },
      ],
      canal_recomendado: "WhatsApp gana por lejos en Colombia. Email queda de refuerzo.",
    },
    postventa: {
      objetivo: "Reseña, foto de cliente y base para la recompra.",
      mensajes: [
        { cuando: "Al despachar", contenido: "Guía + transportadora + fecha estimada." },
        { cuando: "Al entregar", contenido: "«¿Ya le llegó? ¿Cómo le pareció?»" },
        { cuando: "Día 3", contenido: "Pedir reseña o foto a cambio de un beneficio." },
        { cuando: "Día 10", contenido: "Tips de uso y cuidado del producto." },
      ],
    },
    recompra: {
      objetivo: "Volver a vender al que ya confía (el cliente más barato que existe).",
      mensajes:
        v === "perfumeria"
          ? [
              { cuando: "Día 60", contenido: "«¿Se le está acabando?» + descuento de cliente." },
              { cuando: "Día 90", contenido: "Novedades de la misma familia olfativa." },
              { cuando: "Día 120", contenido: "Combo con precio especial." },
            ]
          : [
              { cuando: "Mes 3", contenido: "Complemento del ambiente que compró." },
              { cuando: "Mes 6", contenido: "Novedades y temporada." },
              { cuando: "Mes 12", contenido: "Programa de referidos con beneficio para ambos." },
            ],
    },
    reactivacion: {
      objetivo: "Despertar a los dormidos antes de gastar en adquirir uno nuevo.",
      mensajes: [
        { cuando: "Día 1", contenido: "«¿Todo bien? Hace rato no lo vemos» + novedades." },
        { cuando: "Día 5", contenido: "Oferta fuerte, la más agresiva que maneje." },
        { cuando: "Día 12", contenido: "«¿Le seguimos escribiendo?» — limpiar la base también es rentable." },
      ],
    },
  };

  const seleccion = i.flujo === "todos" ? flujos : { [i.flujo]: flujos[i.flujo] };

  return {
    vertical: v,
    canal_principal: canal,
    flujos: seleccion,
    reglas_legales: [
      "Habeas Data: necesita autorización expresa antes de escribir. Guarde la evidencia (checkbox, fecha, IP).",
      "Incluya siempre la opción de darse de baja.",
      "WhatsApp: fuera de la ventana de 24 horas solo puede usar plantillas aprobadas por Meta.",
    ],
    prioridad_colombia:
      "1) WhatsApp (tasa de apertura arriba del 90%) 2) Estados de WhatsApp 3) Email 4) SMS. El email funciona, pero acá WhatsApp es el rey.",
  };
}

/* ─────────────────────── 5. DATOS LOCALES ────────────────────────────── */

function calendarioComercial(i: Input) {
  const v = i.vertical as Vertical | undefined;
  const lista = i.mes ? CALENDARIO_COMERCIAL.filter((f) => f.mes === i.mes) : CALENDARIO_COMERCIAL;

  return {
    fechas: lista.map((f) => ({
      nombre: f.nombre,
      cuando: f.cuando,
      empezar_a_calentar: f.calienta,
      accion: v ? f[v] : { perfumeria: f.perfumeria, muebleria: f.muebleria },
    })),
    quincenas: QUINCENAS,
    reglas_de_temporada: [
      "Calentar públicos 3 a 4 semanas antes de la fecha: llene remarketing con tráfico barato antes de que suba el CPM.",
      "En fechas pico el CPM sube entre 30% y 60%. Presupueste ese aumento desde antes.",
      "Los últimos 3 días antes de la fecha son los de mayor conversión: reserve ahí el 40% del presupuesto de la campaña.",
      "Comunique la fecha límite de envío para que el regalo llegue a tiempo. Eso solo ya sube conversión.",
      "Después de la fecha, no apague todo: la semana siguiente hay rezagados con alta intención.",
    ],
  };
}

function benchmarksColombia(i: Input) {
  const v = i.vertical as Vertical;
  const esc = i.escenario ?? "todos";
  const fuente = BENCHMARKS[v];
  const claves = esc === "todos" ? Object.keys(fuente) : [esc].filter((k) => fuente[k]);

  return {
    vertical: v,
    advertencia:
      "Son RANGOS DE MERCADO para planeación, no cifras oficiales de Meta. Los números de su cuenta mandan sobre cualquier benchmark.",
    datos: claves.map((k) => {
      const b = fuente[k];
      return {
        escenario: k,
        cpm: rango(b.cpmCop, cop),
        ctr: rango(b.ctrPct, (n) => pct(n)),
        cpc: rango(b.cpcCop, cop),
        conversion_landing: rango(b.cvrLandingPct, (n) => pct(n)),
        costo_por_conversacion_whatsapp: rango(b.cprWhatsappCop, cop),
        cpa_por_venta: rango(b.cpaVentaCop, cop),
        ticket_promedio: rango(b.ticketPromedioCop, cop),
        roas_sano: `${b.roasSano[0]}x – ${b.roasSano[1]}x`,
        nota: b.notas,
      };
    }),
    factores_que_mueven_estos_numeros: [
      "Temporada (noviembre y diciembre suben el CPM entre 30% y 60%).",
      "Ciudad (Bogotá es la más cara; Eje Cafetero y ciudades intermedias, las más baratas).",
      "Calidad del creativo (un buen Reel puede bajar el CPM a la mitad).",
      "Madurez de la cuenta y volumen de datos del Pixel.",
    ],
  };
}

function metodosPagoEnvios(i: Input) {
  const ticket = i.ticket_promedio_cop;
  let recomendacion = "Habilite Nequi, Daviplata, PSE, tarjeta y contraentrega.";
  if (ticket && ticket < 200_000) recomendacion = "Ticket bajo: priorice Nequi, Daviplata y contraentrega. La contraentrega puede subirle la conversión 20-40%.";
  else if (ticket && ticket < 1_000_000) recomendacion = "Ticket medio: Nequi/Daviplata + PSE + tarjeta a cuotas. Contraentrega solo con confirmación previa por WhatsApp.";
  else if (ticket) recomendacion = "Ticket alto: PSE, tarjeta a cuotas y financiación (Addi, Sistecrédito). Comunique la CUOTA MENSUAL, no el precio total.";

  return {
    metodos_de_pago: METODOS_PAGO,
    transportadoras: TRANSPORTADORAS,
    recomendacion_por_ticket: recomendacion,
    consejos_de_envio: [
      "«Envío gratis» convierte más que un descuento del mismo valor. Súbalo al precio.",
      "Prometa un día más de lo que se demora: cumplir antes genera reseñas, incumplir genera reclamos.",
      "Mande la guía por WhatsApp apenas despache. Baja las preguntas de «¿dónde va mi pedido?» en más del 70%.",
      "En mueblería, la entrega e instalación incluida es argumento de venta, no un costo escondido.",
      "Para contraentrega, confirme SIEMPRE por WhatsApp antes de despachar: es lo que separa 10% de 30% de devolución.",
    ],
  };
}

function normativaPublicidad(i: Input) {
  return {
    tema_consultado: i.tema ?? "general",
    normativa_colombiana: NORMATIVA,
    politicas_meta: [
      "Prohibido texto que interpele atributos personales del usuario («¿Estás gordo?», «¿Te sientes solo?»).",
      "Prohibido prometer resultados garantizados.",
      "Cosméticos y perfumería: no atribuir propiedades terapéuticas ni curativas.",
      "Fotos de antes/después de cuerpo humano restringidas en salud y belleza.",
      "Los descuentos y precios del anuncio deben coincidir exactamente con la web (Meta lo verifica y le rechaza el anuncio).",
      "Verifique el dominio y cumpla las políticas de comercio para poder usar catálogo.",
    ],
    buenas_practicas: [
      "Tener visibles: política de privacidad, términos, cambios y devoluciones, y datos de la empresa (NIT).",
      "Guardar evidencia de las autorizaciones de datos por si la SIC pregunta.",
      "Si dice «el más vendido» o «el mejor precio», tenga con qué sustentarlo.",
      "Los concursos y sorteos tienen reglas propias: publique bases claras.",
    ],
    descargo:
      "Esto es orientación práctica de marketing, no asesoría jurídica. Para casos concretos, consulte con un abogado.",
  };
}

function constructorUtm(i: Input) {
  const base = i.url_base.split("?")[0];
  const camp = (i.campana ?? "campana").toLowerCase().replace(/\s+/g, "-");
  const contenido = (i.contenido ?? "").toLowerCase().replace(/\s+/g, "-");

  const dinamico =
    "utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&utm_id={{campaign.id}}";
  const manual =
    `utm_source=facebook&utm_medium=paid_social&utm_campaign=${camp}` + (contenido ? `&utm_content=${contenido}` : "");

  return {
    url_completa_manual: `${base}?${manual}`,
    url_completa_dinamica: `${base}?${dinamico}`,
    solo_parametros_para_meta: i.usar_parametros_dinamicos === false ? manual : dinamico,
    donde_pegarlo:
      "En el anuncio, sección «Seguimiento» → «Parámetros de URL». Pegue SOLO los parámetros (sin la URL ni el signo de interrogación).",
    parametros_dinamicos_disponibles: [
      "{{campaign.name}} / {{campaign.id}}",
      "{{adset.name}} / {{adset.id}}",
      "{{ad.name}} / {{ad.id}}",
      "{{placement}}",
      "{{site_source_name}}",
    ],
    convencion_recomendada: {
      utm_source: "facebook o instagram",
      utm_medium: "paid_social siempre (para separar de lo orgánico)",
      utm_campaign: "misma nomenclatura de la campaña en Meta",
      utm_content: "el creativo, para saber cuál vendió",
      utm_term: "el conjunto/público",
    },
    tip: "Con parámetros dinámicos nunca se le olvida etiquetar y los nombres siempre coinciden con lo que ve en el Administrador de anuncios.",
  };
}

/* ────────────────────────────── despachador ───────────────────────────── */

const EJECUTORES: Record<string, (i: Input) => unknown> = {
  calculadora_roas: calculadoraRoas,
  simulador_presupuesto_meta: simuladorPresupuesto,
  proyeccion_embudo: proyeccionEmbudo,
  calculadora_precio_margen: calculadoraPrecioMargen,
  calculadora_ltv_cac: calculadoraLtvCac,
  plan_escalamiento: planEscalamiento,
  estructura_de_campana: estructuraDeCampana,
  constructor_publicos: constructorPublicos,
  plan_remarketing: planRemarketing,
  diagnostico_campana: diagnosticoCampana,
  checklist_pixel_capi: checklistPixelCapi,
  checklist_catalogo_advantage: checklistCatalogoAdvantage,
  plan_test_ab: planTestAb,
  framework_copy_ads: frameworkCopyAds,
  guion_video_ugc: guionVideoUgc,
  calendario_contenido: calendarioContenido,
  plantillas_whatsapp: plantillasWhatsapp,
  manejo_objeciones: manejoObjeciones,
  buyer_persona_colombia: buyerPersonaColombia,
  auditoria_landing_cro: auditoriaLandingCro,
  plan_email_sms_whatsapp: planEmailSmsWhatsapp,
  calendario_comercial_colombia: calendarioComercial,
  benchmarks_colombia: benchmarksColombia,
  metodos_pago_envios: metodosPagoEnvios,
  normativa_publicidad: normativaPublicidad,
  constructor_utm: constructorUtm,
};

export function ejecutarHerramienta(nombre: string, entrada: unknown) {
  const fn = EJECUTORES[nombre];
  if (!fn) return { error: `Herramienta desconocida: ${nombre}` };
  try {
    return fn((entrada ?? {}) as Input);
  } catch (e) {
    return {
      error: "No se pudo ejecutar la herramienta.",
      detalle: e instanceof Error ? e.message : String(e),
      sugerencia: "Pídale al usuario los datos que faltan y vuelva a intentar.",
    };
  }
}

export const NOMBRES_HERRAMIENTAS = Object.keys(EJECUTORES);
