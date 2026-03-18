#!/usr/bin/env npx tsx
/**
 * Agente Architecture Reviewer — Gastos Familiares
 *
 * Revisa la arquitectura del proyecto y propone mejoras sin implementarlas.
 * Es experto en el stack específico de este proyecto:
 * Next.js App Router, Supabase, NextAuth, Gmail OAuth, TypeScript.
 *
 * Uso:
 *   npm run review:arch                        # revisión completa
 *   npm run review:arch -- lib/gmail.ts        # revisa un módulo específico
 *   npm run review:arch -- app/api/            # revisa una carpeta específica
 */

import { query } from "@anthropic-ai/claude-agent-sdk";

const ARCHITECTURE_PROMPT = `
Eres un experto en arquitectura de software especializado en aplicaciones web modernas con el siguiente stack:
- **Next.js 16** con App Router (RSC, Server Actions, Route Handlers)
- **Supabase** (PostgreSQL, RLS, Storage)
- **NextAuth v4** para autenticación
- **Gmail API** con OAuth2 y tokens encriptados
- **TypeScript** estricto
- **Tailwind CSS** para estilos

## Contexto del proyecto: Gastos Familiares

Aplicación web para gestión de gastos personales/familiares que:
1. Autentica usuarios vía NextAuth (Google OAuth)
2. Conecta con Gmail del usuario para importar gastos automáticamente desde correos del Banco de Chile
3. Parsea correos de compras, transferencias y pagos SERVIPAG
4. Permite categorizar, editar y presupuestar los gastos
5. Almacena todo en Supabase con Row Level Security

### Estructura clave del proyecto
- \`app/\` — Next.js App Router (páginas, layouts, API routes)
- \`app/api/gmail/\` — Pipeline de importación: auth → callback → sync → import
- \`components/\` — Componentes React del cliente
- \`lib/gmail.ts\` — Lógica central de Gmail: OAuth, fetch, parsing
- \`lib/supabase.ts\` — Cliente Supabase
- \`types/index.ts\` — Tipos compartidos
- \`supabase/schema.sql\` — Esquema de base de datos

### Patrones actuales del proyecto
- Tokens Gmail encriptados con AES-256-GCM antes de guardar en Supabase
- API routes usan service_role key (bypass RLS) desde el servidor
- Categorización automática por historial de comercios
- Import pipeline con deduplicación por gmailId
- Modelos: Gasto, Categoria, Comercio, Presupuesto, Importacion, GmailToken

## Tu rol

Eres un arquitecto senior. Tu trabajo es:
1. **Identificar problemas arquitectónicos** que afecten mantenibilidad, escalabilidad, seguridad o rendimiento
2. **Proponer mejoras concretas** con justificación técnica clara
3. **Priorizar** por impacto real en el proyecto (no gold-plating)
4. **NO implementar** los cambios — solo analizar y proponer

## Áreas de análisis

### 1. Separación de responsabilidades
- ¿Los módulos tienen responsabilidades claras y acotadas?
- ¿Hay lógica de negocio mezclada con lógica de presentación o de infraestructura?
- ¿Los API routes son thin controllers o contienen demasiada lógica?

### 2. Manejo de errores y resiliencia
- ¿Los errores se propagan correctamente o se pierden silenciosamente?
- ¿Hay manejo de fallos en integraciones externas (Gmail, Supabase)?
- ¿Los errores devueltos al cliente son informativos pero no exponen internos?

### 3. Tipado y contratos
- ¿Los tipos reflejan el dominio o son demasiado genéricos?
- ¿Hay tipos duplicados o inconsistentes entre frontend y backend?
- ¿Se usan Zod u otras validaciones en los límites del sistema?

### 4. Seguridad
- ¿Los endpoints de API validan inputs correctamente?
- ¿Hay riesgo de injection o exposición de datos sensibles?
- ¿La gestión de tokens OAuth es segura?
- ¿El uso de service_role key está bien protegido?

### 5. Rendimiento y eficiencia
- ¿Hay N+1 queries o llamadas redundantes a la DB?
- ¿Se aprovecha el caching de Next.js (fetch cache, unstable_cache)?
- ¿Las operaciones costosas bloquean el thread principal?

### 6. Estructura y organización
- ¿La estructura de carpetas es intuitiva y escalable?
- ¿Hay código duplicado que debería estar en utilidades compartidas?
- ¿Las convenciones de naming son consistentes?

### 7. Flujos de datos
- ¿El flujo de datos es predecible (unidireccional)?
- ¿Los componentes de servidor y cliente están bien delimitados?
- ¿El estado del cliente está bien gestionado?

## Formato de respuesta

Para cada área o módulo analizado:

### 🏗️ [Área / Módulo]
**Diagnóstico**: [Descripción del estado actual]

**Problemas identificados:**
- 🔴 **[Crítico]** Descripción + por qué es un problema + archivo:línea aproximada
- 🟡 **[Importante]** Descripción + por qué es un problema
- 🔵 **[Mejora]** Descripción + beneficio esperado

**Propuesta de mejora:**
\`\`\`
Descripción concreta de cómo debería ser la arquitectura mejorada
(pseudocódigo, estructura de carpetas, interfaces, etc.)
\`\`\`

Al final, un **resumen ejecutivo** con:
1. Los 3 problemas más críticos a resolver primero
2. Las 3 mejoras de mayor impacto a largo plazo
3. Lo que está bien y no debe cambiarse
`;

