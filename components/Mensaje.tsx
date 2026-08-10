"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TarjetaHerramienta from "./TarjetaHerramienta";

export type Bloque =
  | { tipo: "texto"; texto: string }
  | { tipo: "herramienta"; nombre: string; estado: "corriendo" | "listo"; entrada?: unknown; resultado?: unknown }
  | { tipo: "busqueda"; estado: "corriendo" | "listo" };

export interface MensajeChat {
  id: string;
  rol: "usuario" | "asistente";
  bloques: Bloque[];
  pensando?: string;
  error?: string;
}

function Pensando({ texto }: { texto: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="my-2">
      <button
        onClick={() => setAbierto((a) => !a)}
        className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/50 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
      >
        <span>🧠</span>
        <span>Razonamiento</span>
        <span className="text-neutral-600">{abierto ? "▲" : "▼"}</span>
      </button>
      {abierto && (
        <div className="mt-2 whitespace-pre-wrap rounded-md border border-neutral-800 bg-neutral-900/40 p-3 text-[13px] leading-relaxed text-neutral-400">
          {texto}
        </div>
      )}
    </div>
  );
}

export default function Mensaje({ mensaje, escribiendo }: { mensaje: MensajeChat; escribiendo?: boolean }) {
  const [copiado, setCopiado] = useState(false);

  const textoPlano = mensaje.bloques
    .filter((b): b is { tipo: "texto"; texto: string } => b.tipo === "texto")
    .map((b) => b.texto)
    .join("\n\n");

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoPlano);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin permisos de portapapeles */
    }
  };

  if (mensaje.rol === "usuario") {
    return (
      <div className="flex justify-end px-4 py-3">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-marca-600 px-4 py-2.5 text-[15px] leading-relaxed text-white shadow">
          {textoPlano}
        </div>
      </div>
    );
  }

  return (
    <div className="group px-4 py-3">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-marca-500 to-marca-700 text-sm font-bold text-white shadow">
          V
        </div>
        <div className="min-w-0 flex-1">
          {mensaje.pensando && <Pensando texto={mensaje.pensando} />}

          {mensaje.bloques.map((b, idx) => {
            if (b.tipo === "herramienta") {
              return (
                <TarjetaHerramienta
                  key={idx}
                  nombre={b.nombre}
                  estado={b.estado}
                  entrada={b.entrada}
                  resultado={b.resultado}
                />
              );
            }
            if (b.tipo === "busqueda") {
              return (
                <div
                  key={idx}
                  className="my-2 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-300"
                >
                  <span>🌐</span>
                  <span>Buscando información actualizada en la web</span>
                  {b.estado === "corriendo" && (
                    <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-marca-400" />
                  )}
                </div>
              );
            }
            return (
              <div key={idx} className="md">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="tabla-scroll">
                        <table>{children}</table>
                      </div>
                    ),
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {b.texto}
                </ReactMarkdown>
              </div>
            );
          })}

          {escribiendo && (
            <span className="cursor-escribiendo ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-marca-400" />
          )}

          {mensaje.error && (
            <div className="mt-2 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              ⚠️ {mensaje.error}
            </div>
          )}

          {!escribiendo && textoPlano.length > 0 && (
            <button
              onClick={copiar}
              className="mt-3 rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-500 opacity-0 transition-opacity hover:text-neutral-200 group-hover:opacity-100"
            >
              {copiado ? "✓ Copiado" : "Copiar respuesta"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
