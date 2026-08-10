"use client";

/** Convierte `costo_por_venta` en «Costo por venta». */
function humanizar(clave: string) {
  const limpio = clave.replace(/_/g, " ").replace(/\bpct\b/gi, "%").trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function esPrimitivo(v: unknown): v is string | number | boolean {
  return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function Primitivo({ valor }: { valor: string | number | boolean }) {
  const texto = typeof valor === "boolean" ? (valor ? "Sí" : "No") : String(valor);
  const destacar = /^\$|^-?\d+([.,]\d+)?(x|%)?$/.test(texto) || /^\$/.test(texto);
  return (
    <span className={destacar ? "font-semibold text-marca-300" : "text-neutral-200"}>{texto}</span>
  );
}

export default function ResultadoJson({
  valor,
  nivel = 0,
}: {
  valor: unknown;
  nivel?: number;
}) {
  if (valor === null || valor === undefined) {
    return <span className="text-neutral-600">—</span>;
  }

  if (esPrimitivo(valor)) {
    return <Primitivo valor={valor} />;
  }

  if (Array.isArray(valor)) {
    if (valor.length === 0) return <span className="text-neutral-600">—</span>;

    if (valor.every(esPrimitivo)) {
      return (
        <ul className="my-1 space-y-1">
          {valor.map((v, i) => (
            <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-neutral-300">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-marca-500" />
              <span>{String(v)}</span>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className="my-2 space-y-2">
        {valor.map((v, i) => (
          <div
            key={i}
            className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3"
          >
            <ResultadoJson valor={v} nivel={nivel + 1} />
          </div>
        ))}
      </div>
    );
  }

  const entradas = Object.entries(valor as Record<string, unknown>);
  if (entradas.length === 0) return <span className="text-neutral-600">—</span>;

  return (
    <div className={nivel === 0 ? "space-y-3" : "space-y-2"}>
      {entradas.map(([clave, v]) => {
        const simple = esPrimitivo(v);
        return (
          <div
            key={clave}
            className={
              nivel === 0
                ? "rounded-xl border border-neutral-800 bg-neutral-900/40 p-4"
                : ""
            }
          >
            <p
              className={
                nivel === 0
                  ? "mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500"
                  : "mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500"
              }
            >
              {humanizar(clave)}
            </p>
            <div className={simple ? "text-[15px]" : "text-[13px]"}>
              <ResultadoJson valor={v} nivel={nivel + 1} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
