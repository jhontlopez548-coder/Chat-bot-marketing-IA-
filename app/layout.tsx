import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VendeMás IA — Estratega de Meta Ads para Colombia",
  description:
    "Chatbot experto en Meta Ads y marketing digital para perfumería y mueblería en Colombia. Calculadoras de ROAS, estructura de campañas, creativos, guiones de WhatsApp y calendario comercial colombiano.",
  keywords: [
    "Meta Ads Colombia",
    "marketing digital Colombia",
    "publicidad Facebook Instagram",
    "perfumería",
    "mueblería",
    "ROAS",
    "WhatsApp Business",
  ],
  openGraph: {
    title: "VendeMás IA — Estratega de Meta Ads para Colombia",
    description:
      "Su estratega de Meta Ads especializado en perfumería y mueblería en Colombia.",
    locale: "es_CO",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body>{children}</body>
    </html>
  );
}
