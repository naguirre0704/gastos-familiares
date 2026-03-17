"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { GastosList } from "@/components/GastosList";
import { CategoryModal } from "@/components/CategoryModal";
import { TransferenciaModal } from "@/components/TransferenciaModal";
import { NuevoGastoModal } from "@/components/NuevoGastoModal";
import { Gasto, Categoria } from "@/types";

function getMesActual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getAvailableMonths(gastos: Gasto[]): string[] {
  const set = new Set<string>();
  for (const g of gastos) {
    const parts = g.fecha?.split("/");
    if (parts?.length === 3) {
      set.add(`${parts[2]}-${parts[1]}`);
    }
  }
  return Array.from(set).sort().reverse();
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesFiltro, setMesFiltro] = useState(getMesActual());
  const [catFiltro, setCatFiltro] = useState("");
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
  const [nuevoGastoOpen, setNuevoGastoOpen] = useState(false);

  const editingTransferencia = editingGasto?.tipo === "transferencia" ? editingGasto : null;
  const editingCompra = editingGasto?.tipo !== "transferencia" ? editingGasto : null;

  const fetchData = useCallback(async () => {
    // Auto-categorize first so the fetched list is already up to date
    await fetch("/api/gastos/auto-categorize", { method: "POST" });
    const [gastosRes, catsRes] = await Promise.all([
      fetch("/api/gastos"),
      fetch("/api/categorias"),
    ]);
    const gastosData = await gastosRes.json();
    const catsData = await catsRes.json();
    if (gastosData.gastos) setGastos(gastosData.gastos);
    if (catsData.categorias) setCategorias(catsData.categorias);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const months = getAvailableMonths(gastos);

  const SIN_CAT = "__sin_categoria__";

  // Reset "sin categoría" filter if the selected month has none
  useEffect(() => {
    if (catFiltro === SIN_CAT) setCatFiltro("");
  }, [mesFiltro]); // eslint-disable-line react-hooks/exhaustive-deps

  const gastosMes = gastos.filter((g) => {
    const parts = g.fecha?.split("/");
    if (!parts || parts.length !== 3) return false;
    return `${parts[2]}-${parts[1]}` === mesFiltro;
  });

  const sinCategoriaCount = gastosMes.filter((g) => !g.categoria).length;

  const filtered = gastosMes
    .filter((g) => {
      if (catFiltro === SIN_CAT) return !g.categoria;
      if (catFiltro) return g.categoria === catFiltro;
      return true;
    })
    .sort((a, b) => {
      const da = a.fecha.split("/").reverse().join("") + a.hora;
      const db = b.fecha.split("/").reverse().join("") + b.hora;
      return db.localeCompare(da);
    });

  const totalFiltrado = filtered.reduce((s, g) => s + g.monto, 0);

  async function handleConfirmTransferencia(
    id: string,
    fields: { fecha: string; emoji?: string; comercio: string; monto: number; categoria: string; comentario?: string }
  ) {
    await fetch("/api/gastos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
    await fetchData();
    setEditingGasto(null);
  }

  async function handleConfirmEdit(
    pendingGasto: { fecha: string },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Gastos</h1>
        <p className="text-sm text-gray-500">Lista completa de gastos</p>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex gap-3">
          <select
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map((m) => {
              const [y, mo] = m.split("-");
              const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString("es-CL", {
                month: "long",
                year: "numeric",
              });
              return (
                <option key={m} value={m} className="capitalize">
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </option>
              );
            })}
          </select>

          <select
            value={catFiltro}
            onChange={(e) => setCatFiltro(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {sinCategoriaCount > 0 && (
              <option value={SIN_CAT}>Sin categoría ({sinCategoriaCount})</option>
            )}
            {categorias
              .filter((c) => c.activa)
              .map((c) => (
                <option key={c.nombre} value={c.nombre}>
                  {c.emoji} {c.nombre}
                </option>
              ))}
          </select>
        </div>
      </Card>

      {/* Total */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-gray-500">{filtered.length} gastos</span>
        <span className="font-bold text-gray-900">
          Total: ${totalFiltrado.toLocaleString("es-CL")}
        </span>
      </div>

      {/* List */}
      <Card padding="sm">
        <GastosList
          gastos={filtered}
          categorias={categorias}
          onEditCategoria={setEditingGasto}
        />
      </Card>

      <CategoryModal
        gasto={
          editingCompra
            ? {
                gmailId: editingCompra.gmailId,
                monto: editingCompra.monto,
                comercio: editingCompra.comercio,
                fecha: editingCompra.fecha,
                hora: editingCompra.hora,
                cuenta: editingCompra.cuenta,
                comentario: editingCompra.comentario,
              }
            : null
        }
        categorias={categorias}
        onConfirm={handleConfirmEdit}
        onClose={() => setEditingGasto(null)}
      />

      {/* FAB */}
      <button
        onClick={() => setNuevoGastoOpen(true)}
        className="fixed bottom-24 right-5 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Agregar gasto manual"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <NuevoGastoModal
        open={nuevoGastoOpen}
        categorias={categorias.filter((c) => c.activa)}
        onClose={() => setNuevoGastoOpen(false)}
        onSaved={fetchData}
      />

      <TransferenciaModal
        gasto={
          editingTransferencia
            ? {
                id: editingTransferencia.id,
                fecha: editingTransferencia.fecha,
                emoji: editingTransferencia.emoji,
                comercio: editingTransferencia.comercio,
                monto: editingTransferencia.monto,
                categoria: editingTransferencia.categoria,
                comentario: editingTransferencia.comentario,
              }
            : null
        }
        categorias={categorias}
        onConfirm={handleConfirmTransferencia}
        onClose={() => setEditingGasto(null)}
      />
    </div>
  );
}
