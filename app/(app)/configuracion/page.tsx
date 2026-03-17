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
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [importMessage, setImportMessage] = useState("");

  useEffect(() => {
    if (params.get("gmail") === "error") setGmailError(true);
  }, [params]);

  async function handleManualImport() {
    setImportStatus("loading");
    setImportMessage("");
    try {
      const res = await fetch(`/api/gmail/sync?from=${importDate}`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const count = data.pendientes?.length ?? 0;
      setImportMessage(
        count === 0
          ? "No se encontraron gastos nuevos en ese período."
          : `${count} gasto${count === 1 ? "" : "s"} nuevo${count === 1 ? "" : "s"} encontrado${count === 1 ? "" : "s"}. Ve al dashboard para categorizarlos.`
      );
      setImportStatus("success");
    } catch {
      setImportMessage("No se pudo importar. Revisa tu conexión e intenta de nuevo.");
      setImportStatus("error");
    }
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
              onChange={(e) => {
                setImportDate(e.target.value);
                setImportStatus("idle");
                setImportMessage("");
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualImport}
            disabled={importStatus === "loading" || !importDate}
          >
            {importStatus === "loading" ? "Importando..." : "Importar desde esta fecha"}
          </Button>
          {importStatus === "success" && (
            <p className="text-xs text-green-600 flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {importMessage}
            </p>
          )}
          {importStatus === "error" && (
            <p className="text-xs text-red-500 flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {importMessage}
            </p>
          )}
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
