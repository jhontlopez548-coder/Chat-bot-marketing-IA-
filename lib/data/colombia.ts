/**
 * Base de conocimiento local: Colombia.
 * Cifras de referencia en COP. Son rangos de mercado para planeación,
 * NO son datos oficiales de Meta. Siempre hay que validarlos contra la
 * cuenta real del cliente.
 */

export type Vertical = "perfumeria" | "muebleria";

export interface Benchmark {
  cpmCop: [number, number];
  ctrPct: [number, number];
  cpcCop: [number, number];
  cvrLandingPct: [number, number];
  cprWhatsappCop: [number, number];
  cpaVentaCop: [number, number];
  ticketPromedioCop: [number, number];
  roasSano: [number, number];
  notas: string;
}

export const BENCHMARKS: Record<Vertical, Record<string, Benchmark>> = {
  perfumeria: {
    trafico_frio_reels: {
      cpmCop: [8000, 18000],
      ctrPct: [1.2, 3.0],
      cpcCop: [350, 1200],
      cvrLandingPct: [1.0, 3.0],
      cprWhatsappCop: [3000, 9000],
      cpaVentaCop: [18000, 55000],
      ticketPromedioCop: [90000, 260000],
      roasSano: [2.5, 6.0],
      notas:
        "Decants y perfumes árabes/inspirados mueven mucho volumen en frío. El video corto (UGC oliendo/aplicando) baja el CPM porque genera retención.",
    },
    remarketing: {
      cpmCop: [12000, 28000],
      ctrPct: [2.0, 6.0],
      cpcCop: [300, 900],
      cvrLandingPct: [3.0, 9.0],
      cprWhatsappCop: [1500, 5000],
      cpaVentaCop: [8000, 28000],
      ticketPromedioCop: [110000, 300000],
      roasSano: [5.0, 15.0],
      notas: "Catálogo dinámico (DPA) + carrito abandonado es lo más rentable del embudo.",
    },
    advantage_shopping: {
      cpmCop: [9000, 20000],
      ctrPct: [1.0, 2.5],
      cpcCop: [400, 1400],
      cvrLandingPct: [1.5, 4.5],
      cprWhatsappCop: [2500, 8000],
      cpaVentaCop: [15000, 48000],
      ticketPromedioCop: [95000, 280000],
      roasSano: [3.0, 8.0],
      notas: "ASC (Advantage+ Shopping) funciona bien desde ~50 conversiones/semana de historial.",
    },
  },
  muebleria: {
    trafico_frio_reels: {
      cpmCop: [7000, 16000],
      ctrPct: [0.9, 2.4],
      cpcCop: [400, 1600],
      cvrLandingPct: [0.5, 2.0],
      cprWhatsappCop: [6000, 22000],
      cpaVentaCop: [90000, 350000],
      ticketPromedioCop: [900000, 4500000],
      roasSano: [3.0, 10.0],
      notas:
        "Ciclo de compra largo (7 a 45 días). El video de espacio antes/después y el recorrido del showroom son los que mejor convierten.",
    },
    remarketing: {
      cpmCop: [10000, 24000],
      ctrPct: [1.6, 4.5],
      cpcCop: [350, 1200],
      cvrLandingPct: [2.0, 6.0],
      cprWhatsappCop: [3000, 12000],
      cpaVentaCop: [45000, 180000],
      ticketPromedioCop: [1100000, 5000000],
      roasSano: [6.0, 20.0],
      notas: "Aquí vive la plata: quien vio la sala de estar 3 veces está listo para que el asesor lo llame.",
    },
    catalogo_mensajes: {
      cpmCop: [8000, 19000],
      ctrPct: [1.1, 3.2],
      cpcCop: [380, 1300],
      cvrLandingPct: [1.0, 3.5],
      cprWhatsappCop: [5000, 18000],
      cpaVentaCop: [70000, 260000],
      ticketPromedioCop: [1000000, 4500000],
      roasSano: [4.0, 12.0],
      notas:
        "Campañas a WhatsApp (Click-to-WhatsApp) rinden mucho en mueblería porque el cliente necesita medidas, tiempos de entrega y financiación.",
    },
  },
};

export interface FechaComercial {
  nombre: string;
  cuando: string;
  mes: number;
  calienta: string;
  perfumeria: string;
  muebleria: string;
}

