import Anthropic from "@anthropic-ai/sdk";
import { TOOL_DEFINITIONS } from "@/lib/tools/definitions";
import { ejecutarHerramienta } from "@/lib/tools/executors";
import { construirSystemPrompt, type ContextoNegocio } from "@/lib/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-5";
const ESFUERZO = process.env.ANTHROPIC_EFFORT || "high";
const BUSQUEDA_WEB = process.env.BUSQUEDA_WEB !== "false";
const MAX_VUELTAS = 12;

interface MensajeCliente {
  rol: "usuario" | "asistente";
  texto: string;
}

interface CuerpoPeticion {
  mensajes: MensajeCliente[];
  contexto?: ContextoNegocio;
}

function sse(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Falta la variable de entorno ANTHROPIC_API_KEY. Agréguela en Vercel (Settings → Environment Variables) o en su archivo .env.local.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let cuerpo: CuerpoPeticion;
  try {
    cuerpo = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Cuerpo de la petición inválido." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!Array.isArray(cuerpo.mensajes) || cuerpo.mensajes.length === 0) {
    return new Response(JSON.stringify({ error: "No se recibió ningún mensaje." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey });

  const system = construirSystemPrompt(cuerpo.contexto ?? {});

  const messages: Anthropic.MessageParam[] = cuerpo.mensajes
    .filter((m) => m.texto?.trim())
    .map((m) => ({
      role: m.rol === "usuario" ? ("user" as const) : ("assistant" as const),
      content: m.texto,
    }));

  const herramientas: unknown[] = [...TOOL_DEFINITIONS];
  if (BUSQUEDA_WEB) {
    herramientas.push({
      type: "web_search_20260209",
      name: "web_search",
      max_uses: 6,
      user_location: { type: "approximate", country: "CO", timezone: "America/Bogota" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enviar = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(sse(obj)));
        } catch {
          /* cliente desconectado */
        }
      };

      const uso = { entrada: 0, salida: 0, cacheLectura: 0 };

      try {
        for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
          const params = {
            model: MODELO,
            max_tokens: 32000,
            system: [
              {
                type: "text",
                text: system,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages,
            tools: herramientas,
            thinking: { type: "adaptive", display: "summarized" },
            output_config: { effort: ESFUERZO },
          } as unknown as Anthropic.MessageStreamParams;

          const respuestaStream = client.messages.stream(params);

          for await (const evento of respuestaStream) {
            if (evento.type === "content_block_start") {
              const bloque = evento.content_block as { type: string; name?: string };
              if (bloque.type === "tool_use") {
                enviar({ t: "herramienta_inicio", nombre: bloque.name, indice: evento.index });
              } else if (bloque.type === "server_tool_use") {
                enviar({ t: "busqueda_inicio", nombre: bloque.name ?? "web_search" });
              } else if (bloque.type === "web_search_tool_result") {
                enviar({ t: "busqueda_fin" });
              }
            } else if (evento.type === "content_block_delta") {
              const delta = evento.delta as { type: string; text?: string; thinking?: string };
              if (delta.type === "text_delta" && delta.text) {
                enviar({ t: "texto", v: delta.text });
              } else if (delta.type === "thinking_delta" && delta.thinking) {
                enviar({ t: "pensando", v: delta.thinking });
              }
            }
          }

          const mensaje = await respuestaStream.finalMessage();

          uso.entrada += mensaje.usage?.input_tokens ?? 0;
          uso.salida += mensaje.usage?.output_tokens ?? 0;
          uso.cacheLectura += mensaje.usage?.cache_read_input_tokens ?? 0;

          messages.push({ role: "assistant", content: mensaje.content });

          // Herramienta de servidor pausada (búsqueda web larga): reenviar para continuar.
          if (mensaje.stop_reason === "pause_turn") {
            continue;
          }

          const usosHerramienta = mensaje.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          if (usosHerramienta.length === 0) {
            break;
          }

          const resultados: Anthropic.ToolResultBlockParam[] = [];
          for (const uso_ of usosHerramienta) {
            const resultado = ejecutarHerramienta(uso_.name, uso_.input);
            enviar({
              t: "herramienta_fin",
              nombre: uso_.name,
              entrada: uso_.input,
              resultado,
            });
            resultados.push({
              type: "tool_result",
              tool_use_id: uso_.id,
              content: JSON.stringify(resultado),
            });
          }

          messages.push({ role: "user", content: resultados });
        }

        enviar({ t: "fin", uso });
      } catch (e) {
        const mensaje = e instanceof Error ? e.message : String(e);
        let amigable = "Se presentó un error hablando con el modelo.";
        if (mensaje.includes("401") || mensaje.toLowerCase().includes("authentication")) {
          amigable = "La API key de Anthropic no es válida. Revísela en las variables de entorno.";
        } else if (mensaje.includes("429")) {
          amigable = "Se alcanzó el límite de peticiones. Espere un momento y vuelva a intentar.";
        } else if (mensaje.includes("529") || mensaje.includes("overloaded")) {
          amigable = "El servicio está congestionado en este momento. Intente de nuevo en unos segundos.";
        } else if (mensaje.toLowerCase().includes("credit") || mensaje.includes("400")) {
          amigable = `Error de la API: ${mensaje}`;
        }
        enviar({ t: "error", mensaje: amigable, detalle: mensaje });
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
