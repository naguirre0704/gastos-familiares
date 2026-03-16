"use client";

import { ResumenCategoria } from "@/types";
import { formatMonedaChile } from "@/lib/parser";

interface BudgetBarProps {
  resumen: ResumenCategoria;
  onClick?: () => void;
}

export function BudgetBar({ resumen, onClick }: BudgetBarProps) {
  const { categoria, gastado, presupuesto, porcentaje } = resumen;
  const exceeded = porcentaje > 100;
  const barWidth = Math.min(porcentaje, 100);

  return (
    <div
      className={`group ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoria.emoji}</span>
          <span className="font-medium text-gray-800 text-sm">{categoria.nombre}</span>
        </div>
        <div className="text-right">
          <span className={`text-sm font-semibold ${exceeded ? "text-red-600" : "text-gray-700"}`}>
            {formatMonedaChile(gastado)}
          </span>
          <span className="text-xs text-gray-400 ml-1">/ {formatMonedaChile(presupuesto)}</span>
          <span
            className={`ml-2 text-xs font-bold ${exceeded ? "text-red-600" : "text-gray-500"}`}
          >
            ({porcentaje}%)
          </span>
        </div>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            exceeded ? "bg-red-500" : porcentaje > 80 ? "bg-amber-400" : "bg-blue-500"
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
