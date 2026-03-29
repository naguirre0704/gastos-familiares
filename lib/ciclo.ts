import { Ciclo } from "@/types";

/** DD/MM/YYYY → YYYYMMDD para comparación lexicográfica */
function toComparable(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split("/");
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy}${mm.padStart(2, "0")}${dd.padStart(2, "0")}`;
}

/**
 * Dado el fecha DD/MM/YYYY de un gasto y la lista de ciclos,
 * devuelve el mes del ciclo de facturación al que pertenece (YYYY-MM).
 * Si no hay ciclo activo antes de esa fecha, usa el mes calendario.
 */
export function getCicloMes(fecha: string, ciclos: Ciclo[]): string {
  const parts = fecha.split("/");
  if (parts.length !== 3) return "";
  const [dd, mm, yyyy] = parts;

  const sorted = [...ciclos].sort((a, b) =>
    toComparable(a.fechaInicio).localeCompare(toComparable(b.fechaInicio))
  );

  const comp = toComparable(fecha);
  let activeCiclo: Ciclo | null = null;

  for (const ciclo of sorted) {
    if (toComparable(ciclo.fechaInicio) <= comp) {
      activeCiclo = ciclo;
    } else {
      break;
    }
  }

  if (activeCiclo) return activeCiclo.mes;
  return `${yyyy}-${mm.padStart(2, "0")}`;
}

/** Devuelve el mes del ciclo activo actual (YYYY-MM). */
export function getMesActualConCiclos(ciclos: Ciclo[]): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  return getCicloMes(`${dd}/${mm}/${yyyy}`, ciclos);
}

/**
 * Devuelve el label YYYY-MM que le correspondería al próximo ciclo si se
 * renueva hoy. Es el mes calendario siguiente al ciclo activo actual.
 */
export function getProximoCicloMes(ciclos: Ciclo[]): string {
  const mesActual = getMesActualConCiclos(ciclos);
  const [yyyy, mm] = mesActual.split("-").map(Number);
  const next = new Date(yyyy, mm, 1); // primer día del mes siguiente
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}
