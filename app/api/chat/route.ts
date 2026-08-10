import Anthropic from "@anthropic-ai/sdk";
import { TOOL_DEFINITIONS } from "@/lib/tools/definitions";
import { ejecutarHerramienta } from "@/lib/tools/executors";
import { herramientasGemini, herramientasOpenAI } from "@/lib/tools/esquemas";
import { construirSystemPrompt, type ContextoNegocio } from "@/lib/system-prompt";
import { PROVEEDORES, esProveedorValido, type ProveedorId } from "@/lib/proveedores";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_VUELTAS = 10;

interface MensajeCliente {
  rol: "usuario" | "asistente";
  texto: string;
}

interface CuerpoPeticion {
  mensajes: MensajeCliente[];
  contexto?: ContextoNegocio;
  proveedor?: string;
  apiKey?: string;
  modelo?: string;
}

type Emisor = (evento: Record<string, unknown>) => void;

/* ───────────────────────── utilidades comunes ───────────────────────── */

function correrHerramienta(nombre: string, entrada: unknown, enviar: Emisor) {
  enviar({ t: "herramienta_inicio", nombre });
  const resultado = ejecutarHerramienta(nombre, entrada);
  enviar({ t: "herramienta_fin", nombre, entrada, resultado });
  return resultado;
}

/** Lee un stream de Server-Sent Events y entrega cada `data:` ya parseado. */
async function* leerSse(respuesta: Response): AsyncGenerator<string> {
  const reader = respuesta.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lineas = buffer.split("\n");
    buffer = lineas.pop() ?? "";

    for (const linea of lineas) {
      const limpia = linea.trim();
      if (!limpia.startsWith("data:")) continue;
      const dato = limpia.slice(5).trim();
      if (!dato || dato === "[DONE]") continue;
      yield dato;
    }
  }
}

async function textoDeError(r: Response): Promise<string> {
  const crudo = await r.text().catch(() => "");
  try {
    const j = JSON.parse(crudo);
    return j?.error?.message ?? j?.error?.[0]?.error?.message ?? j?.message ?? crudo;
  } catch {
    return crudo || `HTTP ${r.status}`;
  }
}

/* ──────────────────────────── ANTHROPIC ─────────────────────────────── */

async function agenteAnthropic(
  apiKey: string,
  modelo: string,
  system: string,
  historial: MensajeCliente[],
  enviar: Emisor,
) {
  const client = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = historial.map((m) => ({
    role: m.rol === "usuario" ? ("user" as const) : ("assistant" as const),
    content: m.texto,
  }));

  const herramientas: unknown[] = [...TOOL_DEFINITIONS];
  if (process.env.BUSQUEDA_WEB !== "false") {
    herramientas.push({
      type: "web_search_20260209",
      name: "web_search",
      max_uses: 6,
      user_location: { type: "approximate", country: "CO", timezone: "America/Bogota" },
    });
  }

  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
    const params = {
      model: modelo,
      max_tokens: 32000,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
      tools: herramientas,
      thinking: { type: "adaptive", display: "summarized" },
      output_config: { effort: process.env.ANTHROPIC_EFFORT || "high" },
    } as unknown as Anthropic.MessageStreamParams;

    const stream = client.messages.stream(params);

    for await (const evento of stream) {
      if (evento.type === "content_block_start") {
        const bloque = evento.content_block as { type: string; name?: string };
        if (bloque.type === "server_tool_use") enviar({ t: "busqueda_inicio" });
        else if (bloque.type === "web_search_tool_result") enviar({ t: "busqueda_fin" });
      } else if (evento.type === "content_block_delta") {
        const delta = evento.delta as { type: string; text?: string; thinking?: string };
        if (delta.type === "text_delta" && delta.text) enviar({ t: "texto", v: delta.text });
        else if (delta.type === "thinking_delta" && delta.thinking)
          enviar({ t: "pensando", v: delta.thinking });
      }
    }

    const mensaje = await stream.finalMessage();
    messages.push({ role: "assistant", content: mensaje.content });

    if (mensaje.stop_reason === "pause_turn") continue;

    const usos = mensaje.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (usos.length === 0) return;

    const resultados: Anthropic.ToolResultBlockParam[] = usos.map((u) => ({
      type: "tool_result",
      tool_use_id: u.id,
      content: JSON.stringify(correrHerramienta(u.name, u.input, enviar)),
    }));

    messages.push({ role: "user", content: resultados });
  }
}

