import type { Metadata } from "next";
import Herramientas from "@/components/Herramientas";

export const metadata: Metadata = {
  title: "Herramientas sin IA — VendeMás IA",
  description:
    "26 calculadoras y generadores de marketing para Colombia que funcionan sin llave de IA y sin costo: ROAS, presupuesto, márgenes, diagnóstico de campañas y más.",
};

export default function Page() {
  return <Herramientas />;
}
