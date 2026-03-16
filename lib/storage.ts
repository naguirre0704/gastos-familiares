import { getSupabase } from "./supabase";
import { Gasto, Comercio, Categoria, Presupuesto, Importacion } from "@/types";

const CATEGORIAS_INICIALES: Categoria[] = [
  { nombre: "Supermercado",    emoji: "🛒", color: "#10B981", presupuestoMensual: 500000, activa: true },
  { nombre: "Bencina",         emoji: "⛽", color: "#F59E0B", presupuestoMensual: 150000, activa: true },
  { nombre: "Restaurante",     emoji: "🍽️", color: "#EF4444", presupuestoMensual: 200000, activa: true },
  { nombre: "Farmacia",        emoji: "💊", color: "#8B5CF6", presupuestoMensual: 80000,  activa: true },
  { nombre: "Entretenimiento", emoji: "🎬", color: "#3B82F6", presupuestoMensual: 100000, activa: true },
  { nombre: "Ropa",            emoji: "👕", color: "#EC4899", presupuestoMensual: 100000, activa: true },
  { nombre: "Educación",       emoji: "📚", color: "#06B6D4", presupuestoMensual: 150000, activa: true },
  { nombre: "Transporte",      emoji: "🚗", color: "#84CC16", presupuestoMensual: 80000,  activa: true },
  { nombre: "Hogar",           emoji: "🏠", color: "#F97316", presupuestoMensual: 100000, activa: true },
  { nombre: "Otros",           emoji: "📦", color: "#6B7280", presupuestoMensual: 200000, activa: true },
];

