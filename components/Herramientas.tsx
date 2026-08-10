"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TOOL_DEFINITIONS } from "@/lib/tools/definitions";
import { CATEGORIAS_HERRAMIENTAS, fichaDe, type CategoriaHerramienta } from "@/lib/tools/catalogo";
import type { EsquemaJson } from "@/lib/tools/esquemas";
import ResultadoJson from "./ResultadoJson";

interface Campo {
  nombre: string;
  esquema: EsquemaJson;
  requerido: boolean;
}

function camposDe(nombre: string): Campo[] {
  const def = TOOL_DEFINITIONS.find((t) => t.name === nombre);
  if (!def) return [];
  const esquema = def.input_schema as unknown as EsquemaJson;
  const props = esquema.properties ?? {};
  const req = esquema.required ?? [];
  return Object.entries(props).map(([clave, sub]) => ({
    nombre: clave,
    esquema: sub,
    requerido: req.includes(clave),
  }));
}

function etiqueta(nombre: string) {
  const limpio = nombre.replace(/_/g, " ").replace(/\bcop\b/gi, "(COP)").replace(/\bpct\b/gi, "(%)");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

export default function Herramientas() {
  const [seleccionada, setSeleccionada] = useState<string>(TOOL_DEFINITIONS[0].name);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaHerramienta | "Todas">("Todas");
  const [menuAbierto, setMenuAbierto] = useState(false);

  const listado = useMemo(() => {
    return TOOL_DEFINITIONS.map((t) => ({ nombre: t.name, ficha: fichaDe(t.name) })).filter(
      (t) => categoria === "Todas" || t.ficha.categoria === categoria,
    );
  }, [categoria]);

  const campos = camposDe(seleccionada);
  const ficha = fichaDe(seleccionada);

  const cambiar = (nombre: string) => {
    setSeleccionada(nombre);
    setValores({});
    setResultado(null);
    setError(null);
    setMenuAbierto(false);
  };

  const calcular = async () => {
    setCargando(true);
    setError(null);

    const entrada: Record<string, unknown> = {};
    for (const campo of campos) {
      const crudo = (valores[campo.nombre] ?? "").trim();
      if (!crudo) continue;
      if (campo.esquema.type === "number") {
        const limpio = Number(crudo.replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
        if (!Number.isNaN(limpio)) entrada[campo.nombre] = limpio;
      } else if (campo.esquema.type === "boolean") {
        entrada[campo.nombre] = crudo === "true";
      } else if (campo.esquema.type === "array") {
        entrada[campo.nombre] = crudo.split(",").map((s) => s.trim()).filter(Boolean);
      } else {
        entrada[campo.nombre] = crudo;
      }
    }

    const faltantes = campos
      .filter((c) => c.requerido && entrada[c.nombre] === undefined)
      .map((c) => etiqueta(c.nombre));

    if (faltantes.length) {
      setError(`Le faltan datos obligatorios: ${faltantes.join(", ")}.`);
      setCargando(false);
      return;
    }

    try {
      const res = await fetch("/api/herramienta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: seleccionada, entrada }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo ejecutar la herramienta.");
      } else {
        setResultado(data.resultado);
      }
    } catch {
      setError("No se pudo conectar. Revise su internet e intente otra vez.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-neutral-950">
      {/* Lista de herramientas */}
      {menuAbierto && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMenuAbierto(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[300px] flex-col border-r border-neutral-800 bg-neutral-950 transition-transform lg:static lg:translate-x-0 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-neutral-800 px-4 py-4">
          <Link href="/" className="text-xs text-neutral-500 hover:text-marca-400">
            ← Volver al chat
          </Link>
          <p className="mt-2 font-semibold text-white">Herramientas sin IA</p>
          <p className="text-xs text-neutral-500">
            Funcionan solas: no necesitan llave ni cuestan nada.
          </p>
        </div>

        <div className="border-b border-neutral-800 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {(["Todas", ...CATEGORIAS_HERRAMIENTAS] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(c as CategoriaHerramienta | "Todas")}
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

        <div className="flex-1 overflow-y-auto p-2">
          {listado.map(({ nombre, ficha: f }) => (
            <button
              key={nombre}
              onClick={() => cambiar(nombre)}
              className={`mb-1 w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                seleccionada === nombre
                  ? "bg-marca-500/15 text-marca-200"
                  : "text-neutral-300 hover:bg-neutral-900"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-base leading-none">{f.icono}</span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{f.titulo}</p>
                  <p className="truncate text-[11px] text-neutral-500">{f.resumen}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Formulario y resultado */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3 lg:hidden">
          <button
            onClick={() => setMenuAbierto(true)}
            className="rounded-md border border-neutral-800 px-2.5 py-1.5 text-neutral-300"
          >
            ☰
          </button>
          <p className="font-semibold text-white">Herramientas</p>
        </header>

        <div className="mx-auto w-full max-w-3xl px-5 py-6">
          <div className="mb-6">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-marca-400">{ficha.categoria}</p>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <span>{ficha.icono}</span>
              {ficha.titulo}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">{ficha.resumen}</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {campos.map((campo) => {
                const id = `campo-${campo.nombre}`;
                const comun =
                  "w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-marca-600 focus:outline-none";
                return (
                  <div key={campo.nombre} className={campo.esquema.type === "array" ? "sm:col-span-2" : ""}>
                    <label htmlFor={id} className="mb-1 block text-xs font-medium text-neutral-300">
                      {etiqueta(campo.nombre)}
                      {campo.requerido && <span className="ml-1 text-marca-500">*</span>}
                    </label>

                    {campo.esquema.enum ? (
                      <select
                        id={id}
                        value={valores[campo.nombre] ?? ""}
                        onChange={(e) => setValores({ ...valores, [campo.nombre]: e.target.value })}
                        className={comun}
                      >
                        <option value="">— Elija —</option>
                        {campo.esquema.enum.map((op) => (
                          <option key={op} value={op}>
                            {etiqueta(op)}
                          </option>
                        ))}
                      </select>
                    ) : campo.esquema.type === "boolean" ? (
                      <select
                        id={id}
                        value={valores[campo.nombre] ?? ""}
                        onChange={(e) => setValores({ ...valores, [campo.nombre]: e.target.value })}
                        className={comun}
                      >
                        <option value="">— Elija —</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        id={id}
                        inputMode={campo.esquema.type === "number" ? "decimal" : "text"}
                        value={valores[campo.nombre] ?? ""}
                        onChange={(e) => setValores({ ...valores, [campo.nombre]: e.target.value })}
                        placeholder={campo.esquema.type === "number" ? "0" : ""}
                        className={comun}
                      />
                    )}

                    {campo.esquema.description && (
                      <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
                        {campo.esquema.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {campos.length === 0 && (
              <p className="text-sm text-neutral-400">
                Esta herramienta no necesita datos. Dele al botón y listo.
              </p>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={calcular}
              disabled={cargando}
              className="mt-5 w-full rounded-lg bg-marca-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-marca-500 disabled:bg-neutral-800 disabled:text-neutral-600"
            >
              {cargando ? "Calculando…" : "Calcular"}
            </button>
          </div>

          {resultado != null && (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-bold text-white">Resultado</h2>
              <ResultadoJson valor={resultado} />
              <button
                onClick={() => navigator.clipboard?.writeText(JSON.stringify(resultado, null, 2))}
                className="mt-4 rounded-md border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
              >
                Copiar resultado
              </button>
            </div>
          )}

          <p className="mt-10 text-center text-[11px] text-neutral-600">
            Las cifras de mercado son rangos de referencia para planear. Valide siempre contra los
            datos reales de su cuenta.
          </p>
        </div>
      </main>
    </div>
  );
}
