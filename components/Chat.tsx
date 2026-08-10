"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import BarraLateral, { CONTEXTO_INICIAL, MOTOR_INICIAL, type Contexto, type Motor } from "./BarraLateral";
import Mensaje, { type Bloque, type MensajeChat } from "./Mensaje";
import { PROVEEDORES } from "@/lib/proveedores";

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
  const [motor, setMotor] = useState<Motor>(MOTOR_INICIAL);
  const [barraAbierta, setBarraAbierta] = useState(false);

  const finRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const motorListo = motor.apiKey.trim().length > 10;
  const proveedor = PROVEEDORES[motor.proveedor];

  // Cargar y guardar preferencias en el navegador
  useEffect(() => {
    try {
      const ctx = localStorage.getItem("vendemas_contexto");
      if (ctx) setContexto({ ...CONTEXTO_INICIAL, ...JSON.parse(ctx) });
      const mtr = localStorage.getItem("vendemas_motor");
      if (mtr) setMotor({ ...MOTOR_INICIAL, ...JSON.parse(mtr) });
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
    try {
      localStorage.setItem("vendemas_motor", JSON.stringify(motor));
    } catch {
      /* ignorar */
    }
  }, [motor]);

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
    const historial = [...mensajes, mensajeUsuario];
    setMensajes([...historial, { id: idAsistente, rol: "asistente", bloques: [] }]);
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
          proveedor: motor.proveedor,
          apiKey: motor.apiKey,
          modelo: motor.modelo || proveedor.modeloPorDefecto,
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

      const tipo = res.headers.get("content-type") ?? "";

      // Respuesta de error o de «falta la llave»: viene como JSON, no como stream.
      if (!res.ok || tipo.includes("application/json") || !res.body) {
        const data = await res.json().catch(() => ({ error: "No se pudo conectar con el servidor." }));
        actualizar((m) => ({ ...m, error: data.error ?? "No se pudo procesar la solicitud." }));
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
            actualizar((m) => ({ ...m, bloques: [...m.bloques, { tipo: "busqueda", estado: "corriendo" } as Bloque] }));
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
        actualizar((m) => ({ ...m, error: "Se perdió la conexión. Intente de nuevo." }));
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
        motor={motor}
        setMotor={setMotor}
        onUsarPrompt={usarPrompt}
        onNuevaConversacion={() => {
          detener();
          setMensajes([]);
          setEntrada("");
        }}
        abierta={barraAbierta}
        onCerrar={() => setBarraAbierta(false)}
        abrirMotor={!motorListo}
      />

      <main className="flex min-w-0 flex-1 flex-col">
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
            {motorListo ? proveedor.nombre.split(" ")[0] : "⚠️ Sin llave"}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {mensajes.length === 0 ? (
            <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-marca-500 to-marca-700 text-2xl font-bold text-white shadow-lg">
                V
              </div>
              <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
                Su estratega de Meta Ads en Colombia
              </h1>
              <p className="mb-6 max-w-lg text-[15px] leading-relaxed text-neutral-400">
                Le ayudo a vender más en <strong className="text-neutral-200">perfumería</strong> y{" "}
                <strong className="text-neutral-200">mueblería</strong> con campañas que sí dejan plata.
                Calculadoras reales, estructura de cuenta, creativos, guiones de WhatsApp y todo el
                contexto colombiano.
              </p>

              {!motorListo && (
                <div className="mb-6 w-full rounded-xl border border-marca-800 bg-marca-950/40 p-4 text-left">
                  <p className="mb-1 text-sm font-semibold text-marca-200">
                    Para conversar necesita una llave gratuita (30 segundos)
                  </p>
                  <p className="mb-3 text-[13px] leading-relaxed text-neutral-400">
                    Abra su llave gratis en{" "}
                    <a
                      href={proveedor.urlLlave}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-marca-400 underline underline-offset-2"
                    >
                      {proveedor.nombre}
                    </a>{" "}
                    (no le piden tarjeta) y péguela en el panel <strong className="text-neutral-300">«Motor de IA»</strong> de
                    la barra lateral. Se guarda en su navegador; no hay que tocar Vercel.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBarraAbierta(true)}
                      className="rounded-lg bg-marca-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-marca-500 lg:hidden"
                    >
                      Abrir el panel
                    </button>
                    <Link
                      href="/herramientas"
                      className="rounded-lg border border-emerald-800 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40"
                    >
                      🧮 O use las calculadoras sin IA (ya funcionan)
                    </Link>
                  </div>
                </div>
              )}

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

        <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-2 transition-colors focus-within:border-marca-600">
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
