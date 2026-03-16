import { promises as fs } from "fs";
import path from "path";
import { Gasto, Comercio, Categoria, Presupuesto } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

const CATEGORIAS_INICIALES: Categoria[] = [
  { nombre: "Supermercado", emoji: "🛒", color: "#10B981", presupuestoMensual: 500000, activa: true },
  { nombre: "Bencina", emoji: "⛽", color: "#F59E0B", presupuestoMensual: 150000, activa: true },
  { nombre: "Restaurante", emoji: "🍽️", color: "#EF4444", presupuestoMensual: 200000, activa: true },
  { nombre: "Farmacia", emoji: "💊", color: "#8B5CF6", presupuestoMensual: 80000, activa: true },
  { nombre: "Entretenimiento", emoji: "🎬", color: "#3B82F6", presupuestoMensual: 100000, activa: true },
  { nombre: "Ropa", emoji: "👕", color: "#EC4899", presupuestoMensual: 100000, activa: true },
  { nombre: "Educación", emoji: "📚", color: "#06B6D4", presupuestoMensual: 150000, activa: true },
  { nombre: "Transporte", emoji: "🚗", color: "#84CC16", presupuestoMensual: 80000, activa: true },
  { nombre: "Hogar", emoji: "🏠", color: "#F97316", presupuestoMensual: 100000, activa: true },
  { nombre: "Otros", emoji: "📦", color: "#6B7280", presupuestoMensual: 200000, activa: true },
];

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, defaultVal: T): Promise<T> {
  try {
    const content = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return defaultVal;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDir();
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ─── GASTOS ──────────────────────────────────────────────────────────────────

export async function getGastos(): Promise<Gasto[]> {
  return readJson<Gasto[]>("gastos.json", []);
}

export async function appendGasto(gasto: Gasto): Promise<void> {
  const gastos = await getGastos();
  gastos.push(gasto);
  await writeJson("gastos.json", gastos);
}

export async function updateGastoCategoria(gastoId: string, nuevaCategoria: string): Promise<void> {
  const gastos = await getGastos();
  const idx = gastos.findIndex((g) => g.id === gastoId);
  if (idx !== -1) {
    gastos[idx].categoria = nuevaCategoria;
    await writeJson("gastos.json", gastos);
  }
}

export async function patchGasto(
  gastoId: string,
  fields: Partial<Pick<import("@/types").Gasto, "categoria" | "comentario" | "emoji" | "comercio" | "monto">>
): Promise<void> {
  const gastos = await getGastos();
  const idx = gastos.findIndex((g) => g.id === gastoId);
  if (idx !== -1) {
    Object.assign(gastos[idx], fields);
    await writeJson("gastos.json", gastos);
  }
}

// ─── COMERCIOS ───────────────────────────────────────────────────────────────

export async function getComercios(): Promise<Comercio[]> {
  return readJson<Comercio[]>("comercios.json", []);
}

export async function upsertComercio(
  comercio: string,
  categoria: string,
  fecha: string
): Promise<void> {
  const comercios = await getComercios();
  const idx = comercios.findIndex((c) => c.comercio === comercio);
  if (idx === -1) {
    comercios.push({ comercio, categoria, vecesUsado: 1, ultimaVez: fecha });
  } else {
    comercios[idx].categoria = categoria;
    comercios[idx].vecesUsado += 1;
    comercios[idx].ultimaVez = fecha;
  }
  await writeJson("comercios.json", comercios);
}

// ─── CATEGORIAS ──────────────────────────────────────────────────────────────

export async function getCategorias(): Promise<Categoria[]> {
  const cats = await readJson<Categoria[]>("categorias.json", []);
  if (cats.length === 0) {
    await writeJson("categorias.json", CATEGORIAS_INICIALES);
    return CATEGORIAS_INICIALES;
  }
  return cats;
}

export async function appendCategoria(categoria: Omit<Categoria, "activa">): Promise<void> {
  const cats = await getCategorias();
  cats.push({ ...categoria, activa: true });
  await writeJson("categorias.json", cats);
}

export async function updateCategoria(nombre: string, presupuesto: number, emoji?: string): Promise<void> {
  const cats = await getCategorias();
  const idx = cats.findIndex((c) => c.nombre === nombre);
  if (idx !== -1) {
    cats[idx].presupuestoMensual = presupuesto;
    if (emoji) cats[idx].emoji = emoji;
    await writeJson("categorias.json", cats);
  }
}

export async function renameCategoria(nombreViejo: string, nombreNuevo: string): Promise<void> {
  const cats = await getCategorias();
  const idx = cats.findIndex((c) => c.nombre === nombreViejo);
  if (idx !== -1) {
    cats[idx].nombre = nombreNuevo;
    await writeJson("categorias.json", cats);
  }
  const gastos = await getGastos();
  await writeJson("gastos.json", gastos.map((g) => g.categoria === nombreViejo ? { ...g, categoria: nombreNuevo } : g));
  const comercios = await getComercios();
  await writeJson("comercios.json", comercios.map((c) => c.categoria === nombreViejo ? { ...c, categoria: nombreNuevo } : c));
  const presupuestos = await getPresupuestos();
  await writeJson("presupuestos.json", presupuestos.map((p) => p.categoria === nombreViejo ? { ...p, categoria: nombreNuevo } : p));
}

export async function deleteCategoria(nombre: string): Promise<void> {
  const cats = await getCategorias();
  await writeJson("categorias.json", cats.filter((c) => c.nombre !== nombre));
  const gastos = await getGastos();
  await writeJson("gastos.json", gastos.map((g) => g.categoria === nombre ? { ...g, categoria: "" } : g));
  const comercios = await getComercios();
  await writeJson("comercios.json", comercios.map((c) => c.categoria === nombre ? { ...c, categoria: "" } : c));
  const presupuestos = await getPresupuestos();
  await writeJson("presupuestos.json", presupuestos.filter((p) => p.categoria !== nombre));
}

// ─── PRESUPUESTOS ─────────────────────────────────────────────────────────────

export async function getPresupuestos(): Promise<Presupuesto[]> {
  return readJson<Presupuesto[]>("presupuestos.json", []);
}

export async function upsertPresupuesto(
  mes: string,
  categoria: string,
  presupuesto: number
): Promise<void> {
  const presupuestos = await getPresupuestos();
  const idx = presupuestos.findIndex((p) => p.mes === mes && p.categoria === categoria);
  if (idx === -1) {
    presupuestos.push({ mes, categoria, presupuesto });
  } else {
    presupuestos[idx].presupuesto = presupuesto;
  }
  await writeJson("presupuestos.json", presupuestos);
}
