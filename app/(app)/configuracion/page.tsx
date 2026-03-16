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

  useEffect(() => {
    if (params.get("gmail") === "error") setGmailError(true);
  }, [params]);

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
              Importa los cargos de <span className="font-mono">enviodigital@bancochile.cl</span> de todo el 2026
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
