# 🇨🇴 VendeMás IA

**Chatbot de IA experto en Meta Ads y marketing digital, especializado en perfumería y mueblería en Colombia.**

No es un chat genérico traducido al español: piensa, calcula y habla como un estratega colombiano. Pesos colombianos, Nequi, contraentrega, quincenas, Día de la Madre, Addi, Servientrega y dialecto local en cada respuesta.

---

## Qué hace

- **26 herramientas que se ejecutan de verdad** (no las inventa el modelo): calculadoras de ROAS, presupuesto, márgenes, LTV/CAC, diagnóstico de campañas, estructura de cuenta, públicos, remarketing, guiones y más.
- **Búsqueda web en vivo** para traer las actualizaciones recientes de Meta Ads y marketing digital.
- **Razonamiento visible** (panel plegable) y **streaming** token a token.
- **Contexto de negocio persistente**: nombre, ciudad, presupuesto y ticket promedio se guardan en el navegador y viajan en cada consulta.
- **32 acciones rápidas** organizadas por categoría en la barra lateral.

### Las 26 herramientas

| Categoría | Herramientas |
|---|---|
| 💰 Finanzas | `calculadora_roas` · `simulador_presupuesto_meta` · `proyeccion_embudo` · `calculadora_precio_margen` · `calculadora_ltv_cac` · `plan_escalamiento` |
| 📣 Meta Ads | `estructura_de_campana` · `constructor_publicos` · `plan_remarketing` · `diagnostico_campana` · `checklist_pixel_capi` · `checklist_catalogo_advantage` · `plan_test_ab` · `constructor_utm` |
| 🎨 Creativos | `framework_copy_ads` · `guion_video_ugc` · `calendario_contenido` |
| 💬 Ventas | `plantillas_whatsapp` · `manejo_objeciones` · `buyer_persona_colombia` |
| 🖥️ Conversión | `auditoria_landing_cro` · `plan_email_sms_whatsapp` |
| 🇨🇴 Colombia | `calendario_comercial_colombia` · `benchmarks_colombia` · `metodos_pago_envios` · `normativa_publicidad` |

---

## Desplegar en Vercel

### Opción 1 — Un clic

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjhontlopez548-coder%2FChat-bot-marketing-IA-&env=ANTHROPIC_API_KEY&envDescription=API%20key%20de%20Anthropic%20(console.anthropic.com)&project-name=vendemas-ia&repository-name=vendemas-ia)

Vercel le pide la variable `ANTHROPIC_API_KEY` durante el proceso. Eso es todo.

### Opción 2 — Importando el repo

1. Entre a [vercel.com/new](https://vercel.com/new) e importe este repositorio.
2. Framework: **Next.js** (se detecta solo). No cambie nada más.
3. En **Environment Variables** agregue:
   | Variable | Valor |
   |---|---|
   | `ANTHROPIC_API_KEY` | Su key de [console.anthropic.com](https://console.anthropic.com) |
4. **Deploy**.

### Opción 3 — Desde la terminal

```bash
npm i -g vercel
vercel login
vercel --prod
vercel env add ANTHROPIC_API_KEY production
```

> ⚠️ **Importante sobre el plan de Vercel:** la ruta `/api/chat` declara `maxDuration = 300`. En el plan Hobby sin Fluid Compute el tope es 60 segundos; si activa **Fluid Compute** (Settings → Functions) llega a los 300. Con respuestas largas y muchas herramientas conviene tenerlo activado.

---

## Correr en local

```bash
git clone https://github.com/jhontlopez548-coder/Chat-bot-marketing-IA-.git
cd Chat-bot-marketing-IA-
npm install
cp .env.example .env.local     # y pegue su ANTHROPIC_API_KEY
npm run dev
```

Abra <http://localhost:3000>.

---

## Variables de entorno

| Variable | Obligatoria | Por defecto | Para qué sirve |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Sí | — | Su API key de Anthropic |
| `ANTHROPIC_MODEL` | No | `claude-opus-5` | Use `claude-sonnet-5` si quiere más velocidad y menos costo |
| `ANTHROPIC_EFFORT` | No | `high` | `low` · `medium` · `high` · `xhigh` · `max` |
| `BUSQUEDA_WEB` | No | `true` | Ponga `false` para desactivar la búsqueda web en vivo |

---

## Cómo está armado

```
app/
  api/chat/route.ts     Streaming SSE + bucle de herramientas
  page.tsx · layout.tsx · globals.css
components/
  Chat.tsx              Estado, streaming y compositor
  Mensaje.tsx           Markdown, tablas y panel de razonamiento
  BarraLateral.tsx      Negocio, contexto y acciones rápidas
  TarjetaHerramienta.tsx
lib/
  system-prompt.ts      Personalidad y dialecto colombiano
  prompts-rapidos.ts    32 acciones rápidas
  tools/definitions.ts  Esquemas de las 26 herramientas
  tools/executors.ts    Lógica real (matemática y plantillas)
  data/colombia.ts      Benchmarks, calendario, pagos, normativa
```

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · `@anthropic-ai/sdk`.

El flujo de una consulta: el navegador abre un stream contra `/api/chat` → el modelo responde en streaming → si pide una herramienta, el servidor la ejecuta y le devuelve el resultado → el modelo lo interpreta y sigue escribiendo. Todo en el mismo stream, sin recargar.

---

## Nota sobre las cifras

Los rangos de CPM, CTR, CPA y ticket que trae la app son **referencias de mercado para planear**, no datos oficiales de Meta. El asistente lo advierte cuando los usa. Los números reales de su cuenta mandan siempre.

Las orientaciones legales (SIC, Habeas Data, IVA, INVIMA) son informativas y no reemplazan asesoría jurídica.

---

## Personalizarlo

- **Cambiar el tono o las reglas del asistente** → `lib/system-prompt.ts`
- **Actualizar benchmarks o fechas comerciales** → `lib/data/colombia.ts`
- **Agregar una herramienta nueva** → agregue el esquema en `lib/tools/definitions.ts` y la función en `lib/tools/executors.ts` (el despachador la toma automáticamente)
- **Agregar acciones rápidas** → `lib/prompts-rapidos.ts`
- **Cambiar colores de marca** → `tailwind.config.ts` (paleta `marca`)
