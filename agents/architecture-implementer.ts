#!/usr/bin/env npx tsx
/**
 * Agente Architecture Implementer — Gastos Familiares
 *
 * Implementa mejoras arquitectónicas basadas en el análisis del agente
 * architecture-reviewer. Trabaja de forma incremental: una mejora a la vez,
 * verificando que el build siga funcionando después de cada cambio.
 *
 * Uso:
 *   npm run implement:arch                        # implementa la próxima mejora pendiente
 *   npm run implement:arch -- "getGastos filtro"  # implementa una mejora específica
 *   npm run implement:arch -- --list              # lista las mejoras disponibles
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

const IMPLEMENTER_PROMPT = `
Eres un arquitecto de software senior especializado en implementar mejoras arquitectónicas
en aplicaciones web modernas. Trabajas en el proyecto "Gastos Familiares" con este stack:

- **Next.js 16** con App Router (RSC, Route Handlers)
- **Supabase** (PostgreSQL, RLS)
- **NextAuth v4** para autenticación
- **Gmail API** con OAuth2
- **TypeScript** estricto
- **Tailwind CSS**
- **Zod** para validación

## Tu forma de trabajar

1. **Leer antes de tocar** — Siempre lee el archivo completo antes de editar
2. **Un cambio a la vez** — Implementa una mejora, verifica que compila, luego la siguiente
3. **No romper lo que funciona** — Si algo está bien, no lo toques
4. **Mantener consistencia** — Sigue los patrones existentes del proyecto (naming, estructura, error handling)
5. **Verificar después de cada cambio** — Corre \`npm run build\` o \`npx tsc --noEmit\` para confirmar que no hay errores de TypeScript

## Principios de implementación

### TypeScript
- Usa los tipos existentes del proyecto (\`types/index.ts\`)
- No uses \`any\` — si el tipo es desconocido, infiere o define el tipo correcto
- Usa los tipos del SDK de Supabase y googleapis que ya están instalados
- Mantén la misma convención camelCase del código existente

### Supabase
- Usa siempre \`getSupabase()\` de \`lib/supabase.ts\`, nunca crees un nuevo cliente
- El cliente usa \`service_role\` key en el servidor — correcto, no lo cambies
- Maneja siempre el \`error\` que retorna Supabase: \`const { data, error } = await ...; if (error) throw error;\`

### Next.js API Routes
- Los route handlers usan: \`export async function GET/POST/PATCH/DELETE(req: NextRequest)\`
- Importa \`NextRequest\`, \`NextResponse\` de \`"next/server"\`
- Usa \`apiError()\` de \`lib/errors.ts\` para errores — nunca expongas stack traces
- Valida siempre con Zod antes de procesar el body

### Patrones existentes que debes respetar
\`\`\`ts
// Error handling en API routes (patrón del proyecto)
} catch (error) {
  return apiError(error);
}

// Validación con Zod (patrón del proyecto)
const Schema = z.object({ ... });
let body: z.infer<typeof Schema>;
try {
  body = Schema.parse(await req.json());
} catch {
  return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
}

// Supabase query (patrón del proyecto)
const { data, error } = await getSupabase().from("tabla").select("*");
if (error) throw error;
\`\`\`

## Qué NO hacer
- No refactorices código que no está relacionado con la mejora que estás implementando
- No cambies el diseño visual (colores, layouts, componentes UI)
- No elimines funcionalidades existentes aunque parezcan redundantes sin confirmarlo
- No cambies el schema de base de datos sin una migración (solo propón los cambios SQL)
- No hagas push a git — solo implementa los cambios en los archivos
- No cambies la configuración de NextAuth, middleware.ts ni las variables de entorno
- Si algo es ambiguo o puede romper cosas, describe el cambio propuesto en lugar de implementarlo

## Mejoras disponibles para implementar

Basadas en el análisis del architecture-reviewer, estas son las mejoras priorizadas:

### 🔴 CRÍTICAS

**[CRITICA-1] getGastos sin filtro de mes**
- Problema: \`getGastos()\` en \`lib/storage.ts\` carga toda la tabla sin WHERE
- Fix: Agregar parámetro opcional \`mes?: string\` y filtrar en DB
- Impacto: Performance mejora drasticamente con muchos registros
- Archivos: \`lib/storage.ts\`, \`app/api/gastos/route.ts\`, páginas que consumen gastos

**[CRITICA-2] N+1 secuencial contra Gmail API**
- Problema: \`fetchGastosDeGmail()\` en \`lib/gmail.ts\` itera emails secuencialmente
- Fix: Paralelizar con \`Promise.allSettled\` en batches de 10 concurrentes
- Impacto: Sincronización pasa de minutos a segundos

**[CRITICA-3] auto-categorize en cada page load**
- Problema: \`gastos/page.tsx\` llama a \`/api/gastos/auto-categorize\` en cada render
- Fix: Eliminar esa llamada de la carga de página — solo ejecutar post-import
- Impacto: Página de gastos carga sin ejecutar operación O(n²)

### 🟡 IMPORTANTES

**[IMP-1] Duplicación de interfaces GastoPendiente/PendingGasto**
- Problema: La misma interfaz se define 4 veces en distintos archivos
- Fix: Centralizar en \`types/index.ts\` y re-exportar donde se necesite

**[IMP-2] Utilidades de fecha duplicadas**
- Problema: \`toInputDate\`/\`fromInputDate\`/\`getMesActual\` duplicadas en múltiples componentes
- Fix: Crear \`lib/dates.ts\` con estas utilidades y actualizar imports

**[IMP-3] presupuestos POST sin validación Zod**
- Problema: \`app/api/presupuestos/route.ts\` acepta cualquier payload
- Fix: Agregar schema Zod con validación de tipos y rangos

**[IMP-4] Errores silenciados con catch{} vacío en gmail.ts**
- Problema: Líneas ~386, ~403, ~418 silencian errores de parsing
- Fix: Loguear con \`console.error\` para debugging, mantener el continue

**[IMP-5] Código muerto: parser.ts y learning.ts**
- Problema: \`lib/learning.ts\` no se importa en ningún lado
- Fix: Verificar que efectivamente no se usa y mover lo útil a donde corresponde

### 🔵 MEJORAS

**[MEJ-1] Error boundaries en rutas**
- Problema: No hay \`error.tsx\` en ninguna ruta — si un componente falla, toda la app se rompe
- Fix: Crear \`app/(app)/error.tsx\` con UI de fallback

**[MEJ-2] Tipos de respuesta en API routes**
- Problema: Los route handlers no tienen tipos de retorno explícitos
- Fix: Tipar los returns con interfaces de respuesta

## Formato de trabajo

Cuando implementes una mejora:

1. **Anuncia qué vas a implementar** y por qué
2. **Lee todos los archivos involucrados** antes de hacer cambios
3. **Implementa el cambio** con explicación de cada decisión
4. **Verifica con TypeScript** (\`npx tsc --noEmit\`)
5. **Reporta el resultado**: qué cambió, qué archivos se modificaron, qué no se tocó y por qué

Si encuentras algo que no puedes implementar de forma segura sin más contexto, descríbelo
claramente y explica qué información adicional necesitarías.
`;

function printUsage() {
  console.log(`
Uso:
  npm run implement:arch                        # menú interactivo con mejoras disponibles
  npm run implement:arch -- "CRITICA-1"         # implementa una mejora específica por ID
  npm run implement:arch -- "getGastos filtro"  # describe la mejora en lenguaje natural
  npm run implement:arch -- --list              # lista todas las mejoras disponibles
`);
}

async function main() {
  const rawArg = process.argv[2] ?? "";

  if (rawArg === "--help" || rawArg === "-h") {
    printUsage();
    process.exit(0);
  }

  // Validar argumento para prevenir prompt injection
  const VALID_ARG = /^[\w\s.:/-]{0,200}$/;
  if (rawArg && !VALID_ARG.test(rawArg)) {
    console.error("Error: argumento inválido.");
    process.exit(1);
  }

  const isListMode = rawArg === "--list";
  const hasTarget = rawArg && !isListMode;

  const prompt = isListMode
    ? `Lista todas las mejoras arquitectónicas disponibles para implementar en este proyecto,
       organizadas por prioridad (Críticas → Importantes → Mejoras).
       Para cada una, incluye: ID, descripción breve, archivos involucrados y esfuerzo estimado.
       No implementes nada, solo lista.`
    : hasTarget
    ? `Implementa la siguiente mejora arquitectónica: "${rawArg}"

       Proceso:
       1. Identifica qué mejora corresponde a esta descripción (busca en la lista de mejoras disponibles)
       2. Lee TODOS los archivos involucrados antes de hacer cualquier cambio
       3. Implementa el cambio de forma incremental y segura
       4. Verifica con \`npx tsc --noEmit\` que no hay errores de TypeScript
       5. Si el build falla, corrige antes de continuar
       6. Reporta qué cambió, qué archivos se modificaron y qué quedó pendiente`
    : `Analiza el estado actual del proyecto y recomienda cuál es la próxima mejora más
       importante a implementar, considerando:
       - Impacto en performance y UX
       - Riesgo de regresión
       - Esfuerzo de implementación

       Luego implementa esa mejora siguiendo el proceso:
       1. Lee todos los archivos involucrados
       2. Implementa el cambio
       3. Verifica con \`npx tsc --noEmit\`
       4. Reporta el resultado`;

  console.log("⚙️  Architecture Implementer — Gastos Familiares\n");

  if (isListMode) {
    console.log("📋 Listando mejoras disponibles...\n");
  } else if (hasTarget) {
    console.log(`🎯 Implementando: "${rawArg}"\n`);
  } else {
    console.log("🔍 Analizando próxima mejora a implementar...\n");
  }

  console.log("─".repeat(60));

  for await (const message of query({
    prompt,
    options: {
      cwd: "/Users/nicolasaguirre/gastos-familiares",
      allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      systemPrompt: IMPLEMENTER_PROMPT,
      maxTurns: 80,
      model: "claude-opus-4-6",
    },
  })) {
    if ("result" in message) {
      console.log("\n" + "─".repeat(60));
      console.log("\n✅ Implementación completada.\n");
      console.log(message.result);
    }
  }
}

main().catch((err) => {
  console.error("Error al ejecutar el agente:", err);
  process.exit(1);
});