/* ─────────────────── COMPATIBLES CON OPENAI (Groq) ──────────────────── */

interface LlamadaHerramientaOA {
  id: string;
  nombre: string;
  argumentos: string;
}

async function agenteOpenAICompatible(
  url: string,
  apiKey: string,
  modelo: string,
  system: string,
  historial: MensajeCliente[],
  enviar: Emisor,
) {
  const messages: Record<string, unknown>[] = [
    { role: "system", content: system },
    ...historial.map((m) => ({
      role: m.rol === "usuario" ? "user" : "assistant",
      content: m.texto,
    })),
  ];

  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelo,
        messages,
        tools: herramientasOpenAI(),
        tool_choice: "auto",
        stream: true,
        // Groq usa el nombre nuevo de OpenAI; `max_tokens` quedó obsoleto.
        max_completion_tokens: 8192,
      }),
    });

    if (!respuesta.ok || !respuesta.body) {
      throw new Error(await textoDeError(respuesta));
    }

    let contenido = "";
    const llamadas = new Map<number, LlamadaHerramientaOA>();

    for await (const dato of leerSse(respuesta)) {
      let trozo: any;
      try {
        trozo = JSON.parse(dato);
      } catch {
        continue;
      }

      const delta = trozo?.choices?.[0]?.delta;
      if (!delta) continue;

      if (typeof delta.content === "string" && delta.content) {
        contenido += delta.content;
        enviar({ t: "texto", v: delta.content });
      }

      if (Array.isArray(delta.tool_calls)) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          const actual = llamadas.get(idx) ?? { id: "", nombre: "", argumentos: "" };
          if (tc.id) actual.id = tc.id;
          if (tc.function?.name) actual.nombre += tc.function.name;
          if (tc.function?.arguments) actual.argumentos += tc.function.arguments;
          llamadas.set(idx, actual);
        }
      }
    }

    if (llamadas.size === 0) return;

    const lista = [...llamadas.values()].filter((l) => l.nombre);

    messages.push({
      role: "assistant",
      content: contenido || null,
      tool_calls: lista.map((l, i) => ({
        id: l.id || `call_${vuelta}_${i}`,
        type: "function",
        function: { name: l.nombre, arguments: l.argumentos || "{}" },
      })),
    });

    for (const [i, l] of lista.entries()) {
      let entrada: unknown = {};
      try {
        entrada = JSON.parse(l.argumentos || "{}");
      } catch {
        entrada = {};
      }
      const resultado = correrHerramienta(l.nombre, entrada, enviar);
      messages.push({
        role: "tool",
        tool_call_id: l.id || `call_${vuelta}_${i}`,
        content: JSON.stringify(resultado),
      });
    }
  }
}

/* ───────────────────────────── GEMINI ───────────────────────────────── */