// ─── Row mappers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toGasto(r: any): Gasto {
  return {
    id: r.id,
    fecha: r.fecha,
    hora: r.hora,
    monto: r.monto,
    comercio: r.comercio,
    categoria: r.categoria ?? "",
    cuenta: r.cuenta ?? "",
    gmailId: r.gmail_id ?? "",
    creadoPor: r.creado_por ?? "",
    notas: r.notas ?? "",
    comentario: r.comentario ?? undefined,
    tipo: r.tipo ?? undefined,
    emoji: r.emoji ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toComercio(r: any): Comercio {
  return {
    comercio: r.comercio,
    categoria: r.categoria,
    vecesUsado: r.veces_usado,
    ultimaVez: r.ultima_vez,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCategoria(r: any): Categoria {
  return {
    nombre: r.nombre,
    emoji: r.emoji,
    color: r.color,
    presupuestoMensual: r.presupuesto_mensual,
    activa: r.activa,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPresupuesto(r: any): Presupuesto {
  return { mes: r.mes, categoria: r.categoria, presupuesto: r.presupuesto };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toImportacion(r: any): Importacion {
  return {
    id: r.id,
    timestamp: r.timestamp,
    cantidad: r.cantidad,
    desdeDate: r.desde_date,
  };
}

// ─── GASTOS ──────────────────────────────────────────────────────────────────

export async function getGastos(): Promise<Gasto[]> {
  const { data, error } = await getSupabase().from("gastos").select("*");
  if (error) throw error;
  return (data ?? []).map(toGasto);
}

export async function appendGasto(gasto: Gasto): Promise<void> {
  const { error } = await getSupabase().from("gastos").insert({
    id: gasto.id,
    fecha: gasto.fecha,
    hora: gasto.hora,
    monto: gasto.monto,
    comercio: gasto.comercio,
    categoria: gasto.categoria ?? "",
    cuenta: gasto.cuenta ?? "",
    gmail_id: gasto.gmailId ?? "",
    creado_por: gasto.creadoPor ?? "",
    notas: gasto.notas ?? "",
    comentario: gasto.comentario ?? null,
    tipo: gasto.tipo ?? null,
    emoji: gasto.emoji ?? null,
  });
  if (error) throw error;
}

export async function updateGastoCategoria(gastoId: string, nuevaCategoria: string): Promise<void> {
  const { error } = await getSupabase()
    .from("gastos")
    .update({ categoria: nuevaCategoria })
    .eq("id", gastoId);
  if (error) throw error;
}

export async function patchGasto(
  gastoId: string,
  fields: Partial<Pick<Gasto, "categoria" | "comentario" | "emoji" | "comercio" | "monto">>
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (fields.categoria  !== undefined) update.categoria  = fields.categoria;
  if (fields.comentario !== undefined) update.comentario = fields.comentario;
  if (fields.emoji      !== undefined) update.emoji      = fields.emoji;
  if (fields.comercio   !== undefined) update.comercio   = fields.comercio;
  if (fields.monto      !== undefined) update.monto      = fields.monto;
  const { error } = await getSupabase().from("gastos").update(update).eq("id", gastoId);
  if (error) throw error;
}

// ─── AUTO-CATEGORIZACIÓN ─────────────────────────────────────────────────────

export async function autoCategorizeGastos(): Promise<number> {
  const gastos = await getGastos();

  const catsPorComercio = new Map<string, Set<string>>();
  for (const g of gastos) {
    if (g.categoria?.trim()) {
      const key = g.comercio.toUpperCase();
      if (!catsPorComercio.has(key)) catsPorComercio.set(key, new Set());
      catsPorComercio.get(key)!.add(g.categoria);
    }
  }

  let count = 0;
  for (const g of gastos) {
    if (g.categoria?.trim()) continue;
    const cats = catsPorComercio.get(g.comercio.toUpperCase());
    if (!cats || cats.size !== 1) continue;
    await getSupabase().from("gastos").update({ categoria: [...cats][0] }).eq("id", g.id);
    count++;
  }
  return count;
}

// ─── COMERCIOS ───────────────────────────────────────────────────────────────

export async function getComercios(): Promise<Comercio[]> {
  const { data, error } = await getSupabase().from("comercios").select("*");
  if (error) throw error;
  return (data ?? []).map(toComercio);
}

export async function upsertComercio(comercio: string, categoria: string, fecha: string): Promise<void> {
  // Fetch current veces_usado to increment it
  const { data } = await getSupabase()
    .from("comercios")
    .select("veces_usado")
    .eq("comercio", comercio)
    .single();

  const { error } = await getSupabase().from("comercios").upsert(
    {
      comercio,
      categoria,
      veces_usado: data ? (data.veces_usado as number) + 1 : 1,
      ultima_vez: fecha,
    },
    { onConflict: "comercio" }
  );
  if (error) throw error;
}

// ─── CATEGORIAS ──────────────────────────────────────────────────────────────

export async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await getSupabase().from("categorias").select("*").order("nombre");
  if (error) throw error;

  if (!data || data.length === 0) {
    // Seed defaults on first run
    const { error: insertErr } = await getSupabase().from("categorias").insert(
      CATEGORIAS_INICIALES.map((c) => ({
        nombre: c.nombre,
        emoji: c.emoji,
        color: c.color,
        presupuesto_mensual: c.presupuestoMensual,
        activa: c.activa,
      }))
    );
    if (insertErr) throw insertErr;
    return CATEGORIAS_INICIALES;
  }

  return data.map(toCategoria);
}

export async function appendCategoria(categoria: Omit<Categoria, "activa">): Promise<void> {
  const { error } = await getSupabase().from("categorias").insert({
    nombre: categoria.nombre,
    emoji: categoria.emoji,
    color: categoria.color,
    presupuesto_mensual: categoria.presupuestoMensual,
    activa: true,
  });
  if (error) throw error;
}

export async function updateCategoria(nombre: string, presupuesto: number, emoji?: string): Promise<void> {
  const update: Record<string, unknown> = { presupuesto_mensual: presupuesto };
  if (emoji) update.emoji = emoji;
  const { error } = await getSupabase().from("categorias").update(update).eq("nombre", nombre);
  if (error) throw error;
}

export async function renameCategoria(nombreViejo: string, nombreNuevo: string): Promise<void> {
  // PostgreSQL allows updating a TEXT primary key when there are no FK constraints
  await getSupabase().from("gastos").update({ categoria: nombreNuevo }).eq("categoria", nombreViejo);
  await getSupabase().from("comercios").update({ categoria: nombreNuevo }).eq("categoria", nombreViejo);
  await getSupabase().from("presupuestos").update({ categoria: nombreNuevo }).eq("categoria", nombreViejo);
  const { error } = await getSupabase()
    .from("categorias")
    .update({ nombre: nombreNuevo })
    .eq("nombre", nombreViejo);
  if (error) throw error;
}

export async function deleteCategoria(nombre: string): Promise<void> {
  await getSupabase().from("gastos").update({ categoria: "" }).eq("categoria", nombre);
  await getSupabase().from("comercios").update({ categoria: "" }).eq("categoria", nombre);
  await getSupabase().from("presupuestos").delete().eq("categoria", nombre);
  const { error } = await getSupabase().from("categorias").delete().eq("nombre", nombre);
  if (error) throw error;
}

// ─── PRESUPUESTOS ─────────────────────────────────────────────────────────────

export async function getPresupuestos(): Promise<Presupuesto[]> {
  const { data, error } = await getSupabase().from("presupuestos").select("*");
  if (error) throw error;
  return (data ?? []).map(toPresupuesto);
}

export async function upsertPresupuesto(mes: string, categoria: string, presupuesto: number): Promise<void> {
  const { error } = await getSupabase()
    .from("presupuestos")
    .upsert({ mes, categoria, presupuesto }, { onConflict: "mes,categoria" });
  if (error) throw error;
}

// ─── IMPORTACIONES ────────────────────────────────────────────────────────────

export async function getImportaciones(): Promise<Importacion[]> {
  const { data, error } = await getSupabase()
    .from("importaciones")
    .select("*")
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toImportacion);
}

export async function appendImportacion(imp: Importacion): Promise<void> {
  const { error } = await getSupabase().from("importaciones").insert({
    id: imp.id,
    timestamp: imp.timestamp,
    cantidad: imp.cantidad,
    desde_date: imp.desdeDate,
  });
  if (error) throw error;
}

export async function getUltimaImportacion(): Promise<Importacion | null> {
  const { data, error } = await getSupabase()
    .from("importaciones")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return toImportacion(data);
}
