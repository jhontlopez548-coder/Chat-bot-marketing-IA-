"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIAS, PROMPTS_RAPIDOS, type Categoria } from "@/lib/prompts-rapidos";
import { ORDEN_PROVEEDORES, PROVEEDORES, type ProveedorId } from "@/lib/proveedores";

export interface Contexto {
  negocio: "perfumeria" | "muebleria" | "ambos";
  nombreNegocio: string;
  ciudad: string;
  presupuestoMensual: string;
  ticketPromedio: string;
  notas: string;
}

export interface Motor {
  proveedor: ProveedorId;
  apiKey: string;
  modelo: string;
}

export const CONTEXTO_INICIAL: Contexto = {
  negocio: "ambos",
  nombreNegocio: "",
  ciudad: "",
  presupuestoMensual: "",
  ticketPromedio: "",
  notas: "",
};

export const MOTOR_INICIAL: Motor = {
  proveedor: "gemini",
  apiKey: "",
  modelo: "",
};

interface Props {
  contexto: Contexto;
  setContexto: (c: Contexto) => void;
  motor: Motor;
  setMotor: (m: Motor) => void;
  onUsarPrompt: (texto: string) => void;
  onNuevaConversacion: () => void;
  abierta: boolean;
  onCerrar: () => void;
  abrirMotor: boolean;
}

export default function BarraLateral({
  contexto,
  setContexto,
  motor,
  setMotor,
  onUsarPrompt,
  onNuevaConversacion,
  abierta,
  onCerrar,
  abrirMotor,
}: Props) {
  const [categoria, setCategoria] = useState<Categoria | "Todas">("Todas");
  const [buscar, setBuscar] = useState("");
  const [mostrarContexto, setMostrarContexto] = useState(false);
  const [mostrarMotor, setMostrarMotor] = useState(true);
  const [verLlave, setVerLlave] = useState(false);

  const proveedor = PROVEEDORES[motor.proveedor];
  const configurado = motor.apiKey.trim().length > 10;

  const prompts = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return PROMPTS_RAPIDOS.filter((p) => {
      const porNegocio = p.negocio === "ambos" || contexto.negocio === "ambos" || p.negocio === contexto.negocio;
      const porCategoria = categoria === "Todas" || p.categoria === categoria;
      const porTexto = !q || p.titulo.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q);
      return porNegocio && porCategoria && porTexto;
    });
  }, [categoria, buscar, contexto.negocio]);

  return (
    <>
      {abierta && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onCerrar} aria-hidden />}

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
          <button onClick={onCerrar} className="ml-auto rounded p-1 text-neutral-500 hover:text-white lg:hidden" aria-label="Cerrar menú">
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* ── Motor de IA ── */}
          <div id="panel-motor" className={`border-b border-neutral-800 px-4 py-3 ${abrirMotor && !configurado ? "bg-marca-950/30" : ""}`}>
            <button
              onClick={() => setMostrarMotor((m) => !m)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Motor de IA</span>
              <span className="flex items-center gap-2">
                <span className={`text-[10px] ${configurado ? "text-emerald-400" : "text-marca-400"}`}>
                  {configurado ? "✓ Listo" : "Falta la llave"}
                </span>
                <span className="text-neutral-600">{mostrarMotor ? "▲" : "▼"}</span>
              </span>
            </button>

            {mostrarMotor && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-3 gap-1.5">
                  {ORDEN_PROVEEDORES.map((id) => {
                    const p = PROVEEDORES[id];
                    const activo = motor.proveedor === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setMotor({ ...motor, proveedor: id, modelo: "" })}
                        className={`rounded-lg border px-1.5 py-2 text-[10px] font-medium leading-tight transition-colors ${
                          activo
                            ? "border-marca-500 bg-marca-500/15 text-marca-300"
                            : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                        }`}
                      >
                        <span className="block truncate">{p.nombre.split(" ")[0]}</span>
                        <span className={p.gratis ? "text-emerald-500" : "text-neutral-600"}>{p.etiqueta}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] leading-relaxed text-neutral-500">{proveedor.descripcion}</p>

                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="llave" className="text-[11px] text-neutral-400">
                      Su llave de {proveedor.nombre}
                    </label>
                    <button onClick={() => setVerLlave((v) => !v)} className="text-[10px] text-neutral-600 hover:text-neutral-400">
                      {verLlave ? "ocultar" : "ver"}
                    </button>
                  </div>
                  <input
                    id="llave"
                    type={verLlave ? "text" : "password"}
                    autoComplete="off"
                    spellCheck={false}
                    value={motor.apiKey}
                    onChange={(e) => setMotor({ ...motor, apiKey: e.target.value.trim() })}
                    placeholder={`${proveedor.prefijoLlave}...`}
                    className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 font-mono text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-marca-600 focus:outline-none"
                  />
                  <a
                    href={proveedor.urlLlave}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-block text-[11px] text-marca-400 underline underline-offset-2 hover:text-marca-300"
                  >
                    Sacar la llave {proveedor.gratis ? "gratis" : ""} aquí →
                  </a>
                </div>

                <div>
                  <label htmlFor="modelo" className="text-[11px] text-neutral-400">
                    Modelo
                  </label>
                  <select
                    id="modelo"
                    value={motor.modelo || proveedor.modeloPorDefecto}
                    onChange={(e) => setMotor({ ...motor, modelo: e.target.value })}
                    className="mt-1 w-full rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-200 focus:border-marca-600 focus:outline-none"
                  >
                    {proveedor.modelos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] leading-relaxed text-neutral-600">
                    {proveedor.modelos.find((m) => m.id === (motor.modelo || proveedor.modeloPorDefecto))?.nota}
                  </p>
                </div>

                <p className="rounded-md border border-neutral-800 bg-neutral-900/60 px-2 py-1.5 text-[10px] leading-relaxed text-neutral-500">
                  🔒 La llave se guarda únicamente en este navegador. No queda registrada en el servidor
                  ni hay que configurar nada en Vercel.
                </p>
              </div>
            )}
          </div>

          {/* ── Negocio ── */}
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
              </div>
            )}
          </div>

          {/* ── Buscador y categorías ── */}
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

          {/* ── Acciones rápidas ── */}
          <div className="px-3 py-3">
            <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
              {prompts.length} acciones rápidas
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
                <p className="px-2 py-6 text-center text-xs text-neutral-600">No hay nada con ese filtro.</p>
              )}
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="space-y-2 border-t border-neutral-800 p-3">
          <Link
            href="/herramientas"
            className="block rounded-lg border border-neutral-800 py-2 text-center text-sm text-neutral-300 transition-colors hover:border-emerald-700 hover:text-emerald-300"
          >
            🧮 Calculadoras sin IA
          </Link>
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
