# 🇨🇴 VendeMás IA

**Chatbot de IA experto en Meta Ads y marketing digital, especializado en perfumería y mueblería en Colombia.**

No es un chat genérico traducido al español: piensa, calcula y habla como un estratega colombiano. Pesos colombianos, Nequi, contraentrega, quincenas, Día de la Madre, Addi, Servientrega y dialecto local en cada respuesta.

**Funciona gratis y sin configurar nada en Vercel.**

---

## Empezar a usarlo (3 caminos)

### 🧮 Camino 1 — Sin llave y sin costo, funciona ya

Entre a **`/herramientas`**. Las 26 calculadoras y generadores son código puro, no IA: no necesitan llave, no cuestan un peso y funcionan apenas despliega la app.

ROAS, presupuesto, márgenes, LTV/CAC, diagnóstico de campañas, estructura de cuenta, públicos, remarketing, guiones de WhatsApp, calendario comercial colombiano… todo con formularios.

Lo único que no tiene es la conversación libre.

### 💬 Camino 2 — Chat con IA gratis (30 segundos)

1. Abra su llave **gratuita** en [Google AI Studio](https://aistudio.google.com/apikey) o en [Groq](https://console.groq.com/keys). No piden tarjeta.
2. En la app, abra el panel **«Motor de IA»** de la barra lateral.
3. Pegue la llave. Listo.

La llave queda guardada **solo en su navegador**. No se registra en el servidor, no se sube a ningún lado y **no hay que tocar Vercel ni hacer redeploy**.

### 🏢 Camino 3 — Que funcione para todos sin pedir llave

Si quiere que cualquiera que abra el link pueda conversar sin poner su propia llave, ahí sí configure la variable de entorno en Vercel (`GOOGLE_API_KEY`, `GROQ_API_KEY` o `ANTHROPIC_API_KEY`) y haga **Redeploy**. La app usa la del servidor cuando el usuario no pega la suya.

---

## Motores soportados

| Motor | Costo | Llave | Notas |
|---|---|---|---|
| **Google Gemini** | Gratis | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Capa gratuita generosa, sin tarjeta. **El recomendado para arrancar.** |
| **Groq** | Gratis | [console.groq.com/keys](https://console.groq.com/keys) | El más rápido de los tres, sin tarjeta. |
| **Anthropic (Claude)** | De pago | [console.anthropic.com](https://console.anthropic.com/settings/keys) | La mejor calidad de estrategia y textos, y el único con búsqueda web en vivo. |

Se cambia de motor desde la propia app, sin tocar código. El modelo también se elige desde ahí.

---

## Las 26 herramientas

Se ejecutan de verdad en el servidor: el modelo no se las inventa. Funcionan igual en el chat que en `/herramientas`.

| Categoría | Herramientas |
|---|---|
| 💰 Finanzas | `calculadora_roas` · `simulador_presupuesto_meta` · `proyeccion_embudo` · `calculadora_precio_margen` · `calculadora_ltv_cac` · `plan_escalamiento` |
| 📣 Meta Ads | `estructura_de_campana` · `constructor_publicos` · `plan_remarketing` · `diagnostico_campana` · `checklist_pixel_capi` · `checklist_catalogo_advantage` · `plan_test_ab` · `constructor_utm` |
| 🎨 Creativos | `framework_copy_ads` · `guion_video_ugc` · `calendario_contenido` |
| 💬 Ventas | `plantillas_whatsapp` · `manejo_objeciones` · `buyer_persona_colombia` |
| 🖥️ Conversión | `auditoria_landing_cro` · `plan_email_sms_whatsapp` |
| 🇨🇴 Colombia | `calendario_comercial_colombia` · `benchmarks_colombia` · `metodos_pago_envios` · `normativa_publicidad` |

Además, con Anthropic se activa **búsqueda web en vivo** para traer las actualizaciones recientes de Meta Ads.

---

## Desplegar en Vercel

### Un clic

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjhontlopez548-coder%2FChat-bot-marketing-IA-&project-name=vendemas-ia&repository-name=vendemas-ia)

**No le pide ninguna variable de entorno.** Despliegue y ya: las calculadoras funcionan de una, y para el chat pega la llave gratis dentro de la app.

### Importando el repo

1. [vercel.com/new](https://vercel.com/new) → importe este repositorio.
2. Framework: **Next.js** (se detecta solo). No cambie nada.
3. **Deploy**.

> ⚠️ **Si usa Anthropic:** la ruta `/api/chat` declara `maxDuration = 300`. En el plan Hobby el tope son 60 segundos salvo que active **Fluid Compute** (Settings → Functions). Con Gemini y Groq las respuestas son cortas y no suele hacer falta.

---

## Correr en local

```bash
git clone https://github.com/jhontlopez548-coder/Chat-bot-marketing-IA-.git
cd Chat-bot-marketing-IA-
npm install
npm run dev
```

Abra <http://localhost:3000>. No necesita archivo `.env` para nada: pegue la llave en la app.

---

## Variables de entorno (todas opcionales)

| Variable | Para qué |
|---|---|
| `GOOGLE_API_KEY` | Llave de Gemini del lado del servidor (para que nadie tenga que poner la suya) |
| `GROQ_API_KEY` | Igual, con Groq |
| `ANTHROPIC_API_KEY` | Igual, con Claude |
| `ANTHROPIC_EFFORT` | `low` · `medium` · `high` · `xhigh` · `max` (por defecto `high`) |
| `BUSQUEDA_WEB` | `false` para apagar la búsqueda web de Anthropic |

---

## Cómo está armado

```
app/
  api/chat/route.ts        Streaming SSE + bucle de herramientas (3 motores)
  api/herramienta/route.ts Ejecuta una herramienta sin IA
  herramientas/page.tsx    Modo sin IA (formularios)
  page.tsx · layout.tsx · globals.css
components/
  Chat.tsx                 Estado, streaming y compositor
  BarraLateral.tsx         Motor de IA, negocio y acciones rápidas
  Herramientas.tsx         Formularios generados desde los esquemas
  Mensaje.tsx · TarjetaHerramienta.tsx · ResultadoJson.tsx
lib/
  proveedores.ts           Gemini, Groq y Anthropic
  system-prompt.ts         Personalidad y dialecto colombiano
  prompts-rapidos.ts       32 acciones rápidas
  tools/definitions.ts     Esquemas de las 26 herramientas
  tools/executors.ts       Lógica real (matemática y plantillas)
  tools/esquemas.ts        Traduce los esquemas a cada motor
  tools/catalogo.ts        Títulos, íconos y categorías
  data/colombia.ts         Benchmarks, calendario, pagos, normativa
```

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS.

Un mismo catálogo de herramientas se traduce al formato de cada motor (Anthropic `tools`, OpenAI `functions`, Gemini `functionDeclarations`), así que agregar una herramienta nueva la deja disponible en los tres de una vez.

---

## Nota sobre las cifras

Los rangos de CPM, CTR, CPA y ticket son **referencias de mercado para planear**, no datos oficiales de Meta. El asistente lo advierte cuando los usa. Los números reales de su cuenta mandan siempre.

Las orientaciones legales (SIC, Habeas Data, IVA, INVIMA) son informativas y no reemplazan asesoría jurídica.

---

## Personalizarlo

- **Tono y reglas del asistente** → `lib/system-prompt.ts`
- **Benchmarks y fechas comerciales** → `lib/data/colombia.ts`
- **Herramienta nueva** → esquema en `lib/tools/definitions.ts` + función en `lib/tools/executors.ts` + ficha en `lib/tools/catalogo.ts`. Queda disponible en el chat, en los tres motores y en `/herramientas` automáticamente.
- **Acciones rápidas** → `lib/prompts-rapidos.ts`
- **Colores** → `tailwind.config.ts` (paleta `marca`)
