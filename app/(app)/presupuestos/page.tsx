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

const EMOJIS = [
  "🛒", "🍔", "🏠", "🚗", "🎮", "👕", "💊", "📚",
  "✈️", "🎬", "🐶", "🍕", "☕", "🏋️", "🎵", "🏥",
  "⚡", "💧", "📱", "🎁", "🍷", "🎓", "🔧", "💼",
  "🌿", "🧴", "🎭", "🛋️", "🍱", "🧒", "💳", "📦",
];

function EmojiPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (e: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-1">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`text-xl p-1.5 rounded-xl transition-all ${
            selected === emoji
              ? "bg-blue-100 ring-2 ring-blue-500"
              : "hover:bg-gray-100"
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default function PresupuestosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // — Crear modal —
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newMonto, setNewMonto] = useState("");
  const [newEmoji, setNewEmoji] = useState(EMOJIS[0]);
  const [savingNew, setSavingNew] = useState(false);
  const [errorNew, setErrorNew] = useState("");

  // — Editar modal —
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [errorEdit, setErrorEdit] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const mes = getMesActual();

  const fetchData = useCallback(async () => {
    try {
      const [gastosRes, catsRes] = await Promise.all([
        fetch("/api/gastos"),
        fetch("/api/categorias"),
      ]);
      const gastosData = await gastosRes.json();
      const catsData = await catsRes.json();
      if (gastosData.gastos) setGastos(gastosData.gastos);
      if (catsData.categorias) setCategorias(catsData.categorias);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const gastosDelMes = gastos.filter((g) => {
    const parts = g.fecha?.split("/");
    if (!parts || parts.length !== 3) return false;
    return `${parts[2]}-${parts[1]}` === mes;
  });

  // ── Crear ──────────────────────────────────────────────────────────────────

  function handleOpenCrear() {
    setNewNombre("");
    setNewMonto("");
    setNewEmoji(EMOJIS[0]);
    setErrorNew("");
    setShowCrearModal(true);
  }

  function handleCloseCrear() {
    setShowCrearModal(false);
    setNewNombre("");
    setNewMonto("");
    setNewEmoji(EMOJIS[0]);
    setErrorNew("");
  }

  async function handleCrear() {
    const nombre = newNombre.trim();
    const monto = parseInt(newMonto.replace(/\D/g, ""), 10);
    if (!nombre) { setErrorNew("Ingresa un nombre de categoría."); return; }
    if (isNaN(monto) || monto <= 0) { setErrorNew("Ingresa un monto válido."); return; }
    if (categorias.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) {
      setErrorNew("Ya existe una categoría con ese nombre.");
      return;
    }
    setSavingNew(true);
    setErrorNew("");
    try {
      const colorIdx = categorias.length % COLORES_DEFAULT.length;
      await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          emoji: newEmoji,
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
      handleCloseCrear();
    } finally {
      setSavingNew(false);
    }
  }

  // ── Editar ─────────────────────────────────────────────────────────────────

  function handleOpenEdit(cat: Categoria) {
    setEditingCat(cat);
    setEditNombre(cat.nombre);
    setEditMonto(String(cat.presupuestoMensual));
    setEditEmoji(cat.emoji);
    setErrorEdit("");
    setShowDeleteConfirm(false);
  }

  function handleCloseEdit() {
    setEditingCat(null);
    setErrorEdit("");
    setShowDeleteConfirm(false);
  }

  async function handleGuardarEdit() {
    if (!editingCat) return;
    const nuevoNombre = editNombre.trim();
    const monto = parseInt(editMonto.replace(/\D/g, ""), 10);

    if (!nuevoNombre) { setErrorEdit("El nombre no puede estar vacío."); return; }
    if (isNaN(monto) || monto <= 0) { setErrorEdit("Ingresa un monto válido."); return; }
    if (
      nuevoNombre.toLowerCase() !== editingCat.nombre.toLowerCase() &&
      categorias.some((c) => c.nombre.toLowerCase() === nuevoNombre.toLowerCase())
    ) {
      setErrorEdit("Ya existe una categoría con ese nombre.");
      return;
    }

    setSavingEdit(true);
    setErrorEdit("");
    try {
      await fetch("/api/categorias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editingCat.nombre,
          nuevoNombre: nuevoNombre !== editingCat.nombre ? nuevoNombre : undefined,
          presupuesto: monto,
          emoji: editEmoji,
        }),
      });
      await fetch("/api/presupuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, categoria: nuevoNombre, presupuesto: monto }),
      });
      await fetchData();
      handleCloseEdit();
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleEliminar() {
    if (!editingCat) return;
    setDeleting(true);
    try {
      await fetch("/api/categorias", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: editingCat.nombre }),
      });
      await fetchData();
      handleCloseEdit();
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
  const totalPresupuestado = categorias.filter((c) => c.activa).reduce((s, c) => s + c.presupuestoMensual, 0);
  const totalGastado = gastosDelMes.reduce((s, g) => s + g.monto, 0);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-sm text-gray-500 capitalize">{monthName}</p>
        </div>
        <Button size="sm" onClick={handleOpenCrear}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        {categorias.filter((c) => c.activa).map((cat) => {
          const gastado = gastosDelMes
            .filter((g) => g.categoria === cat.nombre)
            .reduce((s, g) => s + g.monto, 0);
          const porcentaje = cat.presupuestoMensual > 0
            ? Math.round((gastado / cat.presupuestoMensual) * 100)
            : 0;
          const exceeded = porcentaje > 100;

          return (
            <Card key={cat.nombre} padding="md">
              <div className="flex items-center justify-between gap-2">
                {/* Left: emoji + info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    {cat.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{cat.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {formatMonedaChile(gastado)} gastado
                      {gastado > 0 && (
                        <span className={`ml-1 font-semibold ${exceeded ? "text-red-500" : "text-gray-400"}`}>
                          ({porcentaje}%)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: budget + edit button */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-bold text-gray-900 text-sm">
                    {formatMonedaChile(cat.presupuestoMensual)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Editar categoría"
                    onClick={() => handleOpenEdit(cat)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                </div>
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

      {/* ── Modal: Crear ──────────────────────────────────────────────────── */}
      <Modal open={showCrearModal} onClose={handleCloseCrear} title="Nuevo presupuesto">
        <div className="space-y-4">
          {/* Emoji */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ícono</label>
            <EmojiPicker selected={newEmoji} onSelect={setNewEmoji} />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre categoría</label>
            <input
              type="text"
              value={newNombre}
              onChange={(e) => { setNewNombre(e.target.value); setErrorNew(""); }}
              placeholder="Ej: Gym, Streaming, Mascotas..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto mensual</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={newMonto}
                onChange={(e) => { setNewMonto(e.target.value); setErrorNew(""); }}
                placeholder="0"
                className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleCrear(); }}
              />
            </div>
          </div>

          {errorNew && <p className="text-sm text-red-500">{errorNew}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={handleCloseCrear}>Cancelar</Button>
            <Button className="flex-1" onClick={handleCrear} disabled={savingNew}>
              {savingNew ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Editar ─────────────────────────────────────────────────── */}
      <Modal open={!!editingCat} onClose={handleCloseEdit} title="Editar categoría">
        <div className="space-y-4">
          {/* Emoji */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ícono</label>
            <EmojiPicker selected={editEmoji} onSelect={setEditEmoji} />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre categoría</label>
            <input
              type="text"
              value={editNombre}
              onChange={(e) => { setEditNombre(e.target.value); setErrorEdit(""); }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto mensual</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={editMonto}
                onChange={(e) => { setEditMonto(e.target.value); setErrorEdit(""); }}
                className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => { if (e.key === "Enter") handleGuardarEdit(); }}
              />
            </div>
          </div>

          {errorEdit && <p className="text-sm text-red-500">{errorEdit}</p>}

          {/* Guardar / Cancelar */}
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={handleCloseEdit}>Cancelar</Button>
            <Button className="flex-1" onClick={handleGuardarEdit} disabled={savingEdit}>
              {savingEdit ? "Guardando..." : "Guardar"}
            </Button>
          </div>

          {/* Eliminar */}
          <div className="border-t border-gray-100 pt-4">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="w-full text-sm text-red-500 hover:text-red-700 transition-colors py-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Eliminar categoría
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-3">
                <p className="text-sm text-red-700 font-medium text-center">
                  ¿Eliminar &ldquo;{editingCat?.nombre}&rdquo;? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={handleEliminar}
                    disabled={deleting}
                  >
                    {deleting ? "Eliminando..." : "Sí, eliminar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
