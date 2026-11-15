export interface ItemPedido {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface RegistroEnvaseRetornable {
  tipo: string; // ej: "Bidón 20L", "Sifón de Soda", "Bidón 12L", "Cajón"
  entregados: number; // unidades entregadas hoy
  devueltos: number; // unidades vacías que devolvió hoy
  saldoEntrega: number; // entregados - devueltos
  saldoTotalAcumulado?: number; // total que queda debiendo el cliente
}

export interface Pedido {
  idPedido: string;
  fechaHora: string;
  fechaEntregaProgramada: string; // "YYYY-MM-DD"
  nombreCliente: string;
  telefono: string;
  direccion: string;
  latLng: string; // "lat,lng"
  franjaHoraria: string;
  itemsDetalle: string;
  itemsEstructurados?: ItemPedido[];
  totalCobrar: number;
  montoAbonado?: number;
  saldoPendienteCobro?: number;
  envasesRetornables?: RegistroEnvaseRetornable[];
  metodoPago: string;
  estado: "PENDIENTE" | "EN_RUTA" | "ENTREGADO" | "CANCELADO";
  ordenRuta: number;
  notasRepartidor?: string;
  motivoCancelacion?: string;
  esFiado?: boolean;
}

export interface FiadoCliente {
  idFiado: string;
  idCliente?: string;
  nombreCliente: string;
  telefono: string;
  concepto: string;
  deudaInicial: number;
  abonos: number;
  saldoPendiente: number;
  fechaRegistro: string;
  fechaUltimoPago?: string;
  estado: "PENDIENTE" | "PAGADO";
}

export interface ProductoStock {
  sku: string;
  producto: string;
  precioCosto: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo?: number;
  categoria?: string;
}

export interface ClienteRegistrado {
  idCliente: string;
  nombre: string;
  telefono: string;
  direccion: string;
  latLng?: string;
  notasDireccion?: string;
  totalPedidos?: number;
  saldoPendienteTotal?: number;
  envasesPendientes?: { [tipoEnvase: string]: number };
}

export interface MovimientoCaja {
  fechaHora: string;
  tipo: "INGRESO" | "GASTO";
  categoria: string;
  descripcion: string;
  monto: number;
  metodoPago: string;
}

export interface ResumenCaja {
  totalIngresos: number;
  totalGastos: number;
  saldoNeto: number;
  totalMovimientos: number;
}

export interface ComercioCliente {
  idComercio: string;
  nombreComercio: string;
  emailPropietario: string;
  spreadsheetId: string;
  estadoSuscripcion: "ACTIVO" | "SUSPENDIDO";
  fechaAlta: string;
}

export interface UsuarioSesion {
  email: string;
  nombre: string;
  rol: "ADMIN" | "COMERCIO";
  idComercio?: string;
  nombreComercio?: string;
  spreadsheetId?: string;
}

export interface ResultadoGeocodificacion {
  place_id: number;
  display_name: string;
  lat: number;
  lng: number;
}

export interface SugerenciaCercania {
  pedido: Pedido;
  distanciaMetros: number;
}