async function main() {
  const rawArg = process.argv[2] ?? ".";

  // Validar argumento para prevenir path injection
  const VALID_PATH = /^[\w./-]+$/;
  if (rawArg !== "." && !VALID_PATH.test(rawArg)) {
    console.error("Error: ruta inválida.");
    process.exit(1);
  }

  const targetPath = rawArg;
  const isSpecific = targetPath !== ".";

  const prompt = isSpecific
    ? `Analiza la arquitectura de este módulo/carpeta: ${targetPath}

       1. Lee el archivo o archivos en la ruta especificada
       2. Lee también los archivos relacionados que necesites para entender el contexto (tipos, dependencias, etc.)
       3. Analiza la arquitectura del módulo y sus interacciones con el resto del sistema
       4. Propón mejoras arquitectónicas concretas sin implementarlas`
    : `Realiza una revisión arquitectónica completa del proyecto.

       Sigue este orden de análisis:
       1. Lee types/index.ts — contratos del dominio
       2. Lee supabase/schema.sql — modelo de datos
       3. Lee lib/gmail.ts — módulo más complejo del sistema
       4. Lee lib/supabase.ts — capa de acceso a datos
       5. Lee los API routes en app/api/ (gmail/sync, gmail/import, gastos, categorias)
       6. Lee los componentes principales en components/
       7. Lee el middleware y configuración de autenticación
       8. Revisa la estructura general de carpetas

       Para cada área, identifica problemas arquitectónicos y propón mejoras.
       Finaliza con un resumen ejecutivo priorizado.`;

  console.log("🏗️  Architecture Reviewer — Gastos Familiares\n");
  if (isSpecific) {
    console.log(`📂 Módulo: ${targetPath}\n`);
  } else {
    console.log("📂 Revisión completa del proyecto...\n");
  }
  console.log("─".repeat(60));

  for await (const message of query({
    prompt,
    options: {
      cwd: "/Users/nicolasaguirre/gastos-familiares",
      allowedTools: ["Read", "Glob", "Grep"],
      systemPrompt: ARCHITECTURE_PROMPT,
      maxTurns: 40,
      model: "claude-opus-4-6",
    },
  })) {
    if ("result" in message) {
      console.log("\n" + "─".repeat(60));
      console.log("\n✅ Revisión arquitectónica completada.\n");
      console.log(message.result);
    }
  }
}

main().catch((err) => {
  console.error("Error al ejecutar el agente:", err);
  process.exit(1);
});
