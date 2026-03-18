"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [gmailError, setGmailError] = useState(false);
  const [importDate, setImportDate] = useState(`${new Date().getFullYear()}-01-01`);

  useEffect(() => {
    if (params.get("gmail") === "error") setGmailError(true);
  }, [params]);

  async function handleManualImport() {
    router.push(`/importar?from=${importDate}`);
  }

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

      {/* Gmail */}
      <Card>
        <h2 className="text-sm font-bold text-gray-700 mb-4">Sincronización Gmail</h2>
        <div className="flex items-start gap-3">
          <span className="text-2xl">📧</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">Banco de Chile</p>
            <p className="text-xs text-gray-500">
              Importa los cargos de <span className="font-mono">enviodigital@bancochile.cl</span> desde la fecha seleccionada
            </p>
          </div>
        </div>
        {gmailError && (
          <p className="mt-3 text-xs text-red-500">
            Error al conectar con Google. Revisa tus credenciales e intenta de nuevo.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => router.push("/api/gmail/auth")}>
            Conectar Gmail
          </Button>
          <Button size="sm" variant="ghost" onClick={() => router.push("/importar")}>
            Ir a importar
          </Button>
        </div>
      </Card>

      {/* Importación manual */}
      <Card>
        <h2 className="text-sm font-bold text-gray-700 mb-1">Importación manual</h2>
        <p className="text-xs text-gray-500 mb-4">
          Reimporta correos desde una fecha específica. Útil si faltan gastos anteriores.
        </p>
        <div className="space-y-3">
          <div>
            <label htmlFor="import-date" className="block text-xs font-medium text-gray-600 mb-1">
              Importar desde
            </label>
            <input
              id="import-date"
              type="date"
              value={importDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setImportDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualImport}
            disabled={!importDate}
          >
            Importar desde esta fecha
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
