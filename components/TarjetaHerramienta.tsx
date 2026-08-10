"use client";

import { useState } from "react";

export const NOMBRES_LEGIBLES: Record<string, { titulo: string; icono: string }> = {
  calculadora_roas: { titulo: "Calculadora de ROAS", icono: "💰" },
  simulador_presupuesto_meta: { titulo: "Simulador de presupuesto", icono: "📊" },
  proyeccion_embudo: { titulo: "Proyección de embudo", icono: "🕳️" },
  calculadora_precio_margen: { titulo: "Precio y margen", icono: "🏷️" },
  calculadora_ltv_cac: { titulo: "LTV y CAC", icono: "🔁" },
  plan_escalamiento: { titulo: "Plan de escalamiento", icono: "🚀" },
  estructura_de_campana: { titulo: "Estructura de campaña", icono: "🏗️" },
  constructor_publicos: { titulo: "Constructor de públicos", icono: "🎯" },
  plan_remarketing: { titulo: "Plan de remarketing", icono: "🪜" },
  diagnostico_campana: { titulo: "Diagnóstico de campaña", icono: "🩺" },
  checklist_pixel_capi: { titulo: "Pixel y API de Conversiones", icono: "📡" },
  checklist_catalogo_advantage: { titulo: "Catálogo y Advantage+", icono: "🛒" },
  plan_test_ab: { titulo: "Plan de prueba A/B", icono: "🧪" },
  framework_copy_ads: { titulo: "Frameworks de copy", icono: "✍️" },
  guion_video_ugc: { titulo: "Guion de video UGC", icono: "🎬" },
  calendario_contenido: { titulo: "Calendario de contenido", icono: "📅" },
  plantillas_whatsapp: { titulo: "Plantillas de WhatsApp", icono: "💬" },
  manejo_objeciones: { titulo: "Manejo de objeciones", icono: "🛡️" },
  buyer_persona_colombia: { titulo: "Cliente ideal colombiano", icono: "👤" },
  auditoria_landing_cro: { titulo: "Auditoría de conversión", icono: "🔍" },
  plan_email_sms_whatsapp: { titulo: "Flujos de retención", icono: "⚙️" },
  calendario_comercial_colombia: { titulo: "Calendario comercial Colombia", icono: "🇨🇴" },
  benchmarks_colombia: { titulo: "Benchmarks Colombia", icono: "📈" },
  metodos_pago_envios: { titulo: "Pagos y envíos", icono: "🚚" },
  normativa_publicidad: { titulo: "Normativa y políticas", icono: "⚖️" },
  constructor_utm: { titulo: "Constructor de UTMs", icono: "🔗" },
  web_search: { titulo: "Búsqueda en la web", icono: "🌐" },
};

interface Props {
  nombre: string;
  estado: "corriendo" | "listo";
  entrada?: unknown;
  resultado?: unknown;
}

export default function TarjetaHerramienta({ nombre, estado, entrada, resultado }: Props) {
  const [abierto, setAbierto] = useState(false);
  const info = NOMBRES_LEGIBLES[nombre] ?? { titulo: nombre, icono: "🔧" };

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
        <div className="border-t border-neutral-800 px-3 py-2">
          {entrada != null && (
            <>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-neutral-500">Datos usados</p>
              <pre className="mb-3 max-h-40 overflow-auto rounded bg-neutral-950 p-2 text-[11px] leading-relaxed text-neutral-400">
                {JSON.stringify(entrada, null, 2)}
              </pre>
            </>
          )}
          <p className="mb-1 text-[11px] uppercase tracking-wide text-neutral-500">Resultado</p>
          <pre className="max-h-80 overflow-auto rounded bg-neutral-950 p-2 text-[11px] leading-relaxed text-neutral-400">
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
