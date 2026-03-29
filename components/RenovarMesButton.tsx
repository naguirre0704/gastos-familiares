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
  const todayISO = today.toISOString().split("T")[0];

  const [fechaISO, setFechaISO] = useState(todayISO);

  function isoToDDMMYYYY(iso: string): string {
    const [y2, m2, d2] = iso.split("-");
    return `${d2}/${m2}/${y2}`;
  }

  function handleOpen() {
    setError("");
    setFechaISO(todayISO);
    setOpen(true);
  }

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/ciclos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes: proximoMes, fechaInicio: isoToDDMMYYYY(fechaISO) }),
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de inicio del ciclo
            </label>
            <input
              type="date"
              value={fechaISO}
              max={todayISO}
              onChange={(e) => setFechaISO(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="text-sm text-gray-500 text-center leading-relaxed">
            Los gastos desde esa fecha se asignarán a{" "}
            <span className="font-semibold capitalize text-gray-900">{proximoMesLabel}</span>.
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
