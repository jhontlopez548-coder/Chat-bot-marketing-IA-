import { ejecutarHerramienta, NOMBRES_HERRAMIENTAS } from "@/lib/tools/executors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ejecuta una herramienta directamente, sin modelo de IA de por medio.
 * Esto es lo que hace funcionar el «modo sin IA»: no necesita llave ni costo.
 */
export async function POST(req: Request) {
  let cuerpo: { nombre?: string; entrada?: unknown };
  try {
    cuerpo = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  const nombre = cuerpo.nombre ?? "";
  if (!NOMBRES_HERRAMIENTAS.includes(nombre)) {
    return Response.json({ error: `La herramienta «${nombre}» no existe.` }, { status: 404 });
  }

  const resultado = ejecutarHerramienta(nombre, cuerpo.entrada ?? {});
  return Response.json({ nombre, resultado });
}
