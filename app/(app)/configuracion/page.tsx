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
        <h2 className="text-sm font-bold text-gray-700 mb-4">Cuenta Google</h2>
        <div className="flex items-center gap-4">
          {session?.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt="Avatar"
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{session?.user?.name}</p>
            <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
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
            <span className="text-xl">📧</span>
            <div>
              <p className="font-medium text-gray-800">Gmail API</p>
              <p className="text-xs text-gray-500">
                Detecta automáticamente correos de cargo de Banco de Chile con asunto
                &quot;Cargo en Cuenta&quot;
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">📊</span>
            <div>
              <p className="font-medium text-gray-800">Google Sheets</p>
              <p className="text-xs text-gray-500">
                Los gastos se almacenan en tu Google Sheet &quot;Gastos Familiares App&quot;
                creado automáticamente en tu Drive
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🧠</span>
            <div>
              <p className="font-medium text-gray-800">Aprendizaje automático</p>
              <p className="text-xs text-gray-500">
                La app recuerda la categoría de cada comercio y la asigna automáticamente
                en futuros cargos
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">👨‍👩‍👧‍👦</span>
            <div>
              <p className="font-medium text-gray-800">Multi-usuario</p>
              <p className="text-xs text-gray-500">
                Comparte el Google Sheet &quot;Gastos Familiares App&quot; con otros miembros
                de la familia para que puedan acceder desde sus cuentas
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Setup guide */}
      <Card>
        <h2 className="text-sm font-bold text-gray-700 mb-4">Configuración Google Cloud</h2>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Ir a Google Cloud Console y crear proyecto &quot;Gastos Familiares&quot;</li>
          <li>Activar Gmail API y Google Sheets API</li>
          <li>Crear credenciales OAuth 2.0 (Aplicación Web)</li>
          <li>Agregar Authorized redirect URIs para tu dominio</li>
          <li>Configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local</li>
        </ol>
      </Card>
    </div>
  );
}
