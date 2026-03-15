import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncGmailGastos } from "@/lib/gmail";
import { findCategoria } from "@/lib/learning";
import {
  getOrCreateSheet,
  getGastos,
  getComercios,
  appendGasto,
  upsertComercio,
} from "@/lib/sheets";
import { v4 as uuidv4 } from "uuid";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sheetId = await getOrCreateSheet(session.accessToken);
    const [gastos, comercios] = await Promise.all([
      getGastos(session.accessToken, sheetId),
      getComercios(session.accessToken, sheetId),
    ]);

    const existingGmailIds = new Set(gastos.map((g) => g.gmailId));

    // Find last gasto date for incremental sync
    const lastFecha = gastos.length > 0 ? gastos[gastos.length - 1].fecha : undefined;

    const newMessages = await syncGmailGastos(session.accessToken, lastFecha);

    const toCategorizare: Array<{
      gmailId: string;
      monto: number;
      comercio: string;
      fecha: string;
      hora: string;
      cuenta: string;
    }> = [];

    for (const msg of newMessages) {
      if (existingGmailIds.has(msg.id)) continue;

      const { monto, comercio, fecha, hora, cuenta } = msg.parsed;
      const categoria = findCategoria(comercio, comercios);

      if (categoria) {
        const gasto = {
          id: uuidv4(),
          fecha,
          hora,
          monto,
          comercio,
          categoria,
          cuenta,
          gmailId: msg.id,
          creadoPor: session.user?.email || "",
          notas: "",
        };
        await appendGasto(session.accessToken, sheetId, gasto);
        await upsertComercio(session.accessToken, sheetId, comercio, categoria, fecha);
      } else {
        toCategorizare.push({ gmailId: msg.id, monto, comercio, fecha, hora, cuenta });
      }
    }

    return NextResponse.json({
      success: true,
      nuevos: newMessages.length,
      sinCategoria: toCategorizare,
      sheetId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Gmail sync error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