async function agenteGemini(
  apiKey: string,
  modelo: string,
  system: string,
  historial: MensajeCliente[],
  enviar: Emisor,
) {
  const contents: Record<string, unknown>[] = historial.map((m) => ({
    role: m.rol === "usuario" ? "user" : "model",
    parts: [{ text: m.texto }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelo,
  )}:streamGenerateContent?alt=sse`;

  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
    const respuesta = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: system }] },
        tools: herramientasGemini(),
        generationConfig: { maxOutputTokens: 8192 },
      }),
    });

    if (!respuesta.ok || !respuesta.body) {
      throw new Error(await textoDeError(respuesta));
    }

    const partesModelo: Record<string, unknown>[] = [];
    const llamadas: { nombre: string; args: unknown }[] = [];

    for await (const dato of leerSse(respuesta)) {
      let trozo: any;
      try {
        trozo = JSON.parse(dato);
      } catch {
        continue;
      }

      const partes = trozo?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(partes)) continue;

      for (const parte of partes) {
        if (typeof parte.text === "string" && parte.text) {
          enviar({ t: "texto", v: parte.text });
          partesModelo.push({ text: parte.text });
        } else if (parte.functionCall) {
          partesModelo.push({ functionCall: parte.functionCall });
          llamadas.push({ nombre: parte.functionCall.name, args: parte.functionCall.args ?? {} });
        }
      }
    }

    if (llamadas.length === 0) return;

    contents.push({ role: "model", parts: partesModelo });
    contents.push({
      role: "user",
      parts: llamadas.map((l) => ({
        functionResponse: {
          name: l.nombre,
          response: { resultado: correrHerramienta(l.nombre, l.args, enviar) },
        },
      })),
    });
  }
}

/* ──────────────────────────── controlador ───────────────────────────── */

export async function POST(req: Request) {
  let cuerpo: CuerpoPeticion;
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  if (!Array.isArray(cuerpo.mensajes) || cuerpo.mensajes.length === 0) {
    return Response.json({ error: "No se recibió ningún mensaje." }, { status: 400 });
  }

  const proveedorId: ProveedorId = esProveedorValido(cuerpo.proveedor ?? "")
    ? (cuerpo.proveedor as ProveedorId)
    : "gemini";
  const proveedor = PROVEEDORES[proveedorId];

  // La llave del usuario manda; si no la mandó, se usa la del servidor (si existe).
  const apiKey = (cuerpo.apiKey || process.env[proveedor.variableEntorno] || "").trim();

  if (!apiKey) {
    return Response.json(
      {
        error: `Falta la llave de ${proveedor.nombre}. Ábrala gratis en ${proveedor.urlLlave} y péguela en el panel «Motor de IA» de la barra lateral. No hay que configurar nada en Vercel.`,
        sinLlave: true,
        proveedor: proveedorId,
      },
      { status: 200 },
    );
  }

  const modelo = (cuerpo.modelo || "").trim() || proveedor.modeloPorDefecto;
  const system = construirSystemPrompt(cuerpo.contexto ?? {});
  const historial = cuerpo.mensajes.filter((m) => m.texto?.trim());

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enviar: Emisor = (obj) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {
          /* cliente desconectado */
        }
      };

      try {
        if (proveedorId === "anthropic") {
          await agenteAnthropic(apiKey, modelo, system, historial, enviar);
        } else if (proveedorId === "groq") {
          await agenteOpenAICompatible(
            "https://api.groq.com/openai/v1/chat/completions",
            apiKey,
            modelo,
            system,
            historial,
            enviar,
          );
        } else {
          await agenteGemini(apiKey, modelo, system, historial, enviar);
        }
        enviar({ t: "fin" });
      } catch (e) {
        const detalle = e instanceof Error ? e.message : String(e);
        const bajo = detalle.toLowerCase();
        let amigable = `Error del motor ${proveedor.nombre}: ${detalle}`;

        if (bajo.includes("401") || bajo.includes("unauthorized") || bajo.includes("api key") || bajo.includes("api_key")) {
          amigable = `La llave de ${proveedor.nombre} no es válida o está mal pegada. Revísela en ${proveedor.urlLlave}.`;
        } else if (bajo.includes("429") || bajo.includes("quota") || bajo.includes("rate limit")) {
          amigable = `Se acabó la cuota gratis de ${proveedor.nombre} por ahora. Espere unos minutos, cambie de modelo o pruebe con el otro motor gratuito.`;
        } else if (bajo.includes("not found") || bajo.includes("404") || bajo.includes("decommission")) {
          amigable = `El modelo «${modelo}» ya no existe en ${proveedor.nombre}. Elija otro en el panel «Motor de IA» (la lista de modelos cambia cada tanto).`;
        } else if (bajo.includes("503") || bajo.includes("overloaded") || bajo.includes("unavailable")) {
          amigable = `${proveedor.nombre} está congestionado. Intente otra vez en unos segundos.`;
        }

        enviar({ t: "error", mensaje: amigable, detalle });
      } finally {
        try {
          controller.close();
        } catch {
          /* ya cerrado */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
