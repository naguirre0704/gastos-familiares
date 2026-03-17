"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Categoria } from "@/types";

interface NuevoGastoModalProps {
  open: boolean;
  categorias: Categoria[];
  onClose: () => void;
  onSaved: () => void;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function isoToDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function NuevoGastoModal({ open, categorias, onClose, onSaved }: NuevoGastoModalProps) {
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState(todayISO());
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setMonto("");
      setDescripcion("");
      setCategoria("");
      setFecha(todayISO());
      setComentario("");
      setError("");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function handleGuardar() {
    const montoNum = parseInt(monto.replace(/\D/g, ""), 10);
    if (!montoNum || montoNum <= 0) { setError("Ingresa un monto válido."); return; }
    if (!descripcion.trim()) { setError("Ingresa una descripción."); return; }

    setSaving(true);
    setError("");
    try {
      const now = new Date();
      const hora = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: montoNum,
          comercio: descripcion.trim(),
          categoria,
          fecha: isoToDDMMYYYY(fecha),
          hora,
          comentario: comentario.trim() || undefined,
          gmailId: "",
          creadoPor: "manual",
          cuenta: "",
          notas: "",
          recordarComercio: !!categoria,
        }),
      });
      if (!res.ok) throw new Error();
      onSaved();
      onClose();
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-t-2xl shadow-xl w-full max-w-lg mx-auto px-5 pt-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Nuevo gasto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* Monto */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className={`${inputClass} pl-7`}
                autoFocus
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
            <input
              type="text"
              placeholder="Ej: Jumbo, Almuerzo, Netflix…"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={inputClass}
            >
              <option value="">— Sin categoría —</option>
              {categorias.map((c) => (
                <option key={c.nombre} value={c.nombre}>{c.emoji} {c.nombre}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              max={todayISO()}
              onChange={(e) => setFecha(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Comentario <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Notas adicionales…"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button className="w-full mt-1" onClick={handleGuardar} disabled={saving}>
            {saving ? "Guardando…" : "Guardar gasto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
