"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { BudgetBar } from "@/components/BudgetBar";
import { GastosList } from "@/components/GastosList";
import { SyncButton } from "@/components/SyncButton";
import { CategoryModal } from "@/components/CategoryModal";
import { RenovarMesButton } from "@/components/RenovarMesButton";
import { Gasto, Categoria, ResumenCategoria, Ciclo } from "@/types";
import { getCicloMes, getMesActualConCiclos } from "@/lib/ciclo";
import { formatMonedaChile } from "@/lib/parser";

interface PendingGasto {
  gmailId: string;
  monto: number;
  comercio: string;
  fecha: string;
  hora: string;
  cuenta: string;
}

function getMesActual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function filtrarMes(gastos: Gasto[], mes: string, ciclos: Ciclo[]) {
  return gastos.filter((g) => {
    if (!g.fecha) return false;
    return getCicloMes(g.fecha, ciclos) === mes;
  });
}

export default function DashboardPage() {
  useSession();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingGastos, setPendingGastos] = useState<PendingGasto[]>([]);
  const [currentPending, setCurrentPending] = useState<PendingGasto | null>(null);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [mesFiltro, setMesFiltro] = useState(getMesActual());
  const initialMesFijado = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const [gastosRes, catsRes, ciclosRes] = await Promise.all([
        fetch("/api/gastos"),
        fetch("/api/categorias"),
        fetch("/api/ciclos"),
      ]);
      const gastosData = await gastosRes.json();
      const catsData = await catsRes.json();
      const ciclosData = await ciclosRes.json();
      if (gastosData.gastos) setGastos(gastosData.gastos);
      if (catsData.categorias) setCategorias(catsData.categorias);
      const fetchedCiclos: Ciclo[] = ciclosData.ciclos ?? [];
      setCiclos(fetchedCiclos);
      if (!initialMesFijado.current) {
        setMesFiltro(getMesActualConCiclos(fetchedCiclos));
        initialMesFijado.current = true;
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSync = useCallback(async () => {
    const res = await fetch("/api/gmail/sync", { method: "POST" });
    const data = await res.json();
    if (data.sinCategoria?.length > 0) {
      setPendingGastos(data.sinCategoria);
      setCurrentPending(data.sinCategoria[0]);
    }
    await fetchData();
  }, [fetchData]);

  async function handleCategorize(
    gasto: PendingGasto,
    categoria: string,
    recordar: boolean
  ) {
    await fetch("/api/gastos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...gasto, categoria, recordarComercio: recordar }),
    });
    await fetchData();

    const remaining = pendingGastos.filter((p) => p.gmailId !== gasto.gmailId);
    setPendingGastos(remaining);
    setCurrentPending(remaining.length > 0 ? remaining[0] : null);
  }

  async function handleEditCategoria(gasto: Gasto) {
    setEditingGasto(gasto);
  }

  async function handleConfirmEdit(
    pendingGasto: PendingGasto,
    categoria: string,
    recordar: boolean,
    comentario: string
  ) {
    if (!editingGasto) return;
    await fetch("/api/gastos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingGasto.id,
        categoria,
        comentario: comentario || undefined,
        comercio: editingGasto.comercio,
        fecha: pendingGasto.fecha,
        recordarComercio: recordar,
      }),
    });
    await fetchData();
    setEditingGasto(null);
  }

  // ─── Meses disponibles (solo meses con al menos un gasto) ────────────────

  const mesesDisponibles = Array.from(
    new Set([
      ...gastos
        .filter((g) => g.fecha && g.fecha.split("/").length === 3)
        .map((g) => getCicloMes(g.fecha, ciclos)),
      getMesActualConCiclos(ciclos), // siempre incluir el ciclo activo
    ])
  ).sort();

  const idxMes = mesesDisponibles.indexOf(mesFiltro);
  const puedePrev = idxMes > 0;
  const puedeNext = idxMes < mesesDisponibles.length - 1;

  // ─── Compute summaries ────────────────────────────────────────────────────

  const gastosDelMes = filtrarMes(gastos, mesFiltro, ciclos);
  const totalGastado = gastosDelMes.reduce((s, g) => s + g.monto, 0);
  const totalPresupuestado = categorias
    .filter((c) => c.activa)
    .reduce((s, c) => s + c.presupuestoMensual, 0);
  const porcentajeGeneral =
    totalPresupuestado > 0
      ? Math.round((totalGastado / totalPresupuestado) * 100)
      : 0;
  const sinCategoria = gastosDelMes.filter((g) => !g.categoria).length;

  const resumenes: ResumenCategoria[] = categorias
    .filter((c) => c.activa)
    .map((cat) => {
      const gastado = gastosDelMes
        .filter((g) => g.categoria === cat.nombre)
        .reduce((s, g) => s + g.monto, 0);
      return {
        categoria: cat,
        gastado,
        presupuesto: cat.presupuestoMensual,
        porcentaje: cat.presupuestoMensual > 0
          ? Math.round((gastado / cat.presupuestoMensual) * 100)
          : 0,
      };
    })
    .filter((r) => r.gastado > 0 || r.presupuesto > 0)
    .sort((a, b) => b.porcentaje - a.porcentaje);

  const ultimosGastos = [...gastosDelMes]
    .sort((a, b) => {
      const da = a.fecha.split("/").reverse().join("") + a.hora;
      const db = b.fecha.split("/").reverse().join("") + b.hora;
      return db.localeCompare(da);
    })
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const [year, month] = mesFiltro.split("-");
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString("es-CL", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 capitalize">{monthName}</h1>
          <p className="text-sm text-gray-500">Dashboard de gastos</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => puedePrev && setMesFiltro(mesesDisponibles[idxMes - 1])}
              disabled={!puedePrev}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <button
              onClick={() => puedeNext && setMesFiltro(mesesDisponibles[idxMes + 1])}
              disabled={!puedeNext}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>
          <RenovarMesButton ciclos={ciclos} onCicloCreado={fetchData} />
          <SyncButton onSync={handleSync} />
        </div>
      </div>

      {/* Sin categoría alert */}
      {sinCategoria > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {sinCategoria} gasto{sinCategoria > 1 ? "s" : ""} sin categorizar
            </p>
            <p className="text-xs text-amber-600">Sincroniza para categorizarlos</p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm" className="text-center">
          <p className="text-xs text-gray-500 mb-1">Gastado</p>
          <p className="text-base font-bold text-gray-900 truncate">
            {formatMonedaChile(totalGastado)}
          </p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-xs text-gray-500 mb-1">Presupuesto</p>
          <p className="text-base font-bold text-gray-900 truncate">
            {formatMonedaChile(totalPresupuestado)}
          </p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-xs text-gray-500 mb-1">Uso</p>
          <p
            className={`text-base font-bold truncate ${
              porcentajeGeneral > 100 ? "text-red-600" : "text-blue-600"
            }`}
          >
            {porcentajeGeneral}%
          </p>
        </Card>
      </div>

      {/* Budget bars */}
      <Card>
        <h2 className="text-sm font-bold text-gray-900 mb-4">Presupuesto por categoría</h2>
        {resumenes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Sin datos este mes. Sincroniza Gmail para importar gastos.
          </p>
        ) : (
          <div className="space-y-4">
            {resumenes.map((r) => (
              <BudgetBar key={r.categoria.nombre} resumen={r} />
            ))}
          </div>
        )}
      </Card>

      {/* Recent expenses */}
      <Card>
        <h2 className="text-sm font-bold text-gray-900 mb-4">Últimos gastos</h2>
        <GastosList
          gastos={ultimosGastos}
          categorias={categorias}
          onEditCategoria={handleEditCategoria}
        />
      </Card>

      {/* Category modal for new gastos */}
      <CategoryModal
        gasto={currentPending}
        categorias={categorias}
        onConfirm={handleCategorize}
        onClose={() => {
          const remaining = pendingGastos.slice(1);
          setPendingGastos(remaining);
          setCurrentPending(remaining.length > 0 ? remaining[0] : null);
        }}
      />

      {/* Category modal for editing */}
      <CategoryModal
        gasto={
          editingGasto
            ? {
                gmailId: editingGasto.gmailId,
                monto: editingGasto.monto,
                comercio: editingGasto.comercio,
                fecha: editingGasto.fecha,
                hora: editingGasto.hora,
                cuenta: editingGasto.cuenta,
              }
            : null
        }
        categorias={categorias}
        onConfirm={handleConfirmEdit}
        onClose={() => setEditingGasto(null)}
      />
    </div>
  );
}
