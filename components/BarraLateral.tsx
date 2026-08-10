"use client";

import { useMemo, useState } from "react";
import { CATEGORIAS, PROMPTS_RAPIDOS, type Categoria } from "@/lib/prompts-rapidos";

export interface Contexto {
  negocio: "perfumeria" | "muebleria" | "ambos";
  nombreNegocio: string;
  ciudad: string;
  presupuestoMensual: string;
  ticketPromedio: string;
  notas: string;
}

export const CONTEXTO_INICIAL: Contexto = {
  negocio: "ambos",
  nombreNegocio: "",
  ciudad: "",
  presupuestoMensual: "",
  ticketPromedio: "",
  notas: "",
};

interface Props {
  contexto: Contexto;
  setContexto: (c: Contexto) => void;
  onUsarPrompt: (texto: string) => void;
  onNuevaConversacion: () => void;
  abierta: boolean;
  onCerrar: () => void;
}

export default function BarraLateral({
  contexto,
  setContexto,
  onUsarPrompt,
  onNuevaConversacion,
  abierta,
  onCerrar,
}: Props) {
  const [categoria, setCategoria] = useState<Categoria | "Todas">("Todas");
  const [buscar, setBuscar] = useState("");
  const [mostrarContexto, setMostrarContexto] = useState(false);

  const prompts = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return PROMPTS_RAPIDOS.filter((p) => {
      const porNegocio = p.negocio === "ambos" || contexto.negocio === "ambos" || p.negocio === contexto.negocio;
      const porCategoria = categoria === "Todas" || p.categoria === categoria;
      const porTexto =
        !q || p.titulo.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q);
      return porNegocio && porCategoria && porTexto;
    });
  }, [categoria, buscar, contexto.negocio]);

  return (
    <>
      {abierta && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onCerrar}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[330px] flex-col border-r border-neutral-800 bg-neutral-950 transition-transform lg:static lg:translate-x-0 ${
          abierta ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Encabezado */}
        <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-marca-500 to-marca-700 font-bold text-white">
            V
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">VendeMás IA</p>
            <p className="truncate text-xs text-neutral-500">Meta Ads · Colombia 🇨🇴</p>
          </div>
          <button
            onClick={onCerrar}
            className="ml-auto rounded p-1 text-neutral-500 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        {/* Selector de negocio */}
        <div className="border-b border-neutral-800 px-4 py-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-neutral-500">Su negocio</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { v: "perfumeria", t: "Perfumería", i: "🌸" },
                { v: "muebleria", t: "Mueblería", i: "🛋️" },
                { v: "ambos", t: "Los dos", i: "🏪" },
              ] as const
            ).map((op) => (
              <button
                key={op.v}
                onClick={() => setContexto({ ...contexto, negocio: op.v })}
                className={`rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors ${
                  contexto.negocio === op.v
                    ? "border-marca-500 bg-marca-500/15 text-marca-300"
                    : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                <span className="block text-base">{op.i}</span>
                {op.t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMostrarContexto((m) => !m)}
            className="mt-3 flex w-full items-center justify-between text-xs text-neutral-500 hover:text-neutral-300"
          >
            <span>Datos de mi negocio (opcional)</span>
            <span>{mostrarContexto ? "▲" : "▼"}</span>
          </button>

          {mostrarContexto && (
            <div className="mt-2 space-y-2">
              {(
                [
                  { k: "nombreNegocio", ph: "Nombre del negocio" },
                  { k: "ciudad", ph: "Ciudad principal (ej: Medellín)" },
                  { k: "presupuestoMensual", ph: "Presupuesto mensual (ej: $2.000.000)" },
                  { k: "ticketPromedio", ph: "Ticket promedio (ej: $150.000)" },
                  { k: "notas", ph: "Otra cosa que deba saber…" },
                ] as const
              ).map((campo) => (
                <input
                  key={campo.k}
                  value={contexto[campo.k]}
                  onChange={(e) => setContexto({ ...contexto, [campo.k]: e.target.value })}
                  placeholder={campo.ph}
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-marca-600 focus:outline-none"
                />
              ))}
              <p className="text-[10px] leading-relaxed text-neutral-600">
                Estos datos se guardan solo en su navegador y se le pasan al asistente en cada consulta.
              </p>
            </div>
          )}
        </div>

        {/* Buscador y categorías */}
        <div className="border-b border-neutral-800 px-4 py-3">
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar herramienta…"
            className="mb-2 w-full rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-marca-600 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1">
            {(["Todas", ...CATEGORIAS] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(c as Categoria | "Todas")}
                className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                  categoria === c
                    ? "border-marca-500 bg-marca-500/15 text-marca-300"
                    : "border-neutral-800 text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de herramientas */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            {prompts.length} herramientas
          </p>
          <div className="space-y-1">
            {prompts.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onUsarPrompt(p.prompt);
                  onCerrar();
                }}
                className="w-full rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors hover:border-neutral-800 hover:bg-neutral-900"
              >
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none">{p.icono}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-neutral-200">{p.titulo}</p>
                    <p className="truncate text-[11px] text-neutral-500">{p.descripcion}</p>
                  </div>
                </div>
              </button>
            ))}
            {prompts.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-neutral-600">
                No hay herramientas con ese filtro.
              </p>
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="border-t border-neutral-800 p-3">
          <button
            onClick={onNuevaConversacion}
            className="w-full rounded-lg border border-neutral-800 py-2 text-sm text-neutral-300 transition-colors hover:border-marca-600 hover:text-marca-300"
          >
            + Nueva conversación
          </button>
        </div>
      </aside>
    </>
  );
}
