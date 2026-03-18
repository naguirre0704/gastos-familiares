"use client";

import { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Categoria } from "@/types";
import { formatMonedaChile } from "@/lib/parser";
import { toInputDate, fromInputDate } from "@/lib/dates";

interface PendingGasto {
  gmailId: string;
  monto: number;
  comercio: string;
  fecha: string;
  hora: string;
  cuenta: string;
  comentario?: string;
}

interface CategoryModalProps {
  gasto: PendingGasto | null;
  categorias: Categoria[];
  onConfirm: (gasto: PendingGasto, categoria: string, recordar: boolean, comentario: string) => Promise<void>;
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
  const [comentario, setComentario] = useState("");
  const [fecha, setFecha] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset state whenever the gasto changes
  useEffect(() => {
    if (gasto) {
      setSelected("");
      setRecordar(true);
      setComentario(gasto.comentario || "");
      setFecha(toInputDate(gasto.fecha));
    }
  }, [gasto?.gmailId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!gasto) return null;

  const activeCats = categorias.filter((c) => c.activa);

  async function handleConfirm() {
    if (!selected || !gasto) return;
    setLoading(true);
    try {
      const fechaDMY = fromInputDate(fecha) || gasto.fecha;
      await onConfirm({ ...gasto, fecha: fechaDMY }, selected, recordar, comentario);
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
              type="button"
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

        {/* Fecha */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Comment field */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Comentario <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            type="text"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ej: pago arriendo, compra semanal…"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
          />
        </div>

        {/* Remember toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            type="button"
            role="switch"
            aria-checked={recordar}
            aria-label="Recordar siempre para este comercio"
            onClick={() => setRecordar(!recordar)}
            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
              recordar ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                recordar ? "translate-x-4" : ""
              }`}
            />
          </button>
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
