"use client";

import { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Categoria } from "@/types";

// DD/MM/YYYY  ↔  YYYY-MM-DD
function toInputDate(dmy: string): string {
  const [dd, mm, yyyy] = dmy.split("/");
  return dd && mm && yyyy ? `${yyyy}-${mm}-${dd}` : "";
}
function fromInputDate(ymd: string): string {
  const [yyyy, mm, dd] = ymd.split("-");
  return yyyy && mm && dd ? `${dd}/${mm}/${yyyy}` : "";
}

interface TransferenciaGasto {
  id: string;
  fecha: string;
  emoji?: string;
  comercio: string;
  monto: number;
  categoria: string;
  comentario?: string;
}

interface TransferenciaModalProps {
  gasto: TransferenciaGasto | null;
  categorias: Categoria[];
  onConfirm: (
    id: string,
    fields: { fecha: string; emoji?: string; comercio: string; monto: number; categoria: string; comentario?: string }
  ) => Promise<void>;
  onClose: () => void;
}

export function TransferenciaModal({ gasto, categorias, onConfirm, onClose }: TransferenciaModalProps) {
  const [emoji, setEmoji] = useState("");
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [comentario, setComentario] = useState("");
  const [fecha, setFecha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (gasto) {
      setEmoji(gasto.emoji || "");
      setNombre(gasto.comercio);
      setMonto(String(gasto.monto));
      setCategoria(gasto.categoria || "");
      setComentario(gasto.comentario || "");
      setFecha(toInputDate(gasto.fecha));
    }
  }, [gasto?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!gasto) return null;

  const montoNum = parseInt(monto.replace(/\./g, ""), 10);
  const canSave = nombre.trim().length > 0 && !isNaN(montoNum) && montoNum > 0;

  const activeCats = categorias.filter((c) => c.activa);

  async function handleConfirm() {
    if (!canSave || !gasto) return;
    setLoading(true);
    try {
      await onConfirm(gasto.id, {
        fecha: fromInputDate(fecha) || gasto.fecha,
        emoji: emoji.trim() || undefined,
        comercio: nombre.trim(),
        monto: montoNum,
        categoria,
        comentario: comentario.trim() || undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={!!gasto} onClose={onClose} title="Editar transferencia">
      <div className="space-y-4">

        {/* Emoji + Nombre side by side */}
        <div className="flex gap-3">
          <div className="w-20 flex-shrink-0">
            <label className="block text-xs font-medium text-gray-500 mb-1">Emoji</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => {
                const val = e.target.value;
                const chars = [...val];
                setEmoji(chars[chars.length - 1] ?? "");
              }}
              placeholder="💸"
              className="w-full text-center text-2xl border border-gray-200 rounded-xl px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre / Destino</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Camila Bravo"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
            />
          </div>
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

        {/* Monto */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Monto</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="10000"
              className="w-full text-sm border border-gray-200 rounded-xl pl-7 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Categoría */}
        {activeCats.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {activeCats.map((cat) => (
                <button
                  key={cat.nombre}
                  type="button"
                  onClick={() => setCategoria(cat.nombre)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
                    categoria === cat.nombre
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-sm font-medium text-gray-800">{cat.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comentario */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Comentario <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            type="text"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ej: pago arriendo, cuota colegio…"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={!canSave || loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
