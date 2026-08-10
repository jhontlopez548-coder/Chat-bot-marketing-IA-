import type Anthropic from "@anthropic-ai/sdk";

/**
 * Catálogo de herramientas del agente.
 * Cada herramienta se ejecuta en el servidor (lib/tools/executors.ts) y
 * devuelve datos estructurados que el modelo convierte en una respuesta
 * accionable en español colombiano.
 */

const vertical = {
  type: "string" as const,
  enum: ["perfumeria", "muebleria"],
  description: "Negocio sobre el que se trabaja.",
};

export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  // ─────────────────────────── FINANZAS Y MÉTRICAS ───────────────────────────
  {
    name: "calculadora_roas",
    description:
      "Calcula ROAS real, ROAS de equilibrio (break-even), margen de contribución, utilidad y CPA máximo permitido en pesos colombianos. Úsala SIEMPRE que el usuario mencione inversión, ventas, si está ganando o perdiendo plata, o pregunte cuánto puede pagar por una venta.",
    input_schema: {
      type: "object",
      properties: {
        inversion_publicitaria_cop: { type: "number", description: "Plata invertida en Meta Ads, en COP." },
        ingresos_cop: { type: "number", description: "Ventas atribuidas generadas, en COP." },
        costo_producto_pct: {
          type: "number",
          description: "Costo del producto como % del precio de venta (ej: 35 para 35%).",
        },
        costo_envio_cop: { type: "number", description: "Costo de envío promedio por pedido, en COP. Opcional." },
        comision_pasarela_pct: { type: "number", description: "Comisión de pasarela/pago en %, ej: 3.5. Opcional." },
        numero_pedidos: { type: "number", description: "Cantidad de pedidos generados. Opcional." },
        costos_fijos_cop: { type: "number", description: "Costos fijos del periodo (nómina, arriendo). Opcional." },
      },
      required: ["inversion_publicitaria_cop", "ingresos_cop", "costo_producto_pct"],
      additionalProperties: false,
    },
  },
  {
    name: "simulador_presupuesto_meta",
    description:
      "Proyecta cuántas impresiones, clics, conversaciones y ventas puede dar un presupuesto en Meta Ads en Colombia, y cuánto presupuesto se necesita para una meta de ventas. Usa benchmarks locales en COP.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        presupuesto_diario_cop: { type: "number", description: "Presupuesto diario en COP. Opcional si se da meta_ventas_mes." },
        meta_ventas_mes: { type: "number", description: "Ventas mensuales objetivo. Opcional si se da presupuesto." },
        ticket_promedio_cop: { type: "number", description: "Ticket promedio en COP." },
        escenario: {
          type: "string",
          enum: ["trafico_frio_reels", "remarketing", "advantage_shopping", "catalogo_mensajes"],
          description: "Tipo de campaña a simular.",
        },
        dias: { type: "number", description: "Días de la simulación. Por defecto 30." },
      },
      required: ["vertical", "ticket_promedio_cop", "escenario"],
      additionalProperties: false,
    },
  },
  {
    name: "proyeccion_embudo",
    description:
      "Arma el embudo completo (impresiones → clics → visitas → conversaciones/carritos → ventas) con tasas personalizadas y muestra dónde se está fugando la plata.",
    input_schema: {
      type: "object",
      properties: {
        impresiones: { type: "number" },
        ctr_pct: { type: "number", description: "CTR en %, ej: 1.8" },
        tasa_carga_landing_pct: { type: "number", description: "% de clics que sí cargan la landing. Por defecto 85." },
        tasa_contacto_pct: { type: "number", description: "% de visitas que escriben/agregan al carrito." },
        tasa_cierre_pct: { type: "number", description: "% de contactos que compran." },
        ticket_promedio_cop: { type: "number" },
        inversion_cop: { type: "number" },
      },
      required: ["impresiones", "ctr_pct", "tasa_contacto_pct", "tasa_cierre_pct", "ticket_promedio_cop", "inversion_cop"],
      additionalProperties: false,
    },
  },
  {
    name: "calculadora_precio_margen",
    description:
      "Calcula precio de venta sugerido, margen, punto de equilibrio y CPA máximo, incluyendo IVA 19%, comisión de pasarela, envío y costo de devoluciones (clave en contraentrega colombiana).",
    input_schema: {
      type: "object",
      properties: {
        costo_unitario_cop: { type: "number" },
        margen_objetivo_pct: { type: "number", description: "Margen bruto objetivo en %, ej: 60." },
        precio_actual_cop: { type: "number", description: "Precio actual si ya lo tiene. Opcional." },
        incluye_iva: { type: "boolean", description: "Si el precio de venta ya incluye IVA del 19%." },
        costo_envio_cop: { type: "number" },
        comision_pasarela_pct: { type: "number" },
        tasa_devolucion_pct: { type: "number", description: "% de pedidos devueltos (contraentrega suele ser 15-30%)." },
      },
      required: ["costo_unitario_cop", "margen_objetivo_pct"],
      additionalProperties: false,
    },
  },
  {
    name: "calculadora_ltv_cac",
    description:
      "Calcula LTV, CAC, relación LTV:CAC, meses de recuperación de la inversión y cuánto se puede pagar por un cliente nuevo.",
    input_schema: {
      type: "object",
      properties: {
        ticket_promedio_cop: { type: "number" },
        compras_por_ano: { type: "number", description: "Frecuencia de recompra al año." },
        anos_de_vida_cliente: { type: "number", description: "Años que dura el cliente. Perfumería 2-4, mueblería 4-8." },
        margen_bruto_pct: { type: "number" },
        inversion_marketing_cop: { type: "number" },
        clientes_nuevos: { type: "number" },
      },
      required: ["ticket_promedio_cop", "compras_por_ano", "anos_de_vida_cliente", "margen_bruto_pct"],
      additionalProperties: false,
    },
  },
  {
    name: "plan_escalamiento",
    description:
      "Genera el plan de escalamiento de presupuesto paso a paso (vertical y horizontal) con reglas, límites y semáforo de métricas para no romper el aprendizaje del algoritmo.",
    input_schema: {
      type: "object",
      properties: {
        presupuesto_actual_diario_cop: { type: "number" },
        presupuesto_meta_diario_cop: { type: "number" },
        cpa_actual_cop: { type: "number" },
        cpa_maximo_cop: { type: "number" },
        vertical,
      },
      required: ["presupuesto_actual_diario_cop", "presupuesto_meta_diario_cop", "vertical"],
      additionalProperties: false,
    },
  },

  // ─────────────────────────── META ADS: ESTRUCTURA ───────────────────────────
  {
    name: "estructura_de_campana",
    description:
      "Devuelve la estructura completa de cuenta de Meta Ads: campañas, conjuntos, presupuestos, objetivos, ubicaciones y nomenclatura, adaptada al presupuesto y al negocio. Úsala cuando pidan 'cómo armo la campaña' o 'estructura de cuenta'.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        presupuesto_mensual_cop: { type: "number" },
        objetivo: {
          type: "string",
          enum: ["ventas_web", "mensajes_whatsapp", "leads_formulario", "trafico_tienda_fisica", "catalogo"],
        },
        nivel_cuenta: {
          type: "string",
          enum: ["nueva", "con_historial", "escalando"],
          description: "Madurez de la cuenta publicitaria.",
        },
      },
      required: ["vertical", "presupuesto_mensual_cop", "objetivo"],
      additionalProperties: false,
    },
  },
  {
    name: "constructor_publicos",
    description:
      "Genera públicos de Meta Ads para Colombia: intereses reales, comportamientos, públicos personalizados, similares (lookalike), exclusiones y ubicaciones geográficas por ciudad.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        etapa: { type: "string", enum: ["frio", "tibio", "caliente", "recompra"] },
        ciudades: { type: "array", items: { type: "string" }, description: "Ciudades objetivo. Opcional." },
        genero: { type: "string", enum: ["mujeres", "hombres", "todos"] },
        rango_edad: { type: "string", description: "Ej: 25-45. Opcional." },
      },
      required: ["vertical", "etapa"],
      additionalProperties: false,
    },
  },
  {
    name: "plan_remarketing",
    description:
      "Arma la escalera completa de remarketing con ventanas de tiempo, mensajes, ofertas y presupuesto sugerido por escalón.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        presupuesto_remarketing_diario_cop: { type: "number" },
        tiene_catalogo: { type: "boolean", description: "Si tiene catálogo de productos cargado en Meta." },
      },
      required: ["vertical"],
      additionalProperties: false,
    },
  },
  {
    name: "diagnostico_campana",
    description:
      "Diagnostica por qué una campaña no está funcionando a partir de sus métricas y devuelve causas probables ordenadas por probabilidad, con acciones concretas. Úsala cuando digan 'no me está funcionando', 'subió el CPA', 'no vendo', 'gasta y no convierte'.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        cpm_cop: { type: "number" },
        ctr_pct: { type: "number" },
        cpc_cop: { type: "number" },
        frecuencia: { type: "number", description: "Frecuencia promedio del conjunto." },
        cpa_cop: { type: "number" },
        conversiones_semana: { type: "number" },
        dias_activa: { type: "number" },
        presupuesto_diario_cop: { type: "number" },
        tasa_conversion_landing_pct: { type: "number" },
        sintoma: { type: "string", description: "Lo que el usuario describe con sus palabras." },
      },
      required: ["vertical"],
      additionalProperties: false,
    },
  },
  {
    name: "checklist_pixel_capi",
    description:
      "Devuelve el checklist técnico de medición: Pixel de Meta, API de Conversiones (CAPI), eventos, deduplicación, priorización de eventos web y verificación de dominio.",
    input_schema: {
      type: "object",
      properties: {
        plataforma: {
          type: "string",
          enum: ["shopify", "woocommerce", "vtex", "tiendanube", "web_propia", "solo_whatsapp"],
        },
        vertical,
      },
      required: ["plataforma"],
      additionalProperties: false,
    },
  },
  {
    name: "checklist_catalogo_advantage",
    description:
      "Checklist de catálogo de productos y campañas Advantage+ (ASC / DPA): feed, campos obligatorios, conjuntos de productos, reglas y errores típicos en Colombia.",
    input_schema: {
      type: "object",
      properties: { vertical },
      required: ["vertical"],
      additionalProperties: false,
    },
  },
  {
    name: "plan_test_ab",
    description:
      "Diseña una prueba A/B para Meta Ads: qué variar, presupuesto mínimo, duración, tamaño de muestra aproximado y criterio de decisión.",
    input_schema: {
      type: "object",
      properties: {
        variable: {
          type: "string",
          enum: ["creativo", "copy", "publico", "oferta", "landing", "ubicacion", "objetivo"],
        },
        cpa_esperado_cop: { type: "number" },
        tasa_conversion_actual_pct: { type: "number" },
        mejora_minima_detectable_pct: { type: "number", description: "Ej: 20 para detectar una mejora del 20%." },
        presupuesto_diario_cop: { type: "number" },
      },
      required: ["variable", "cpa_esperado_cop"],
      additionalProperties: false,
    },
  },

  // ─────────────────────────── CREATIVOS Y CONTENIDO ───────────────────────────
  {
    name: "framework_copy_ads",
    description:
      "Devuelve los ángulos de venta y frameworks de copy (AIDA, PAS, 4U, etc.) con ejemplos ya aterrizados al negocio y al dialecto colombiano, más ganchos de primeros 3 segundos y llamados a la acción.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        producto: { type: "string", description: "Producto o línea específica." },
        etapa_embudo: { type: "string", enum: ["frio", "tibio", "caliente"] },
        oferta: { type: "string", description: "Oferta o promoción vigente. Opcional." },
        tono: { type: "string", enum: ["cercano_usted", "juvenil_tu", "paisa_vos"], description: "Tratamiento a usar." },
      },
      required: ["vertical", "etapa_embudo"],
      additionalProperties: false,
    },
  },
  {
    name: "guion_video_ugc",
    description:
      "Genera la estructura de guion para video UGC / Reel de venta: gancho, desarrollo, prueba, oferta y CTA, con tiempos por segundo, indicaciones de cámara y texto en pantalla.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        producto: { type: "string" },
        duracion_segundos: { type: "number", description: "15, 20, 30, 45 o 60." },
        formato: {
          type: "string",
          enum: ["testimonio", "antes_despues", "unboxing", "problema_solucion", "showroom_tour", "comparativa", "trend"],
        },
        oferta: { type: "string" },
      },
      required: ["vertical", "formato"],
      additionalProperties: false,
    },
  },
  {
    name: "calendario_contenido",
    description:
      "Arma un calendario de contenido orgánico + pauta por semana, con formatos, plataformas y objetivo de cada pieza.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        semanas: { type: "number", description: "Cantidad de semanas a planear. Por defecto 4." },
        piezas_por_semana: { type: "number", description: "Por defecto 5." },
        plataformas: {
          type: "array",
          items: { type: "string", enum: ["instagram", "facebook", "tiktok", "whatsapp_estados", "youtube_shorts"] },
        },
        mes: { type: "number", description: "Mes del año (1-12) para cruzar con el calendario comercial." },
      },
      required: ["vertical"],
      additionalProperties: false,
    },
  },

  // ─────────────────────────── VENTAS Y CIERRE ───────────────────────────
  {
    name: "plantillas_whatsapp",
    description:
      "Genera el flujo de venta por WhatsApp: saludo, calificación, presentación de precio, manejo de silencio, cierre y seguimiento, con plantillas listas en español colombiano.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        momento: {
          type: "string",
          enum: ["primer_contacto", "cotizacion", "seguimiento", "carrito_abandonado", "postventa", "recompra"],
        },
        producto: { type: "string" },
      },
      required: ["vertical", "momento"],
      additionalProperties: false,
    },
  },
  {
    name: "manejo_objeciones",
    description:
      "Devuelve las objeciones más frecuentes del cliente colombiano y el guion de respuesta para cada una (precio, desconfianza, envío, garantía, 'lo voy a pensar', 'está muy caro').",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        canal: { type: "string", enum: ["whatsapp", "comentarios", "llamada", "tienda_fisica"] },
      },
      required: ["vertical"],
      additionalProperties: false,
    },
  },
  {
    name: "buyer_persona_colombia",
    description:
      "Construye el perfil del cliente ideal colombiano: demografía, estrato, ciudad, dolores, disparadores de compra, objeciones y dónde encontrarlo en Meta.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        rango_precio_cop: { type: "string", description: "Ej: 80.000 - 250.000" },
        ciudad_principal: { type: "string" },
      },
      required: ["vertical"],
      additionalProperties: false,
    },
  },
  {
    name: "auditoria_landing_cro",
    description:
      "Auditoría de conversión (CRO) para la landing, ficha de producto o checkout, con puntaje y lista priorizada de arreglos, adaptada a hábitos de compra colombianos.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        tipo_pagina: { type: "string", enum: ["landing", "ficha_producto", "checkout", "home", "catalogo"] },
        tiene_contraentrega: { type: "boolean" },
        tiene_financiacion: { type: "boolean" },
        velocidad_segundos: { type: "number", description: "Tiempo de carga en móvil, en segundos." },
        tasa_conversion_pct: { type: "number" },
      },
      required: ["vertical", "tipo_pagina"],
      additionalProperties: false,
    },
  },
  {
    name: "plan_email_sms_whatsapp",
    description:
      "Diseña los flujos automatizados de retención: bienvenida, carrito abandonado, postventa, recompra y reactivación, con tiempos y mensajes.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        flujo: {
          type: "string",
          enum: ["bienvenida", "carrito_abandonado", "postventa", "recompra", "reactivacion", "todos"],
        },
        canal: { type: "string", enum: ["email", "whatsapp", "sms", "multicanal"] },
      },
      required: ["vertical", "flujo"],
      additionalProperties: false,
    },
  },

  // ─────────────────────────── DATOS LOCALES ───────────────────────────
  {
    name: "calendario_comercial_colombia",
    description:
      "Devuelve las fechas comerciales de Colombia (Día de la Madre, Amor y Amistad, prima, Black Friday, día sin IVA, quincenas) con cuándo empezar a calentar y qué hacer en cada negocio.",
    input_schema: {
      type: "object",
      properties: {
        mes: { type: "number", description: "Mes (1-12). Si se omite devuelve el año completo." },
        vertical,
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "benchmarks_colombia",
    description:
      "Entrega rangos de referencia del mercado colombiano en COP: CPM, CTR, CPC, costo por conversación, CPA, ticket y ROAS sano por vertical y tipo de campaña.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        escenario: {
          type: "string",
          enum: ["trafico_frio_reels", "remarketing", "advantage_shopping", "catalogo_mensajes", "todos"],
        },
      },
      required: ["vertical"],
      additionalProperties: false,
    },
  },
  {
    name: "metodos_pago_envios",
    description:
      "Devuelve los métodos de pago y transportadoras de Colombia con recomendaciones de cuál usar según ticket, ciudad y vertical.",
    input_schema: {
      type: "object",
      properties: {
        vertical,
        ticket_promedio_cop: { type: "number" },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "normativa_publicidad",
    description:
      "Recuerda las reglas legales colombianas y las políticas de Meta que aplican a la pauta: IVA, Habeas Data, SIC, derecho de retracto, INVIMA y prohibiciones de Meta.",
    input_schema: {
      type: "object",
      properties: {
        tema: { type: "string", description: "Tema específico a consultar. Opcional." },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "constructor_utm",
    description:
      "Genera URLs con parámetros UTM y los parámetros dinámicos de Meta Ads listos para pegar en el campo de seguimiento.",
    input_schema: {
      type: "object",
      properties: {
        url_base: { type: "string", description: "URL de destino, ej: https://mitienda.com/perfume-x" },
        campana: { type: "string" },
        contenido: { type: "string", description: "Identificador del creativo. Opcional." },
        usar_parametros_dinamicos: {
          type: "boolean",
          description: "Si true, usa los parámetros dinámicos de Meta ({{campaign.name}}, etc.).",
        },
      },
      required: ["url_base"],
      additionalProperties: false,
    },
  },
];
