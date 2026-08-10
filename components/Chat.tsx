"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BarraLateral, { CONTEXTO_INICIAL, type Contexto } from "./BarraLateral";
import Mensaje, { type Bloque, type MensajeChat } from "./Mensaje";

const SUGERENCIAS_INICIO = [
  "¿Cuánto debo invertir en Meta Ads para vender 100 unidades al mes?",
  "Mi campaña gasta y no vende, ayúdeme a diagnosticarla",
  "Ármeme la estructura completa de mi cuenta de Meta Ads",
  "Escríbame 10 copys para vender esta semana",
  "¿Qué fechas comerciales se vienen y cómo las aprovecho?",
  "Deme el guion de venta por WhatsApp de la A a la Z",
];

const idNuevo = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function Chat() {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [contexto, setContexto] = useState<Contexto>(CONTEXTO_INICIAL);
  const [barraAbierta, setBarraAbierta] = useState(false);

  const finRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cargar y guardar el contexto del negocio en el navegador
  useEffect(() => {
    try {
      const guardado = localStorage.getItem("vendemas_contexto");
      if (guardado) setContexto({ ...CONTEXTO_INICIAL, ...JSON.parse(guardado) });
    } catch {
      /* ignorar */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("vendemas_contexto", JSON.stringify(contexto));
    } catch {
      /* ignorar */
    }
  }, [contexto]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const ajustarAltura = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, []);

  useEffect(ajustarAltura, [entrada, ajustarAltura]);

  const detener = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setCargando(false);
  };

  const enviar = async (texto: string) => {
    const limpio = texto.trim();
    if (!limpio || cargando) return;

    const mensajeUsuario: MensajeChat = {
      id: idNuevo(),
      rol: "usuario",
      bloques: [{ tipo: "texto", texto: limpio }],
    };
    const idAsistente = idNuevo();
    const mensajeAsistente: MensajeChat = { id: idAsistente, rol: "asistente", bloques: [] };

    const historial = [...mensajes, mensajeUsuario];
    setMensajes([...historial, mensajeAsistente]);
    setEntrada("");
    setCargando(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const actualizar = (fn: (m: MensajeChat) => MensajeChat) => {
      setMensajes((prev) => prev.map((m) => (m.id === idAsistente ? fn(m) : m)));
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mensajes: historial.map((m) => ({
            rol: m.rol,
            texto: m.bloques
              .filter((b): b is { tipo: "texto"; texto: string } => b.tipo === "texto")
              .map((b) => b.texto)
              .join("\n\n"),
          })),
          contexto: {
            negocio: contexto.negocio,
            nombreNegocio: contexto.nombreNegocio || undefined,
            ciudad: contexto.ciudad || undefined,
            presupuestoMensual: contexto.presupuestoMensual || undefined,
            ticketPromedio: contexto.ticketPromedio || undefined,
            notas: contexto.notas || undefined,
          },
        }),
      });

      if (!res.ok || !res.body) {
        const detalle = await res.json().catch(() => ({ error: "Error de conexión con el servidor." }));
        actualizar((m) => ({ ...m, error: detalle.error ?? "No se pudo procesar la solicitud." }));
        setCargando(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const partes = buffer.split("\n\n");
        buffer = partes.pop() ?? "";

        for (const parte of partes) {
          const linea = parte.trim();
          if (!linea.startsWith("data:")) continue;
          let evento: any;
          try {
            evento = JSON.parse(linea.slice(5).trim());
          } catch {
            continue;
          }

          if (evento.t === "texto") {
            actualizar((m) => {
              const bloques = [...m.bloques];
              const ultimo = bloques[bloques.length - 1];
              if (ultimo && ultimo.tipo === "texto") {
                bloques[bloques.length - 1] = { tipo: "texto", texto: ultimo.texto + evento.v };
              } else {
                bloques.push({ tipo: "texto", texto: evento.v });
              }
              return { ...m, bloques };
            });
          } else if (evento.t === "pensando") {
            actualizar((m) => ({ ...m, pensando: (m.pensando ?? "") + evento.v }));
          } else if (evento.t === "herramienta_inicio") {
            actualizar((m) => ({
              ...m,
              bloques: [...m.bloques, { tipo: "herramienta", nombre: evento.nombre, estado: "corriendo" } as Bloque],
            }));
          } else if (evento.t === "herramienta_fin") {
            actualizar((m) => {
              const bloques = [...m.bloques];
              for (let i = bloques.length - 1; i >= 0; i--) {
                const b = bloques[i];
                if (b.tipo === "herramienta" && b.nombre === evento.nombre && b.estado === "corriendo") {
                  bloques[i] = {
                    tipo: "herramienta",
                    nombre: evento.nombre,
                    estado: "listo",
                    entrada: evento.entrada,
                    resultado: evento.resultado,
                  };
                  break;
                }
              }
              return { ...m, bloques };
            });
          } else if (evento.t === "busqueda_inicio") {
            actualizar((m) => ({
              ...m,
              bloques: [...m.bloques, { tipo: "busqueda", estado: "corriendo" } as Bloque],
            }));
          } else if (evento.t === "busqueda_fin") {
            actualizar((m) => {
              const bloques = [...m.bloques];
              for (let i = bloques.length - 1; i >= 0; i--) {
                const b = bloques[i];
                if (b.tipo === "busqueda" && b.estado === "corriendo") {
                  bloques[i] = { tipo: "busqueda", estado: "listo" };
                  break;
                }
              }
              return { ...m, bloques };
            });
          } else if (evento.t === "error") {
            actualizar((m) => ({ ...m, error: evento.mensaje }));
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        actualizar((m) => ({
          ...m,
          error: "Se perdió la conexión. Intente de nuevo.",
        }));
      }
    } finally {
      setCargando(false);
      abortRef.current = null;
    }
  };

  const usarPrompt = (texto: string) => {
    setEntrada(texto);
    setTimeout(() => {
      textareaRef.current?.focus();
      ajustarAltura();
    }, 50);
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-neutral-950">
      <BarraLateral
        contexto={contexto}
        setContexto={setContexto}
        onUsarPrompt={usarPrompt}
        onNuevaConversacion={() => {
          detener();
          setMensajes([]);
          setEntrada("");
        }}
        abierta={barraAbierta}
        onCerrar={() => setBarraAbierta(false)}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior móvil */}
        <header className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3 lg:hidden">
          <button
            onClick={() => setBarraAbierta(true)}
            className="rounded-md border border-neutral-800 px-2.5 py-1.5 text-neutral-300"
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <p className="font-semibold text-white">VendeMás IA</p>
          <span className="ml-auto text-xs text-neutral-500">
            {contexto.negocio === "perfumeria" ? "🌸 Perfumería" : contexto.negocio === "muebleria" ? "🛋️ Mueblería" : "🏪 Los dos"}
          </span>
        </header>

        {/* Conversación */}
        <div className="flex-1 overflow-y-auto">
          {mensajes.length === 0 ? (
            <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-marca-500 to-marca-700 text-2xl font-bold text-white shadow-lg">
                V
              </div>
              <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
                Su estratega de Meta Ads en Colombia
              </h1>
              <p className="mb-8 max-w-lg text-[15px] leading-relaxed text-neutral-400">
                Le ayudo a vender más en <strong className="text-neutral-200">perfumería</strong> y{" "}
                <strong className="text-neutral-200">mueblería</strong> con campañas que sí dejan plata.
                Calculadoras reales, estructura de cuenta, creativos, guiones de WhatsApp y todo el
                contexto colombiano: quincenas, Nequi, contraentrega y Día de la Madre.
              </p>
              <div className="grid w-full gap-2 sm:grid-cols-2">
                {SUGERENCIAS_INICIO.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviar(s)}
                    className="rounded-xl border border-neutral-800 px-4 py-3 text-left text-sm text-neutral-300 transition-colors hover:border-marca-600 hover:bg-neutral-900 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="mt-8 text-xs text-neutral-600">
                Abra el menú lateral para ver las {" "}
                <span className="text-neutral-500">herramientas especializadas</span> y cargar los datos de su negocio.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl py-4">
              {mensajes.map((m, i) => (
                <Mensaje
                  key={m.id}
                  mensaje={m}
                  escribiendo={cargando && i === mensajes.length - 1 && m.rol === "asistente"}
                />
              ))}
              <div ref={finRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Compositor */}
        <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-2 focus-within:border-marca-600 transition-colors">
              <textarea
                ref={textareaRef}
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar(entrada);
                  }
                }}
                rows={1}
                placeholder="Pregúnteme lo que sea de su pauta, sus ventas o sus campañas…"
                className="max-h-[200px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
              />
              {cargando ? (
                <button
                  onClick={detener}
                  className="shrink-0 rounded-xl bg-neutral-700 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-600"
                >
                  Detener
                </button>
              ) : (
                <button
                  onClick={() => enviar(entrada)}
                  disabled={!entrada.trim()}
                  className="shrink-0 rounded-xl bg-marca-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-marca-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-600"
                >
                  Enviar
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-neutral-600">
              Las cifras de mercado son rangos de referencia para planear. Valide siempre contra los datos reales de su cuenta.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
