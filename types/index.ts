export interface Gasto {
  id: string;
  fecha: string;
  hora: string;
  monto: number;
  comercio: string;
  categoria: string;
  cuenta: string;
  gmailId: string;
  creadoPor: string;
  notas: string;
  comentario?: string;
  tipo?: "compra" | "transferencia";
  emoji?: string;
}

export interface Comercio {
  comercio: string;
  categoria: string;
  vecesUsado: number;
  ultimaVez: string;
}

export interface Categoria {
  nombre: string;
  emoji: string;
  color: string;
  presupuestoMensual: number;
  activa: boolean;
}

export interface Presupuesto {
  mes: string;
  categoria: string;
  presupuesto: number;
}

export interface ResumenCategoria {
  categoria: Categoria;
  gastado: number;
  presupuesto: number;
  porcentaje: number;
}
