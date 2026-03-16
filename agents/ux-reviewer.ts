#!/usr/bin/env npx tsx
/**
 * Agente UX/UI — Gastos Familiares
 *
 * Revisa que los componentes de UI sean consistentes con el design system
 * del proyecto y las buenas prácticas de UX.
 *
 * Uso:
 *   npm run review:ui                      # revisa todos los componentes
 *   npm run review:ui -- components/GastosList.tsx  # revisa un archivo específico
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

const DESIGN_SYSTEM_PROMPT = `
Eres un experto en UX/UI especializado en revisar código React/Next.js con Tailwind CSS.

## Design System de este proyecto (Gastos Familiares)

### Paleta de colores
- **Primario**: blue-600 (#2563EB), hover: blue-700, active: blue-800
- **Peligro**: red-500, hover: red-600
- **Fondo de página**: gray-50 (#F9FAFB)
- **Fondo de tarjetas**: white
- **Texto principal**: gray-900 (#111827)
- **Texto secundario**: gray-500 / gray-600
- **Bordes**: gray-100 / gray-200

### Componentes base
- **Button**: variantes primary | secondary | ghost | danger; tamaños sm | md | lg
  - Bordes: rounded-xl
  - Focus: ring-2 ring-blue-500
  - Disabled: opacity-50 cursor-not-allowed
- **Card**: rounded-2xl shadow-sm border border-gray-100 bg-white
  - Padding: p-4 (sm) | p-5 (md) | p-6 (lg)
- **Modal**: rounded-2xl shadow-xl, backdrop-blur-sm bg-black/40, max-w-md
- **Badge**: componente Badge en components/ui/
- **Tipografía**: font-bold para títulos, font-medium para botones/labels

### Patrones de UX requeridos
1. Feedback visual en interacciones (hover, active, focus states)
2. Estados disabled con opacity-50
3. Mensajes de error en rojo (red-*), éxito en verde (green-*)
4. Accesibilidad: aria-label en botones icon-only, roles semánticos
5. Loading states: skeleton o spinner cuando haya operaciones async
6. Formularios: labels visibles, validación con mensajes claros
7. Responsive: diseño mobile-first, sin overflow horizontal
8. Consistencia: no usar colores o estilos ad-hoc fuera del design system

### Lo que debes revisar
- Inconsistencias con el design system (colores, bordes, sombras hardcodeados)
- Falta de estados de interacción (hover/focus/active/disabled)
- Problemas de accesibilidad
- Código duplicado que debería usar componentes base
- Textos hardcodeados en inglés (el proyecto es en español)
- Problemas de responsive design
- Falta de feedback al usuario (loading, error, empty states)

## Formato de respuesta
Para cada archivo revisado, estructura tu respuesta así:

### 📄 [nombre del archivo]
**Estado**: ✅ OK | ⚠️ Advertencias | ❌ Problemas

**Problemas encontrados:**
- [descripción + línea aproximada + sugerencia de fix]

**Recomendaciones:**
- [mejoras opcionales]

Al final, un resumen con el estado general y los 3 cambios más prioritarios.
`;

async function main() {
  const targetPath = process.argv[2] ?? ".";
  const isSpecificFile = targetPath.endsWith(".tsx") || targetPath.endsWith(".ts");

  const prompt = isSpecificFile
    ? `Revisa este archivo de UI: ${targetPath}

       Lee el archivo, analízalo contra el design system del proyecto y reporta todos los problemas encontrados.`
    : `Revisa todos los componentes de UI del proyecto.

       1. Busca todos los archivos .tsx en components/ y en app/ (excluyendo node_modules, .next)
       2. Lee cada componente y página
       3. Analiza cada uno contra el design system
       4. Genera un reporte completo con todos los problemas encontrados

       Empieza por los archivos en components/ y luego revisa las páginas en app/.`;

  console.log("🔍 Iniciando revisión UX/UI...\n");
  if (isSpecificFile) {
    console.log(`📄 Archivo: ${targetPath}\n`);
  } else {
    console.log("📂 Revisando todos los componentes...\n");
  }
  console.log("─".repeat(60));

  for await (const message of query({
    prompt,
    options: {
      cwd: "/home/user/gastos-familiares",
      allowedTools: ["Read", "Glob", "Grep"],
      systemPrompt: DESIGN_SYSTEM_PROMPT,
      maxTurns: 30,
      model: "claude-opus-4-6",
    },
  })) {
    if ("result" in message) {
      console.log("\n" + "─".repeat(60));
      console.log("\n✅ Revisión completada.\n");
      console.log(message.result);
    }
  }
}

main().catch((err) => {
  console.error("Error al ejecutar el agente:", err);
  process.exit(1);
});
