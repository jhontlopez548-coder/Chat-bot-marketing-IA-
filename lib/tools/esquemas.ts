import { TOOL_DEFINITIONS } from "./definitions";

/** Forma mínima de un esquema JSON que usamos en las herramientas. */
export interface EsquemaJson {
  type?: string;
  description?: string;
  enum?: string[];
  items?: EsquemaJson;
  properties?: Record<string, EsquemaJson>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface HerramientaPlana {
  nombre: string;
  descripcion: string;
  esquema: EsquemaJson;
}

/** Las definiciones en un formato neutro, independiente del proveedor. */
export const HERRAMIENTAS_PLANAS: HerramientaPlana[] = TOOL_DEFINITIONS.map((t) => ({
  nombre: t.name,
  descripcion: t.description ?? "",
  esquema: t.input_schema as unknown as EsquemaJson,
}));

/* ─────────────────────────── OpenAI / Groq ─────────────────────────── */

export function herramientasOpenAI() {
  return HERRAMIENTAS_PLANAS.map((h) => ({
    type: "function" as const,
    function: {
      name: h.nombre,
      description: h.descripcion,
      parameters: h.esquema,
    },
  }));
}

/* ───────────────────────────── Gemini ──────────────────────────────── */

/**
 * Gemini usa un subconjunto de OpenAPI: los tipos van en MAYÚSCULAS y no
 * acepta `additionalProperties`. Esta función traduce el esquema.
 */
function aEsquemaGemini(e: EsquemaJson): Record<string, unknown> {
  const salida: Record<string, unknown> = {};

  if (e.type) salida.type = e.type.toUpperCase();
  if (e.description) salida.description = e.description;
  if (e.enum) salida.enum = e.enum;
  if (e.items) salida.items = aEsquemaGemini(e.items);

  if (e.properties) {
    const props: Record<string, unknown> = {};
    for (const [clave, valor] of Object.entries(e.properties)) {
      props[clave] = aEsquemaGemini(valor);
    }
    salida.properties = props;
  }

  if (e.required && e.required.length > 0) salida.required = e.required;

  return salida;
}

export function herramientasGemini() {
  return [
    {
      functionDeclarations: HERRAMIENTAS_PLANAS.map((h) => {
        const declaracion: Record<string, unknown> = {
          name: h.nombre,
          description: h.descripcion,
        };
        // Gemini rechaza `parameters` sin propiedades: en ese caso se omite.
        if (h.esquema.properties && Object.keys(h.esquema.properties).length > 0) {
          declaracion.parameters = aEsquemaGemini(h.esquema);
        }
        return declaracion;
      }),
    },
  ];
}
