import { PROVEEDORES, esProveedorValido, type ProveedorId } from "@/lib/proveedores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Consulta al proveedor qué modelos tiene disponibles ESA llave.
 * Así la lista nunca se queda obsoleta cuando el proveedor retira un modelo.
 */

interface ModeloDisponible {
  id: string;
  nombre: string;
}

function limpiarNombre(id: string) {
  return id
    .replace(/^models\//, "")
    .split(/[-/]/)
    .map((p) => (/^\d/.test(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

/** Modelos que no sirven para conversar (audio, imagen, embeddings, moderación…). */
const EXCLUIR = /(embed|image|imagen|tts|audio|live|veo|whisper|guard|moderat|rerank|vision-only)/i;

async function listarGemini(apiKey: string): Promise<ModeloDisponible[]> {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
    headers: { "x-goog-api-key": apiKey },
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return (j.models ?? [])
    .filter(
      (m: any) =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes("generateContent") &&
        !EXCLUIR.test(m.name ?? ""),
    )
    .map((m: any) => ({
      id: String(m.name).replace(/^models\//, ""),
      nombre: m.displayName || limpiarNombre(m.name),
    }));
}

async function listarGroq(apiKey: string): Promise<ModeloDisponible[]> {
  const r = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return (j.data ?? [])
    .filter((m: any) => !EXCLUIR.test(m.id ?? ""))
    .map((m: any) => ({ id: m.id, nombre: limpiarNombre(m.id) }));
}

async function listarAnthropic(apiKey: string): Promise<ModeloDisponible[]> {
  const r = await fetch("https://api.anthropic.com/v1/models?limit=100", {
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return (j.data ?? []).map((m: any) => ({ id: m.id, nombre: m.display_name || limpiarNombre(m.id) }));
}

export async function POST(req: Request) {
  let cuerpo: { proveedor?: string; apiKey?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const id: ProveedorId = esProveedorValido(cuerpo.proveedor ?? "")
    ? (cuerpo.proveedor as ProveedorId)
    : "gemini";
  const proveedor = PROVEEDORES[id];
  const apiKey = (cuerpo.apiKey || process.env[proveedor.variableEntorno] || "").trim();

  if (!apiKey) {
    return Response.json({ modelos: [], error: "Falta la llave." }, { status: 200 });
  }

  try {
    const modelos =
      id === "gemini"
        ? await listarGemini(apiKey)
        : id === "groq"
        ? await listarGroq(apiKey)
        : await listarAnthropic(apiKey);

    // Los preferidos del catálogo van de primeros si la llave los tiene.
    const preferidos = proveedor.modelos.map((m) => m.id);
    modelos.sort((a, b) => {
      const ia = preferidos.indexOf(a.id);
      const ib = preferidos.indexOf(b.id);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.id.localeCompare(b.id);
    });

    return Response.json({ modelos });
  } catch (e) {
    const detalle = (e instanceof Error ? e.message : String(e)).toLowerCase();
    const esLlave =
      detalle.includes("api key") ||
      detalle.includes("api_key") ||
      detalle.includes("x-api-key") ||
      detalle.includes("authentication") ||
      detalle.includes("unauthorized") ||
      detalle.includes("permission_denied") ||
      detalle.includes("invalid_api_key");
    return Response.json(
      {
        modelos: [],
        error: esLlave
          ? `La llave de ${proveedor.nombre} no es válida. Revísela en ${proveedor.urlLlave}.`
          : "No se pudo consultar la lista de modelos. Puede elegir uno de la lista sugerida.",
      },
      { status: 200 },
    );
  }
}
