export interface ParsedGasto {
  monto: number;
  cuenta: string;
  comercio: string;
  fecha: string;
  hora: string;
}

export function parseCorreoBancoChile(body: string): ParsedGasto | null {
  const regex =
    /compra por \$([0-9.]+) con cargo a Cuenta \*{4}(\d{4}) en (.+?) el (\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2})/i;

  const match = body.match(regex);
  if (!match) return null;

  const [, montoStr, cuenta, comercio, fecha, hora] = match;
  const monto = parseInt(montoStr.replace(/\./g, ""), 10);

  return { monto, cuenta, comercio: comercio.trim(), fecha, hora };
}

export function formatMonedaChile(monto: number): string {
  return `$${monto.toLocaleString("es-CL")}`;
}