export const CALENDARIO_COMERCIAL: FechaComercial[] = [
  {
    nombre: "Temporada de rebajas de arranque de año",
    cuando: "1 al 31 de enero",
    mes: 1,
    calienta: "Diciembre 26 en adelante",
    perfumeria: "Liquidación de referencias navideñas y combos de decants para recuperar caja.",
    muebleria: "Campaña de 'renueva tu casa este año' con financiación a 12 y 24 meses (enero está flojo de plata, la financiación es el gancho).",
  },
  {
    nombre: "San Valentín / Día de los Enamorados",
    cuando: "14 de febrero",
    mes: 2,
    calienta: "25 de enero",
    perfumeria: "Pico fuerte. Kits para él y para ella, empaque de regalo gratis.",
    muebleria: "Bajo. Se puede empujar alcoba y colchones con ángulo de pareja.",
  },
  {
    nombre: "Día de la Mujer",
    cuando: "8 de marzo",
    mes: 3,
    calienta: "24 de febrero",
    perfumeria: "Pico medio-alto, muy buen ángulo de autorregalo.",
    muebleria: "Ángulo 'consiéntete': tocador, poltrona de lectura, escritorio.",
  },
  {
    nombre: "Semana Santa",
    cuando: "Marzo o abril (móvil)",
    mes: 4,
    calienta: "2 semanas antes",
    perfumeria: "Bajo. Bajar presupuesto jueves y viernes santo.",
    muebleria: "Bueno en exteriores: comedores, terraza, muebles de jardín.",
  },
  {
    nombre: "Día de la Madre",
    cuando: "Segundo domingo de mayo",
    mes: 5,
    calienta: "15 de abril",
    perfumeria: "EL PICO DEL AÑO junto con navidad. Empezar a calentar públicos 3 semanas antes.",
    muebleria: "Muy fuerte. Sala, comedor y electrodomésticos de cocina con mensaje emocional.",
  },
  {
    nombre: "Día del Padre",
    cuando: "Tercer domingo de junio",
    mes: 6,
    calienta: "25 de mayo",
    perfumeria: "Fuerte en línea masculina y árabes.",
    muebleria: "Medio. Poltronas reclinables, escritorios, muebles de TV.",
  },
  {
    nombre: "Prima de mitad de año",
    cuando: "Hasta el 30 de junio",
    mes: 6,
    calienta: "10 de junio",
    perfumeria: "Sube el ticket promedio, empujar combos de 3 unidades.",
    muebleria: "Momento clave del semestre: la gente compra muebles con la prima. Subir presupuesto 40-60%.",
  },
  {
    nombre: "Día sin IVA",
    cuando: "Fechas que define el Gobierno (revisar cada año)",
    mes: 7,
    calienta: "10 días antes",
    perfumeria: "Cuando aplica, es tráfico masivo. Preparar stock y stories con cuenta regresiva.",
    muebleria: "Aplica a electrodomésticos y algunos bienes; verificar la norma vigente antes de prometer.",
  },
  {
    nombre: "Amor y Amistad",
    cuando: "Tercer sábado de septiembre",
    mes: 9,
    calienta: "20 de agosto",
    perfumeria: "Segundo pico más grande del año. Amigo secreto = ticket bajo, volumen alto.",
    muebleria: "Bajo, pero sirve para captar leads con concursos.",
  },
  {
    nombre: "Halloween / Día de los Niños",
    cuando: "31 de octubre",
    mes: 10,
    calienta: "10 de octubre",
    perfumeria: "Bajo, útil para contenido orgánico y alcance.",
    muebleria: "Ángulo de cuarto infantil y camarotes.",
  },
  {
    nombre: "Black Friday y Cyber Lunes",
    cuando: "Último viernes de noviembre y el lunes siguiente",
    mes: 11,
    calienta: "1 de noviembre (llenar remarketing)",
    perfumeria: "Descuentos reales. El CPM sube 30-60%, hay que reservar presupuesto.",
    muebleria: "Muy fuerte. Combinar descuento + financiación sin cuota inicial.",
  },
  {
    nombre: "Prima de fin de año y Navidad",
    cuando: "1 al 24 de diciembre",
    mes: 12,
    calienta: "5 de noviembre",
    perfumeria: "Máximo del año. Del 1 al 20 de diciembre se hace el 25-35% de la facturación anual.",
    muebleria: "Fuerte hasta el 15 de diciembre (después la gente ya no alcanza a recibir el mueble). Comunicar fecha límite de entrega.",
  },
];

