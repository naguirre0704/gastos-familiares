"use client";

import { useState } from "react";
import { Ciclo } from "@/types";
import { getProximoCicloMes } from "@/lib/ciclo";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface Props {
  ciclos: Ciclo[];
  onCicloCreado: () => void;
}

export function RenovarMesButton({ ciclos, onCicloCreado }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const proximoMes = getProximoCicloMes(ciclos);
  const [y, m] = proximoMes.split("-").map(Number);
  const proximoMesLabel = new Date(y, m - 1).toLocaleString("es-CL", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = String(today.getFullYear());
  const fechaHoy = `${dd}/${mm}/${yyyy}`;
  const fechaHoyLabel = today.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });

  function handleOpen() {
    setError("");
    setOpen(true);
  }

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/ciclos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes: proximoMes, fechaInicio: fechaHoy }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al renovar el mes");
        return;
      }
      setOpen(false);
      onCicloCreado();
    } catch {
      setError("Error al renovar el mes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Renovar mes"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Renovar mes
      </button>

      <Modal open={open} onClose={() => !saving && setOpen(false)} title="Renovar mes">
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center space-y-0.5">
            <p className="text-2xl font-bold text-blue-700 capitalize">{proximoMesLabel}</p>
            <p className="text-xs text-blue-500 uppercase tracking-wide font-medium">nuevo ciclo</p>
          </div>

          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Desde hoy{" "}
            <span className="font-semibold text-gray-900">{fechaHoyLabel}</span>, los gastos
            nuevos se asignarán a{" "}
            <span className="font-semibold capitalize">{proximoMesLabel}</span>.
          </p>

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl p-3">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={saving}>
              {saving ? "Guardando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
