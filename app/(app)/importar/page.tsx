"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Categoria, Importacion } from "@/types";
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

type Estado =
  | "loading"       // loading history + auth check
  | "idle"          // showing history, waiting for user action
  | "needsAuth"     // Gmail not connected
  | "syncing"       // fetching from Gmail
  | "ready"         // showing pending gastos to confirm
  | "importing"     // saving gastos
  | "error";

export default function ImportarPage() {
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>("loading");
  const [historial, setHistorial] = useState<Importacion[]>([]);
  const [pendientes, setPendientes] = useState<GastoPendiente[]>([]);
  const [desdeDate, setDesdeDate] = useState("2025/12/31");
  const [filas, setFilas] = useState<Record<string, FilaState>>({});
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [totalEnGmail, setTotalEnGmail] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Load history + auth status on mount
  const cargarHistorial = useCallback(async () => {
    setEstado("loading");
    try {
      const [histRes, authRes, catsRes] = await Promise.all([
        fetch("/api/gmail/importaciones"),
        fetch("/api/gmail/sync"),          // GET — only checks auth, no sync
        fetch("/api/categorias"),
      ]);

      const { connected } = await authRes.json();
      if (!connected) {
        setEstado("needsAuth");
        return;
      }

      const { importaciones } = await histRes.json();
      const { categorias: cats } = await catsRes.json();

      setHistorial(importaciones ?? []);
      setCategorias((cats ?? []).filter((c: Categoria) => c.activa));
      setEstado("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error al cargar");
      setEstado("error");
    }
  }, []);

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

  // Trigger sync from Gmail
  async function handleSincronizar() {
    setEstado("syncing");
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });

      if (res.status === 401) {
        setEstado("needsAuth");
        return;
      }

      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
        setEstado("error");
        return;
      }

      setTotalEnGmail(data.total ?? 0);
      setDesdeDate(data.desdeDate ?? "2025/12/31");

      const items: GastoPendiente[] = data.pendientes ?? [];
      setPendientes(items);

      if (items.length === 0) {
        // Nothing new — go back to idle with refreshed history
        await cargarHistorial();
        return;
      }

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
      setErrorMsg(e instanceof Error ? e.message : "Error al sincronizar");
      setEstado("error");
    }
  }

  async function handleImportar() {
    const seleccionados = pendientes.filter((g) => filas[g.gmailId]?.seleccionado);
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
      await fetch("/api/gmail/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gastos, desdeDate }),
      });
      await cargarHistorial(); // refresh history and go back to idle
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error al importar");
      setEstado("error");
    }
  }

  function toggleSeleccion(id: string) {
    setFilas((prev) => ({ ...prev, [id]: { ...prev[id], seleccionado: !prev[id].seleccionado } }));
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
      for (const id of Object.keys(next)) next[id] = { ...next[id], seleccionado: val };
      return next;
    });
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (estado === "loading" || estado === "syncing" || estado === "importing") {
    const msg =
      estado === "syncing" ? "Leyendo tu bandeja de Gmail..." :
      estado === "importing" ? "Guardando gastos..." :
      "Cargando...";
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">{msg}</p>
      </div>
    );
  }

  // ── Needs auth ───────────────────────────────────────────────────────────────

  if (estado === "needsAuth") {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Importar desde Gmail</h1>
          <p className="text-sm text-gray-500">Banco de Chile</p>
        </div>
        <Card className="text-center py-8 space-y-4">
          <div className="text-5xl">📧</div>
          <div>
            <p className="font-semibold text-gray-800">Conecta tu cuenta de Gmail</p>
            <p className="text-sm text-gray-500 mt-1">
              Para leer tus alertas de &ldquo;Cargo en Cuenta&rdquo; del Banco de Chile
            </p>
          </div>
          <Button onClick={() => router.push("/api/gmail/auth")}>Conectar Gmail</Button>
        </Card>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────

  if (estado === "error") {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Importar desde Gmail</h1>
        <Card className="text-center py-8 space-y-3">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
          <Button variant="ghost" onClick={cargarHistorial}>Reintentar</Button>
        </Card>
      </div>
    );
  }

  // ── Ready: review pending gastos ─────────────────────────────────────────────

  if (estado === "ready") {
    const seleccionados = pendientes.filter((g) => filas[g.gmailId]?.seleccionado);
    const sinCategoria = seleccionados.filter((g) => !filas[g.gmailId]?.categoria);
    const allChecked = seleccionados.length === pendientes.length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Importar desde Gmail</h1>
            <p className="text-sm text-gray-500">
              {pendientes.length} nuevos · {totalEnGmail} en Gmail desde {desdeDate.replace(/\//g, "-")}
            </p>
          </div>
          <button
            onClick={() => setEstado("idle")}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Cancelar
          </button>
        </div>

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
          <span className="text-xs text-gray-400">{seleccionados.length} seleccionados</span>
        </div>

        <div className="space-y-2">
          {pendientes.map((g) => {
            const fila = filas[g.gmailId];
            if (!fila) return null;
            const [dia, mes] = g.fecha.split("/");
            return (
              <Card key={g.gmailId} padding="sm">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={fila.seleccionado}
                    onChange={() => toggleSeleccion(g.gmailId)}
                    className="mt-1 w-4 h-4 rounded accent-blue-600 flex-shrink-0"
                  />
                  <div className="flex-shrink-0 w-10 text-center">
                    <div className="text-base font-bold text-gray-800 leading-none">{dia}</div>
                    <div className="text-[10px] text-gray-400 uppercase">
                      {new Date(0, parseInt(mes) - 1).toLocaleString("es-CL", { month: "short" })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{g.comercio}</p>
                      {g.tipo === "transferencia" && (
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 border border-purple-100 rounded px-1.5 py-0.5 flex-shrink-0">
                          Transferencia
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{g.hora} hrs</p>
                    <select
                      value={fila.categoria}
                      onChange={(e) => setCategoria(g.gmailId, e.target.value)}
                      className={`mt-1.5 w-full text-xs border rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !fila.categoria && fila.seleccionado
                          ? "border-amber-400 bg-amber-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <option value="">— Sin categoría —</option>
                      {categorias.map((c) => (
                        <option key={c.nombre} value={c.nombre}>{c.emoji} {c.nombre}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={fila.comentario}
                      onChange={(e) => setComentario(g.gmailId, e.target.value)}
                      placeholder="Comentario opcional…"
                      className="mt-1 w-full text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
                    />
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="font-bold text-gray-900 text-sm">{formatMonedaChile(g.monto)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {sinCategoria.length > 0 && (
          <p className="text-xs text-amber-600 text-center">
            {sinCategoria.length} gasto{sinCategoria.length > 1 ? "s" : ""} sin categoría — se importarán igual
          </p>
        )}

        <div className="sticky bottom-20 pt-2">
          <Button className="w-full" onClick={handleImportar} disabled={seleccionados.length === 0}>
            Importar {seleccionados.length > 0 ? `${seleccionados.length} gastos` : ""}
          </Button>
        </div>
      </div>
    );
  }

  // ── Idle: history + import button ────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Importar desde Gmail</h1>
          <p className="text-sm text-gray-500">Banco de Chile</p>
        </div>
      </div>

      {/* Import action */}
      <Button className="w-full" onClick={handleSincronizar}>
        Buscar gastos nuevos
      </Button>

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">
          Historial de importaciones
        </h2>

        {historial.length === 0 ? (
          <Card className="text-center py-8 space-y-2">
            <p className="text-gray-400 text-sm">Aún no hay importaciones registradas</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {historial.map((imp) => {
              const fecha = new Date(imp.timestamp);
              const fechaStr = fecha.toLocaleDateString("es-CL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              const horaStr = fecha.toLocaleTimeString("es-CL", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <Card key={imp.id} padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{fechaStr}</p>
                      <p className="text-xs text-gray-400">
                        {horaStr} · desde {imp.desdeDate.replace(/\//g, "-")}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-blue-600">
                      {imp.cantidad} gasto{imp.cantidad !== 1 ? "s" : ""}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="pb-4 text-center">
        <button
          onClick={() => router.push("/gastos")}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Ver todos mis gastos
        </button>
      </div>
    </div>
  );
}
