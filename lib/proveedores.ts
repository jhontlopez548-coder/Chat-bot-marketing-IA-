/**
 * Motores de IA soportados.
 * La aplicación puede funcionar con la llave que el usuario pega en el navegador
 * (no se guarda en el servidor) o con variables de entorno si están configuradas.
 */

export type ProveedorId = "anthropic" | "gemini" | "groq";

export interface Proveedor {
  id: ProveedorId;
  nombre: string;
  etiqueta: string;
  gratis: boolean;
  descripcion: string;
  urlLlave: string;
  prefijoLlave: string;
  modeloPorDefecto: string;
  modelos: { id: string; nombre: string; nota?: string }[];
  variableEntorno: string;
}

export const PROVEEDORES: Record<ProveedorId, Proveedor> = {
  gemini: {
    id: "gemini",
    nombre: "Google Gemini",
    etiqueta: "Gratis",
    gratis: true,
    descripcion:
      "Capa gratuita en Google AI Studio: no le piden tarjeta. Tiene un tope de consultas al día que para un negocio sobra.",
    urlLlave: "https://aistudio.google.com/apikey",
    prefijoLlave: "AIza",
    modeloPorDefecto: "gemini-2.5-flash",
    modelos: [
      { id: "gemini-2.5-flash", nombre: "Gemini 2.5 Flash", nota: "Rápido y con buena cuota gratis. El recomendado." },
      { id: "gemini-2.5-pro", nombre: "Gemini 2.5 Pro", nota: "Más inteligente, cuota gratis más apretada." },
      { id: "gemini-2.0-flash", nombre: "Gemini 2.0 Flash", nota: "Alternativa si la de arriba le falla." },
    ],
    variableEntorno: "GOOGLE_API_KEY",
  },
  groq: {
    id: "groq",
    nombre: "Groq",
    etiqueta: "Gratis",
    gratis: true,
    descripcion:
      "Capa gratuita sin tarjeta. Es el más rápido de los tres: responde casi al instante.",
    urlLlave: "https://console.groq.com/keys",
    prefijoLlave: "gsk_",
    modeloPorDefecto: "llama-3.3-70b-versatile",
    modelos: [
      { id: "llama-3.3-70b-versatile", nombre: "Llama 3.3 70B", nota: "El más equilibrado de Groq." },
      { id: "openai/gpt-oss-120b", nombre: "GPT-OSS 120B", nota: "Más capaz para razonar." },
      { id: "moonshotai/kimi-k2-instruct", nombre: "Kimi K2", nota: "Bueno usando herramientas." },
    ],
    variableEntorno: "GROQ_API_KEY",
  },
  anthropic: {
    id: "anthropic",
    nombre: "Anthropic (Claude)",
    etiqueta: "De pago",
    gratis: false,
    descripcion:
      "El de mejor calidad para estrategia y textos de venta, pero toca cargar saldo con tarjeta.",
    urlLlave: "https://console.anthropic.com/settings/keys",
    prefijoLlave: "sk-ant-",
    modeloPorDefecto: "claude-opus-5",
    modelos: [
      { id: "claude-opus-5", nombre: "Claude Opus 5", nota: "El más capaz." },
      { id: "claude-sonnet-5", nombre: "Claude Sonnet 5", nota: "Más económico y muy rápido." },
      { id: "claude-haiku-4-5", nombre: "Claude Haiku 4.5", nota: "El más barato." },
    ],
    variableEntorno: "ANTHROPIC_API_KEY",
  },
};

export const ORDEN_PROVEEDORES: ProveedorId[] = ["gemini", "groq", "anthropic"];

export function esProveedorValido(id: string): id is ProveedorId {
  return id === "anthropic" || id === "gemini" || id === "groq";
}
