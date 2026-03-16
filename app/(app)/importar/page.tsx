"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Categoria } from "@/types";
import { formatMonedaChile } from "@/lib/parser";

interface GastoPendiente {
  gmailId: string;
  fecha: string;
  hora: string;
  monto: number;
  comercio: string;
  categoriaSugerida: string;
  comentario?: string;
  tipo?: "compra" | "transferencia";
}

interface FilaState {
  seleccionado: boolean;
  categoria: string;
  comentario: string;
}

type Estado = "loading" | "needsAuth" | "empty" | "ready" | "importing" | "done" | "error";

export default function ImportarPage() {
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>("loading");
  const [pendientes, setPendientes] = useState<GastoPendiente[]>([]);
  const [filas, setFilas] = useState<Record<string, FilaState>>({});
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [totalEnGmail, setTotalEnGmail] = useState(0);
  const [importados, setImportados] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const cargarDatos = useCallback(async () => {
    setEstado("loading");
    try {
      const [syncRes, catsRes] = await Promise.all([
        fetch("/api/gmail/sync", { method: "POST" }),
        fetch("/api/categorias"),
      ]);

      if (syncRes.status === 401) {
        setEstado("needsAuth");
        return;
      }

      const syncData = await syncRes.json();
      const catsData = await catsRes.json();

      if (syncData.error) {
        setErrorMsg(syncData.error);
        setEstado("error");
        return;
      }

      const cats: Categoria[] = catsData.categorias ?? [];
      setCategorias(cats.filter((c) => c.activa));
      setTotalEnGmail(syncData.total ?? 0);

      const items: GastoPendiente[] = syncData.pendientes ?? [];
      setPendientes(items);

      if (items.length === 0) {
        setEstado("empty");
        return;
      }

      // Init fila states — all selected, category pre-filled from suggestion
      const init: Record<string, FilaState> = {};
      for (const g of items) {
        init[g.gmailId] = {
          seleccionado: true,
          categoria: g.categoriaSugerida || "",
          comentario: g.comentario || "",
        };
      }
      setFilas(init);
      setEstado("ready");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error desconocido");
      setEstado("error");
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  function toggleSeleccion(id: string) {
    setFilas((prev) => ({
      ...prev,
      [id]: { ...prev[id], seleccionado: !prev[id].seleccionado },
    }));
  }

  function setCategoria(id: string, cat: string) {
    setFilas((prev) => ({ ...prev, [id]: { ...prev[id], categoria: cat } }));
  }

  function setComentario(id: string, text: string) {
    setFilas((prev) => ({ ...prev, [id]: { ...prev[id], comentario: text } }));
  }

  function toggleAll(val: boolean) {
    setFilas((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { ...next[id], seleccionado: val };
      }
      return next;
    });
  }

  const seleccionados = pendientes.filter((g) => filas[g.gmailId]?.seleccionado);
  const sinCategoria = seleccionados.filter((g) => !filas[g.gmailId]?.categoria);

  async function handleImportar() {
    if (seleccionados.length === 0) return;
    setEstado("importing");

    const gastos = seleccionados.map((g) => ({
      gmailId: g.gmailId,
      fecha: g.fecha,
      hora: g.hora,
      monto: g.monto,
      comercio: g.comercio,
      categoria: filas[g.gmailId].categoria,
      comentario: filas[g.gmailId].comentario || undefined,
      tipo: g.tipo,
    }));

    try {
      const res = await fetch("/api/gmail/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gastos }),
      });
      const data = await res.json();
      setImportados(data.imported ?? 0);
      setEstado("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error al importar");
      setEstado("error");
    }
  }

  // ── Renders ────────────────────────────────────────────────────────────────

  if (estado === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Leyendo tu bandeja de Gmail...</p>
      </div>
    );
  }

  if (estado === "importing") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Importando {seleccionados.length} gastos...</p>
      </div>
    );
  }

  if (estado === "needsAuth") {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Importar desde Gmail</h1>
          <p className="text-sm text-gray-500">Banco de Chile · 2026</p>
        </div>
        <Card className="text-center py-8 space-y-4">
          <div className="text-5xl">📧</div>
          <div>
            <p className="font-semibold text-gray-800">Conecta tu cuenta de Gmail</p>
            <p className="text-sm text-gray-500 mt-1">
              Para leer tus alertas de &ldquo;Cargo en Cuenta&rdquo; del Banco de Chile
            </p>
          </div>
          <Button onClick={() => router.push("/api/gmail/auth")}>
            Conectar Gmail
          </Button>
        </Card>
      </div>
    );
  }

  if (estado === "done") {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Importar desde Gmail</h1>
        </div>
        <Card className="text-center py-10 space-y-4">
          <div className="text-5xl">✅</div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{importados} gastos importados</p>
            <p className="text-sm text-gray-500 mt-1">Ya están disponibles en tu registro</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="ghost" onClick={() => router.push("/gastos")}>
              Ver gastos
            </Button>
            <Button onClick={cargarDatos}>
              Sincronizar de nuevo
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Importar desde Gmail</h1>
        <Card className="text-center py-8 space-y-3">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
          <Button variant="ghost" onClick={cargarDatos}>Reintentar</Button>
        </Card>
      </div>
    );
  }

  if (estado === "empty") {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Importar desde Gmail</h1>
          <p className="text-sm text-gray-500">{totalEnGmail} alertas encontradas en 2026</p>
        </div>
        <Card className="text-center py-10 space-y-3">
          <div className="text-4xl">🎉</div>
          <p className="font-semibold text-gray-800">Todo al día</p>
          <p className="text-sm text-gray-500">No hay gastos nuevos para importar</p>
          <Button variant="ghost" onClick={() => router.push("/gastos")}>Ver mis gastos</Button>
        </Card>
      </div>
    );
  }

  // ── Estado "ready" ─────────────────────────────────────────────────────────

  const allChecked = seleccionados.length === pendientes.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Importar desde Gmail</h1>
          <p className="text-sm text-gray-500">
            {pendientes.length} nuevos · {totalEnGmail} en Gmail 2026
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={cargarDatos}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </Button>
      </div>

      {/* Select all */}
      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => toggleAll(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600"
          />
          Seleccionar todos
        </label>
        <span className="text-xs text-gray-400">
          {seleccionados.length} seleccionados
        </span>
      </div>

      {/* Gasto rows */}
      <div className="space-y-2">
        {pendientes.map((g) => {
          const fila = filas[g.gmailId];
          if (!fila) return null;
          const [dia, mes] = g.fecha.split("/");

          return (
            <Card key={g.gmailId} padding="sm">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={fila.seleccionado}
                  onChange={() => toggleSeleccion(g.gmailId)}
                  className="mt-1 w-4 h-4 rounded accent-blue-600 flex-shrink-0"
                />

                {/* Date badge */}
                <div className="flex-shrink-0 w-10 text-center">
                  <div className="text-base font-bold text-gray-800 leading-none">{dia}</div>
                  <div className="text-[10px] text-gray-400 uppercase">
                    {new Date(0, parseInt(mes) - 1).toLocaleString("es-CL", { month: "short" })}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{g.comercio}</p>
                    {g.tipo === "transferencia" && (
                      <span className="text-[10px] font-medium text-purple-600 bg-purple-50 border border-purple-100 rounded px-1 py-0.5 flex-shrink-0">
                        Transferencia
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{g.hora} hrs</p>
                  {/* Category selector */}
                  <select
                    value={fila.categoria}
                    onChange={(e) => setCategoria(g.gmailId, e.target.value)}
                    className={`mt-1.5 w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !fila.categoria && fila.seleccionado
                        ? "border-amber-400 bg-amber-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <option value="">— Sin categoría —</option>
                    {categorias.map((c) => (
                      <option key={c.nombre} value={c.nombre}>
                        {c.emoji} {c.nombre}
                      </option>
                    ))}
                  </select>
                  {/* Comment field */}
                  <input
                    type="text"
                    value={fila.comentario}
                    onChange={(e) => setComentario(g.gmailId, e.target.value)}
                    placeholder="Comentario opcional…"
                    className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-300"
                  />
                </div>

                {/* Amount */}
                <div className="flex-shrink-0 text-right">
                  <span className="font-bold text-gray-900 text-sm">
                    {formatMonedaChile(g.monto)}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Warning: items without category */}
      {sinCategoria.length > 0 && (
        <p className="text-xs text-amber-600 text-center">
          {sinCategoria.length} gasto{sinCategoria.length > 1 ? "s" : ""} sin categoría — se importarán igual, puedes categorizarlos después
        </p>
      )}

      {/* Import button */}
      <div className="sticky bottom-20 pt-2">
        <Button
          className="w-full"
          onClick={handleImportar}
          disabled={seleccionados.length === 0}
        >
          Importar {seleccionados.length > 0 ? `${seleccionados.length} gastos` : ""}
        </Button>
      </div>
    </div>
  );
}
