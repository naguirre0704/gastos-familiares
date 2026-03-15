"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Categoria } from "@/types";
import { formatMonedaChile } from "@/lib/parser";

interface PendingGasto {
  gmailId: string;
  monto: number;
  comercio: string;
  fecha: string;
  hora: string;
  cuenta: string;
}

interface CategoryModalProps {
  gasto: PendingGasto | null;
  categorias: Categoria[];
  onConfirm: (gasto: PendingGasto, categoria: string, recordar: boolean) => Promise<void>;
  onClose: () => void;
}

export function CategoryModal({
  gasto,
  categorias,
  onConfirm,
  onClose,
}: CategoryModalProps) {
  const [selected, setSelected] = useState<string>("");
  const [recordar, setRecordar] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!gasto) return null;

  const activeCats = categorias.filter((c) => c.activa);

  async function handleConfirm() {
    if (!selected || !gasto) return;
    setLoading(true);
    try {
      await onConfirm(gasto, selected, recordar);
      setSelected("");
      setRecordar(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={!!gasto} onClose={onClose} title="¿A qué categoría pertenece?">
      <div className="space-y-4">
        {/* Store name & amount */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-lg font-bold text-gray-900">{gasto.comercio}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatMonedaChile(gasto.monto)}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {gasto.fecha} {gasto.hora} · Cuenta ****{gasto.cuenta}
          </p>
        </div>

        {/* Category list */}
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {activeCats.map((cat) => (
            <button
              key={cat.nombre}
              onClick={() => setSelected(cat.nombre)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                selected === cat.nombre
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="text-sm font-medium text-gray-800">{cat.nombre}</span>
            </button>
          ))}
        </div>

        {/* Remember toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`relative w-10 h-6 rounded-full transition-colors ${
              recordar ? "bg-blue-600" : "bg-gray-300"
            }`}
            onClick={() => setRecordar(!recordar)}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                recordar ? "translate-x-4" : ""
              }`}
            />
          </div>
          <span className="text-sm text-gray-600">Recordar siempre para este comercio</span>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!selected || loading}
          >
            {loading ? "Guardando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