export const QUINCENAS = {
  descripcion:
    "En Colombia se paga el 15 y el 30 de cada mes. Del 14 al 18 y del 29 al 3 el poder de compra sube fuerte.",
  recomendacion:
    "Subir presupuesto 30-50% en esos días y bajarlo del 5 al 12 y del 19 al 27, que son los días 'flacos'.",
};

export const CIUDADES_CLAVE = [
  { ciudad: "Bogotá", nota: "Mayor volumen y mayor CPM. Ticket alto. Zonas: Chapinero, Usaquén, Cedritos, Suba, Kennedy." },
  { ciudad: "Medellín", nota: "Muy buena conversión en belleza y hogar. El Poblado y Laureles con ticket alto; Envigado, Bello, Itagüí con volumen." },
  { ciudad: "Cali", nota: "Excelente para perfumería (cultura de fragancia fuerte). CPM más barato que Bogotá." },
  { ciudad: "Barranquilla y Cartagena", nota: "Costa: prefieren fragancias frescas/cítricas. Muebles en ratán y colores claros." },
  { ciudad: "Bucaramanga", nota: "Polo mueblero (Piedecuesta, Girón). Buen CPC, ojo con la competencia local de fábrica." },
  { ciudad: "Eje Cafetero (Pereira, Manizales, Armenia)", nota: "CPM barato, buen terreno para escalar sin quemar públicos." },
  { ciudad: "Villavicencio, Neiva, Ibagué, Cúcuta", nota: "Ciudades intermedias: CPM bajo, ideal para prospección y contraentrega." },
];

export const METODOS_PAGO = [
  { nombre: "Nequi", nota: "El más usado para tickets bajos y medios. Imprescindible en perfumería." },
  { nombre: "Daviplata", nota: "Segundo en billeteras. Público más amplio en ciudades intermedias." },
  { nombre: "Contraentrega (pago contra entrega)", nota: "Sube conversión 20-40% en frío, pero ojo con la tasa de devolución (15-30%)." },
  { nombre: "PSE", nota: "Estándar para tickets altos y facturación empresarial." },
  { nombre: "Addi / Sistecrédito", nota: "Financiación en cuotas sin tarjeta. Palanca gigante en mueblería." },
  { nombre: "Wompi / Bold / ePayco / Mercado Pago", nota: "Pasarelas locales con link de pago para cerrar por WhatsApp." },
  { nombre: "Tarjeta de crédito a cuotas", nota: "En mueblería, comunicar la cuota mensual, no el precio total." },
];

export const TRANSPORTADORAS = [
  "Servientrega",
  "Interrapidísimo",
  "Coordinadora",
  "Envía",
  "TCC",
  "Mensajeros Urbanos (última milla en ciudades grandes)",
];

export const NORMATIVA = [
  "IVA general del 19% (verificar productos excluidos y días sin IVA vigentes).",
  "Habeas Data (Ley 1581 de 2012): toda captura de datos necesita autorización explícita y política de tratamiento visible.",
  "SIC: la publicidad no puede ser engañosa. Si dices 'descuento del 50%', el precio anterior debe haber estado vigente.",
  "Derecho de retracto: 5 días hábiles en ventas a distancia (Estatuto del Consumidor, Ley 1480 de 2011).",
  "Cambios y garantías deben estar visibles en la web y en el WhatsApp Business.",
  "No prometer resultados terapéuticos ni médicos con perfumes; INVIMA regula cosméticos.",
];

export const TONO_COLOMBIANO = {
  usar: [
    "Parcero / parce (informal, con confianza)",
    "Bacano, chévere, brutal, una nota, de una",
    "Le tengo / le cuento / mire pues",
    "¿Sí o qué? / ¿Cómo le parece?",
    "Domicilio (no 'delivery'), plata (no 'dinero'), tienda (no 'shop')",
    "Cuotas / financiación / abono (no 'installments')",
    "Hágale, aproveche, quedan poquitas",
  ],
  evitar: [
    "Español neutro de manual o mexicanismos ('órale', 'chido', 'padrísimo', 'carro' en contexto raro)",
    "Argentinismos ('vos tenés', 'genial che')",
    "Españolismos ('vale', 'coger el pedido', 'móvil', 'ordenador')",
    "Anglicismos innecesarios cuando existe la palabra en español colombiano",
  ],
  nota: "Usted es respetuoso y cercano en Colombia; el tú suena más juvenil/bogotano; el vos es paisa y caleño. Ajustar según ciudad y público.",
};
