"use client";

import { Gasto, Categoria } from "@/types";
import { Badge } from "./ui/Badge";
import { formatMonedaChile } from "@/lib/parser";

interface GastosListProps {
  gastos: Gasto[];
  categorias: Categoria[];
  onEditCategoria?: (gasto: Gasto) => void;
}

export function GastosList({ gastos, categorias, onEditCategoria }: GastosListProps) {
  const catMap = Object.fromEntries(categorias.map((c) => [c.nombre, c]));

  if (gastos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-sm">No hay gastos en este período</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {gastos.map((gasto) => {
        const cat = catMap[gasto.categoria];
        const esTransferencia = gasto.tipo === "transferencia";
        return (
          <div
            key={gasto.id}
            className="flex items-center justify-between py-3 px-1 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${cat?.color || "#6B7280"}20` }}
              >
                {gasto.emoji || (esTransferencia ? "💸" : cat?.emoji || "📦")}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-gray-900 text-sm truncate">{gasto.comercio}</p>
                  {esTransferencia && (
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 border border-purple-100 rounded px-1.5 py-0.5 flex-shrink-0">
                      Transferencia
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{gasto.fecha}</span>
                  {gasto.categoria ? (
                    <Badge
                      label={gasto.categoria}
                      color={cat?.color}
                      className="cursor-pointer"
                    />
                  ) : (
                    <Badge label="Sin categoría" color="#EF4444" />
                  )}
                </div>
                {gasto.comentario && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate italic">
                    {gasto.comentario}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                {formatMonedaChile(gasto.monto)}
              </span>
              {onEditCategoria && (
                <button
                  onClick={() => onEditCategoria(gasto)}
                  className="text-gray-400 hover:text-blue-500 transition-colors p-2 rounded"
                  title="Cambiar categoría / comentario"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
