"use client";

import { useSession, signOut } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ConfiguracionPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500">Cuenta y ajustes de la app</p>
      </div>

      {/* Account */}
      <Card>
        <h2 className="text-sm font-bold text-gray-700 mb-4">Cuenta</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{session?.user?.name}</p>
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Cerrar sesión
          </Button>
        </div>
      </Card>

      {/* Info */}
      <Card>
        <h2 className="text-sm font-bold text-gray-700 mb-4">Sobre la app</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <span className="text-xl">💳</span>
            <div>
              <p className="font-medium text-gray-800">Registro de gastos</p>
              <p className="text-xs text-gray-500">
                Registra y categoriza tus gastos familiares manualmente
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">📊</span>
            <div>
              <p className="font-medium text-gray-800">Presupuestos por categoría</p>
              <p className="text-xs text-gray-500">
                Define presupuestos mensuales y monitorea tu avance
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🧠</span>
            <div>
              <p className="font-medium text-gray-800">Aprendizaje automático</p>
              <p className="text-xs text-gray-500">
                La app recuerda la categoría de cada comercio y la sugiere automáticamente
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
