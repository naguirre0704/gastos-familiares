"use client";

import { ResumenCategoria } from "@/types";
import { formatMonedaChile } from "@/lib/parser";

interface BudgetBarProps {
  resumen: ResumenCategoria;
  onClick?: () => void;
  hidden?: boolean;
  onToggleHidden?: () => void;
}

export function BudgetBar({
  resumen,
  onClick,
  hidden = false,
  onToggleHidden,
}: BudgetBarProps) {
  const { categoria, gastado, presupuesto, porcentaje } = resumen;
  const exceeded = porcentaje > 100;
  const barWidth = Math.min(porcentaje, 100);

  return (
    <div
      className={`group ${hidden ? "opacity-60" : ""} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{categoria.emoji}</span>
          <span className="font-medium text-gray-800 text-sm truncate">
            {categoria.nombre}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span
              className={`text-sm font-semibold ${exceeded ? "text-red-600" : "text-gray-700"}`}
            >
              {formatMonedaChile(gastado)}
            </span>
            <span className="text-xs text-gray-400 ml-1">
              / {formatMonedaChile(presupuesto)}
            </span>
            <span
              className={`ml-2 text-xs font-bold ${exceeded ? "text-red-600" : "text-gray-500"}`}
            >
              ({porcentaje}%)
            </span>
          </div>
          {onToggleHidden && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHidden();
              }}
              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
              aria-label={
                hidden ? `Mostrar ${categoria.nombre}` : `Ocultar ${categoria.nombre}`
              }
              title={hidden ? "Mostrar resumen" : "Ocultar resumen"}
            >
              {hidden ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          )}
        </div>
      </div>

      {!hidden && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              exceeded ? "bg-red-500" : porcentaje > 80 ? "bg-amber-400" : "bg-blue-500"
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      )}
    </div>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}
