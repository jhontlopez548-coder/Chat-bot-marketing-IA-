"use client";

import { useState } from "react";
import { fichaDe } from "@/lib/tools/catalogo";
import ResultadoJson from "./ResultadoJson";

interface Props {
  nombre: string;
  estado: "corriendo" | "listo";
  entrada?: unknown;
  resultado?: unknown;
}

export default function TarjetaHerramienta({ nombre, estado, entrada, resultado }: Props) {
  const [abierto, setAbierto] = useState(false);
  const info = fichaDe(nombre);

  return (
    <div className="my-2 rounded-lg border border-neutral-800 bg-neutral-900/60 text-sm">
      <button
        onClick={() => setAbierto((a) => !a)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-neutral-800/50 rounded-lg transition-colors"
      >
        <span className="text-base">{info.icono}</span>
        <span className="font-medium text-neutral-200">{info.titulo}</span>
        {estado === "corriendo" ? (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-marca-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-marca-400" />
            calculando…
          </span>
        ) : (
          <span className="ml-auto flex items-center gap-2 text-xs text-neutral-500">
            <span className="text-emerald-500">✓ listo</span>
            <span>{abierto ? "▲" : "▼"}</span>
          </span>
        )}
      </button>

      {abierto && estado === "listo" && (
        <div className="border-t border-neutral-800 px-3 py-3">
          {entrada != null && Object.keys(entrada as object).length > 0 && (
            <>
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-neutral-500">Datos usados</p>
              <div className="mb-4 max-h-40 overflow-auto rounded-lg bg-neutral-950 p-3">
                <ResultadoJson valor={entrada} nivel={1} />
              </div>
            </>
          )}
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-neutral-500">Resultado</p>
          <div className="max-h-96 overflow-auto rounded-lg bg-neutral-950 p-3">
            <ResultadoJson valor={resultado} nivel={1} />
          </div>
        </div>
      )}
    </div>
  );
}
