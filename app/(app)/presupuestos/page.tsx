"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Gasto, Categoria } from "@/types";
import { formatMonedaChile } from "@/lib/parser";

function getMesActual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const COLORES_DEFAULT = [
  "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#3B82F6", "#EC4899", "#06B6D4", "#84CC16",
  "#F97316", "#6B7280",
];

const EMOJIS_DEFAULT = ["📦", "🏷️", "💰", "🛍️", "🎯", "⭐", "🔖", "💡", "🗂️", "📋"];

export default function PresupuestosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNombre, setEditingNombre] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newMonto, setNewMonto] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [errorNew, setErrorNew] = useState("");
  const mes = getMesActual();

  const fetchData = useCallback(async () => {
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const gastosDelMes = gastos.filter((g) => {
    const parts = g.fecha?.split("/");
    if (!parts || parts.length !== 3) return false;
    return `${parts[2]}-${parts[1]}` === mes;
  });

  async function handleSave(nombre: string) {
    const value = parseInt(editValue.replace(/\D/g, ""), 10);
    if (isNaN(value) || value < 0) return;
    setSaving(true);
    try {
      await fetch("/api/categorias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, presupuesto: value }),
      });
      await fetch("/api/presupuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, categoria: nombre, presupuesto: value }),
      });
      await fetchData();
    } finally {
      setSaving(false);
      setEditingNombre(null);
      setEditValue("");
    }
  }

  async function handleCrearPresupuesto() {
    const nombre = newNombre.trim();
    const monto = parseInt(newMonto.replace(/\D/g, ""), 10);

    if (!nombre) {
      setErrorNew("Ingresa un nombre de categoría.");
      return;
    }
    if (isNaN(monto) || monto <= 0) {
      setErrorNew("Ingresa un monto válido.");
      return;
    }
    if (categorias.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) {
      setErrorNew("Ya existe una categoría con ese nombre.");
      return;
    }

    setSavingNew(true);
    setErrorNew("");
    try {
      const colorIdx = categorias.length % COLORES_DEFAULT.length;
      const emojiIdx = categorias.length % EMOJIS_DEFAULT.length;

      await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          emoji: EMOJIS_DEFAULT[emojiIdx],
          color: COLORES_DEFAULT[colorIdx],
          presupuestoMensual: monto,
        }),
      });
      await fetch("/api/presupuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, categoria: nombre, presupuesto: monto }),
      });
      await fetchData();
      setShowModal(false);
      setNewNombre("");
      setNewMonto("");
    } finally {
      setSavingNew(false);
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setNewNombre("");
    setNewMonto("");
    setErrorNew("");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const [year, month] = mes.split("-");
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString("es-CL", {
    month: "long",
    year: "numeric",
  });

  const totalPresupuestado = categorias
    .filter((c) => c.activa)
    .reduce((s, c) => s + c.presupuestoMensual, 0);
  const totalGastado = gastosDelMes.reduce((s, g) => s + g.monto, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-sm text-gray-500 capitalize">{monthName}</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm" className="text-center">
          <p className="text-xs text-gray-500 mb-1">Total presupuestado</p>
          <p className="text-base font-bold text-gray-900">{formatMonedaChile(totalPresupuestado)}</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-xs text-gray-500 mb-1">Total gastado</p>
          <p className={`text-base font-bold ${totalGastado > totalPresupuestado ? "text-red-600" : "text-blue-600"}`}>
            {formatMonedaChile(totalGastado)}
          </p>
        </Card>
      </div>

      {/* Category list */}
      <div className="space-y-3">
        {categorias
          .filter((c) => c.activa)
          .map((cat) => {
            const gastado = gastosDelMes
              .filter((g) => g.categoria === cat.nombre)
              .reduce((s, g) => s + g.monto, 0);
            const porcentaje =
              cat.presupuestoMensual > 0
                ? Math.round((gastado / cat.presupuestoMensual) * 100)
                : 0;
            const exceeded = porcentaje > 100;
            const isEditing = editingNombre === cat.nombre;

            return (
              <Card key={cat.nombre} padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {cat.emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cat.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {formatMonedaChile(gastado)} gastado
                        {gastado > 0 && (
                          <span
                            className={`ml-1 font-semibold ${exceeded ? "text-red-500" : "text-gray-400"}`}
                          >
                            ({porcentaje}%)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">$</span>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-28 text-sm border border-blue-400 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave(cat.nombre);
                          if (e.key === "Escape") {
                            setEditingNombre(null);
                            setEditValue("");
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSave(cat.nombre)}
                        disabled={saving}
                      >
                        {saving ? "..." : "OK"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">
                        {formatMonedaChile(cat.presupuestoMensual)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingNombre(cat.nombre);
                          setEditValue(String(cat.presupuestoMensual));
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      exceeded ? "bg-red-500" : porcentaje > 80 ? "bg-amber-400" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                  />
                </div>
              </Card>
            );
          })}
      </div>

      {/* Modal nuevo presupuesto */}
      <Modal open={showModal} onClose={handleCloseModal} title="Nuevo presupuesto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre categoría
            </label>
            <input
              type="text"
              value={newNombre}
              onChange={(e) => { setNewNombre(e.target.value); setErrorNew(""); }}
              placeholder="Ej: Gym, Streaming, Mascotas..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto mensual
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={newMonto}
                onChange={(e) => { setNewMonto(e.target.value); setErrorNew(""); }}
                placeholder="0"
                className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleCrearPresupuesto(); }}
              />
            </div>
          </div>

          {errorNew && (
            <p className="text-sm text-red-500">{errorNew}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleCrearPresupuesto} disabled={savingNew}>
              {savingNew ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
