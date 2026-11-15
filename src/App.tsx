import React, { useState, useEffect } from "react";
import {
  Package,
  Map as MapIcon,
  DollarSign,
  Plus,
  RefreshCw,
  Sparkles,
  Settings,
  TrendingUp,
  TrendingDown,
  Navigation,
  CheckCircle,
  Truck,
  Boxes,
  Users,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  Clock,
  Receipt,
  Calendar
} from "lucide-react";

import { Pedido, ResumenCaja, ProductoStock, ClienteRegistrado, UsuarioSesion, ComercioCliente, FiadoCliente, SugerenciaCercania } from "./types";
import {
  llamarApi,
  getSpreadsheetId,
  setSpreadsheetId,
  getStoreName,
  setStoreName,
  getSesionActual,
  cerrarSesion
} from "./api";
import { MapaRuta } from "./components/MapaRuta";
import { TarjetaPedido } from "./components/TarjetaPedido";
import { ModalNuevoPedido } from "./components/ModalNuevoPedido";
import { ModuloStock } from "./components/ModuloStock";
import { ModuloClientes } from "./components/ModuloClientes";
import { ModuloFiados } from "./components/ModuloFiados";
import { ModalTicket, construirMensajeWhatsApp } from "./components/ModalTicket";
import { ModalFinalizarEntrega } from "./components/ModalFinalizarEntrega";
import { BannerSugerenciasRuta } from "./components/BannerSugerenciasRuta";
import { PantallaLogin } from "./components/PantallaLogin";
import { PanelAdmin } from "./components/PanelAdmin";
import { NeoEnviosLogo } from "./components/NeoEnviosLogo";

// Fórmula matemática Haversine para calcular distancia exacta en metros entre 2 puntos GPS
function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Distancia mínima de un punto a una línea de ruta (segmentos entre paradas consecutivas)
function distanciaMinimaALaRuta(punto: { lat: number; lng: number }, puntosRuta: { lat: number; lng: number }[]): number {
  if (puntosRuta.length === 0) return Infinity;
  let minD = Infinity;

  // Evaluar distancia a cada parada activa
  for (const p of puntosRuta) {
    const d = calcularDistanciaMetros(punto.lat, punto.lng, p.lat, p.lng);
    if (d < minD) minD = d;
  }

  return minD;
}

// Búsqueda inteligente para emparejar un artículo del pedido con el catálogo de stock
function encontrarProductoStock(nombreItem: string, catalogoStock: ProductoStock[]): ProductoStock | undefined {
  if (!nombreItem) return undefined;
  const normItem = nombreItem.toLowerCase().trim();

  // 1. Coincidencia exacta
  let encontrado = catalogoStock.find(p => p.producto.toLowerCase().trim() === normItem);
  if (encontrado) return encontrado;

  // 2. Coincidencia por inclusión cruzada
  encontrado = catalogoStock.find(p => {
    const normP = p.producto.toLowerCase().trim();
    return normItem.includes(normP) || normP.includes(normItem);
  });
  if (encontrado) return encontrado;

  // 3. Coincidencia por palabras clave representativas (>3 letras)
  const palabrasItem = normItem.split(/\s+/).filter(w => w.length > 3 && !w.startsWith("x"));
  encontrado = catalogoStock.find(p => {
    const normP = p.producto.toLowerCase().trim();
    return palabrasItem.some(w => normP.includes(w));
  });
  return encontrado;
}

const HOY_FECHA = new Date().toISOString().split("T")[0];

// Pedidos de prueba iniciales con fechas programadas
const PEDIDOS_DEMO: Pedido[] = [
  {
    idPedido: "PED-101",
    fechaHora: "2026-11-14 11:30",
    fechaEntregaProgramada: HOY_FECHA,
    nombreCliente: "Martín Rivas",
    telefono: "+5491145678901",
    direccion: "Av. Corrientes 1500, Buenos Aires",
    latLng: "-34.6043,-58.3888",
    franjaHoraria: "13:00 - 14:00",
    itemsDetalle: "1x Combo Hamburguesa Doble + Papas",
    totalCobrar: 12500,
    metodoPago: "Efectivo",
    estado: "EN_RUTA",
    ordenRuta: 1
  },
  {
    idPedido: "PED-102",
    fechaHora: "2026-11-14 11:45",
    fechaEntregaProgramada: "2026-11-16", // Programado para otra fecha, pero queda a 180m de la ruta
    nombreCliente: "Lucía Benítez",
    telefono: "+5491133334444",
    direccion: "Av. Corrientes 1650, Buenos Aires",
    latLng: "-34.6050,-58.3900",
    franjaHoraria: "13:30 - 14:30",
    itemsDetalle: "2x Ensaladas César + 2x Aguas",
    totalCobrar: 16800,
    metodoPago: "Fiado (Pendiente)",
    estado: "PENDIENTE",
    ordenRuta: 0,
    esFiado: true
  },
  {
    idPedido: "PED-103",
    fechaHora: "2026-11-14 12:00",
    fechaEntregaProgramada: HOY_FECHA,
    nombreCliente: "Estudio Contable Pérez",
    telefono: "+5491199998888",
    direccion: "Av. Santa Fe 2200, Buenos Aires",
    latLng: "-34.5956,-58.4021",
    franjaHoraria: "14:00 - 15:00",
    itemsDetalle: "4x Menú Ejecutivo del Día",
    totalCobrar: 34000,
    metodoPago: "Efectivo",
    estado: "EN_RUTA",
    ordenRuta: 2
  }
];

const FIADOS_DEMO: FiadoCliente[] = [
  {
    idFiado: "FIA-101",
    nombreCliente: "Lucía Benítez",
    telefono: "+5491133334444",
    concepto: "Pedido #PED-102 (2x Ensaladas + Bebidas)",
    deudaInicial: 16800,
    abonos: 0,
    saldoPendiente: 16800,
    fechaRegistro: "2026-11-14",
    estado: "PENDIENTE"
  },
  {
    idFiado: "FIA-102",
    nombreCliente: "Carlos Menéndez",
    telefono: "+5491177889900",
    concepto: "Almuerzo semanal y gaseosas",
    deudaInicial: 28000,
    abonos: 15000,
    saldoPendiente: 13000,
    fechaRegistro: "2026-11-10",
    estado: "PENDIENTE"
  }
];

const PRODUCTOS_DEMO: ProductoStock[] = [
  { sku: "AGU-01", producto: "Bidón 20L Agua Purificada", precioCosto: 1500, precioVenta: 4500, stockActual: 45, stockMinimo: 10, categoria: "Aguas & Retornables" },
  { sku: "SOD-02", producto: "Sifón Soda 1.5L Retornable", precioCosto: 800, precioVenta: 2200, stockActual: 32, stockMinimo: 12, categoria: "Aguas & Retornables" },
  { sku: "HAM-03", producto: "Hamburguesa Doble Especial", precioCosto: 4500, precioVenta: 9500, stockActual: 24, stockMinimo: 5, categoria: "Comidas" },
  { sku: "PAP-04", producto: "Papas Rústicas Cheddar", precioCosto: 1800, precioVenta: 4200, stockActual: 18, stockMinimo: 6, categoria: "Acompañamientos" },
  { sku: "GAS-05", producto: "Coca Cola 1.5L", precioCosto: 1200, precioVenta: 2800, stockActual: 3, stockMinimo: 8, categoria: "Bebidas" },
  { sku: "PIZ-06", producto: "Pizza Muzzarella Clásica", precioCosto: 3800, precioVenta: 8900, stockActual: 12, stockMinimo: 4, categoria: "Pizzas" }
];

const CLIENTES_DEMO: ClienteRegistrado[] = [
  {
    idCliente: "CLI-01",
    nombre: "Martín Rivas",
    telefono: "+5491145678901",
    direccion: "Av. Corrientes 1500, Buenos Aires",
    notasDireccion: "Piso 4 Dpto A",
    totalPedidos: 5,
    envasesPendientes: { "Bidón 20L": 2 }
  },
  {
    idCliente: "CLI-02",
    nombre: "Lucía Benítez",
    telefono: "+5491133334444",
    direccion: "Av. Corrientes 1650, Buenos Aires",
    notasDireccion: "Local a la calle",
    totalPedidos: 3,
    envasesPendientes: { "Sifón de Soda": 1 }
  },
  {
    idCliente: "CLI-03",
    nombre: "Estudio Contable Pérez",
    telefono: "+5491199998888",
    direccion: "Av. Santa Fe 2200, Buenos Aires",
    notasDireccion: "Recepción 2do piso",
    totalPedidos: 8,
    envasesPendientes: { "Bidón 20L": 3, "Sifón de Soda": 2 }
  }
];

export function App() {
  const [usuarioActual, setUsuarioActual] = useState<UsuarioSesion | null>(getSesionActual());
  const [vistaAdminAbierta, setVistaAdminAbierta] = useState<boolean>(false);

  const [tab, setTab] = useState<"pedidos" | "mapa" | "fiados" | "stock" | "clientes" | "caja">("pedidos");
  const [pedidos, setPedidos] = useState<Pedido[]>(PEDIDOS_DEMO);
  const [fiados, setFiados] = useState<FiadoCliente[]>(FIADOS_DEMO);
  const [productos, setProductos] = useState<ProductoStock[]>(PRODUCTOS_DEMO);
  const [clientes, setClientes] = useState<ClienteRegistrado[]>(CLIENTES_DEMO);
  const [clienteParaPedido, setClienteParaPedido] = useState<ClienteRegistrado | null>(null);

  // Filtros de fecha y estado
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(HOY_FECHA);
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");

  // Lista de sugerencias de pedidos a <300m de la ruta
  const [sugerenciasCercanas, setSugerenciasCercanas] = useState<SugerenciaCercania[]>([]);
  const [sugerenciasDescartadasIds, setSugerenciasDescartadasIds] = useState<string[]>([]);

  // Tickets y Entrega en Caliente
  const [pedidoParaTicket, setPedidoParaTicket] = useState<Pedido | null>(null);
  const [fiadoParaTicket, setFiadoParaTicket] = useState<FiadoCliente | null>(null);
  const [pedidoParaFinalizar, setPedidoParaFinalizar] = useState<Pedido | null>(null);

  const [resumenCaja, setResumenCaja] = useState<ResumenCaja>({
    totalIngresos: 45200,
    totalGastos: 12000,
    saldoNeto: 33200,
    totalMovimientos: 14
  });

  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [configSheetId, setConfigSheetId] = useState(getSpreadsheetId());
  const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
  const [nombreTienda, setNombreTienda] = useState(getStoreName());

  const totalPendienteFiados = fiados
    .filter(f => f.estado === "PENDIENTE")
    .reduce((acc, f) => acc + f.saldoPendiente, 0);

  // DETECTOR DE CERCANÍA (< 300 METROS) A LA RUTA ACTIVA
  useEffect(() => {
    const pedidosEnRutaHoy = pedidos.filter(
      p => p.estado === "EN_RUTA" && p.latLng && p.latLng.includes(",")
    );

    if (pedidosEnRutaHoy.length === 0) {
      setSugerenciasCercanas([]);
      return;
    }

    const puntosRuta = pedidosEnRutaHoy.map(p => {
      const [lat, lng] = p.latLng.split(",").map(Number);
      return { lat, lng };
    });

    // Pedidos con fecha diferente o que no estén en ruta hoy
    const pedidosOtraFecha = pedidos.filter(p =>
      p.estado !== "ENTREGADO" &&
      p.estado !== "CANCELADO" &&
      p.estado !== "EN_RUTA" &&
      p.latLng &&
      p.latLng.includes(",") &&
      !sugerenciasDescartadasIds.includes(p.idPedido)
    );

    const hallados: SugerenciaCercania[] = [];

    for (const ped of pedidosOtraFecha) {
      const [lat, lng] = ped.latLng.split(",").map(Number);
      if (isNaN(lat) || isNaN(lng)) continue;

      const distancia = distanciaMinimaALaRuta({ lat, lng }, puntosRuta);
      // REGLA: Menor a 300 metros
      if (distancia <= 300) {
        hallados.push({
          pedido: ped,
          distanciaMetros: distancia
        });
      }
    }

    setSugerenciasCercanas(hallados);
  }, [pedidos, sugerenciasDescartadasIds]);

  const cargarDatos = async () => {
    const sheetId = getSpreadsheetId();
    if (!sheetId) return;

    setCargando(true);
    const res = await llamarApi<Pedido[]>("LISTAR_PEDIDOS", { filtros: { estado: filtroEstado } });
    if (res.success && res.data && res.data.length > 0) {
      setPedidos(res.data);
    }

    const resCaja = await llamarApi<ResumenCaja>("OBTENER_RESUMEN_CAJA");
    if (resCaja.success && resCaja.data) {
      setResumenCaja(resCaja.data);
    }
    setCargando(false);
  };

  useEffect(() => {
    if (usuarioActual) {
      cargarDatos();
    }
  }, [filtroEstado, usuarioActual]);

  const handleLogout = () => {
    cerrarSesion();
    setUsuarioActual(null);
    setVistaAdminAbierta(false);
  };

  if (!usuarioActual) {
    return (
      <PantallaLogin
        onLoginExitoso={(u) => {
          setUsuarioActual(u);
          if (u.rol === "ADMIN") {
            setVistaAdminAbierta(true);
          }
        }}
      />
    );
  }

  if (usuarioActual.rol === "ADMIN" && vistaAdminAbierta) {
    return (
      <PanelAdmin
        onCerrarSesion={handleLogout}
        onVolverALaApp={() => setVistaAdminAbierta(false)}
        onSeleccionarComercioParaVer={(c: ComercioCliente) => {
          setNombreTienda(c.nombreComercio);
          setConfigSheetId(c.spreadsheetId);
          setVistaAdminAbierta(false);
          cargarDatos();
        }}
      />
    );
  }

  const esAdmin = usuarioActual.rol === "ADMIN";

  const handleGuardarPedido = async (nuevoPedido: any) => {
    const sheetId = getSpreadsheetId();

    if (sheetId) {
      const res = await llamarApi("CREAR_PEDIDO", { pedido: nuevoPedido });
      if (res.success) {
        await cargarDatos();
        setClienteParaPedido(null);
        return;
      }
    }

    const idGenerado = "PED-" + Math.floor(100 + Math.random() * 900);
    const pedidoCompleto: Pedido = {
      ...nuevoPedido,
      idPedido: idGenerado,
      fechaHora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      fechaEntregaProgramada: nuevoPedido.fechaEntregaProgramada || fechaSeleccionada,
      estado: "PENDIENTE",
      ordenRuta: pedidos.length + 1
    };
    setPedidos([pedidoCompleto, ...pedidos]);

    if (nuevoPedido.metodoPago && nuevoPedido.metodoPago.toLowerCase().includes("fiad")) {
      const nuevoFiado: FiadoCliente = {
        idFiado: `FIA-${Date.now().toString().slice(-4)}`,
        nombreCliente: nuevoPedido.nombreCliente,
        telefono: nuevoPedido.telefono || "",
        concepto: `Pedido #${idGenerado} (${nuevoPedido.itemsDetalle || "Envío"})`,
        deudaInicial: nuevoPedido.totalCobrar,
        abonos: 0,
        saldoPendiente: nuevoPedido.totalCobrar,
        fechaRegistro: HOY_FECHA,
        estado: "PENDIENTE"
      };
      setFiados([nuevoFiado, ...fiados]);
    }

    setClienteParaPedido(null);
  };

  const handleCambiarEstado = async (idPedido: string, nuevoEstado: Pedido["estado"]) => {
    const sheetId = getSpreadsheetId();
    const pedidoTarget = pedidos.find(p => p.idPedido === idPedido);

    if (sheetId) {
      await llamarApi("ACTUALIZAR_ESTADO_PEDIDO", { idPedido, nuevoEstado });
      await cargarDatos();
      return;
    }

    if (pedidoTarget) {
      // 1. Si pasa a ENTREGADO: Descontar automáticamente del stock
      if (nuevoEstado === "ENTREGADO" && pedidoTarget.estado !== "ENTREGADO") {
        setProductos(prevStock => {
          return prevStock.map(prod => {
            let cant = 0;
            if (pedidoTarget.itemsEstructurados && pedidoTarget.itemsEstructurados.length > 0) {
              pedidoTarget.itemsEstructurados.forEach(it => {
                const match = encontrarProductoStock(it.nombre, prevStock);
                if (match && match.sku === prod.sku) cant += it.cantidad || 1;
              });
            } else if (pedidoTarget.itemsDetalle) {
              const match = encontrarProductoStock(pedidoTarget.itemsDetalle, prevStock);
              if (match && match.sku === prod.sku) cant += 1;
            }

            if (cant > 0) {
              return { ...prod, stockActual: Math.max(0, prod.stockActual - cant) };
            }
            return prod;
          });
        });
      }

      // 2. Si se reabre un pedido ENTREGADO -> PENDIENTE: Reponer unidades al stock
      if (nuevoEstado === "PENDIENTE" && pedidoTarget.estado === "ENTREGADO") {
        setProductos(prevStock => {
          return prevStock.map(prod => {
            let cant = 0;
            if (pedidoTarget.itemsEstructurados && pedidoTarget.itemsEstructurados.length > 0) {
              pedidoTarget.itemsEstructurados.forEach(it => {
                const match = encontrarProductoStock(it.nombre, prevStock);
                if (match && match.sku === prod.sku) cant += it.cantidad || 1;
              });
            } else if (pedidoTarget.itemsDetalle) {
              const match = encontrarProductoStock(pedidoTarget.itemsDetalle, prevStock);
              if (match && match.sku === prod.sku) cant += 1;
            }

            if (cant > 0) {
              return { ...prod, stockActual: prod.stockActual + cant };
            }
            return prod;
          });
        });
      }
    }

    setPedidos(pedidos.map(p => {
      if (p.idPedido === idPedido) {
        if (nuevoEstado === "ENTREGADO" && !p.metodoPago.toLowerCase().includes("fiad")) {
          setResumenCaja(prev => ({
            ...prev,
            totalIngresos: prev.totalIngresos + p.totalCobrar,
            saldoNeto: prev.saldoNeto + p.totalCobrar
          }));
        }
        return { ...p, estado: nuevoEstado };
      }
      return p;
    }));
  };

  // Manejo de Confirmación y Modificación de Entrega
  const handleConfirmarEntrega = async (datos: {
    pedidoId: string;
    itemsActualizados: any[];
    itemsDetalleTexto: string;
    nuevoTotal: number;
    montoAbonado: number;
    saldoPendiente: number;
    metodoPago: string;
    envases: any[];
    notasRepartidor: string;
  }) => {
    let pedidoModificado: Pedido | null = null;
    const clienteAsociado = clientes.find(
      c => c.nombre.toLowerCase() === pedidoParaFinalizar?.nombreCliente.toLowerCase()
    );

    // 1. Actualizar lista de pedidos con los nuevos datos
    const pedidosActualizados = pedidos.map(p => {
      if (p.idPedido === datos.pedidoId) {
        pedidoModificado = {
          ...p,
          estado: "ENTREGADO",
          itemsEstructurados: datos.itemsActualizados,
          itemsDetalle: datos.itemsDetalleTexto,
          totalCobrar: datos.nuevoTotal,
          montoAbonado: datos.montoAbonado,
          saldoPendienteCobro: datos.saldoPendiente,
          metodoPago: datos.metodoPago,
          envasesRetornables: datos.envases,
          notasRepartidor: datos.notasRepartidor
        };
        return pedidoModificado;
      }
      return p;
    });
    setPedidos(pedidosActualizados);

    // 2. DESCUENTO AUTOMÁTICO DE STOCK POR ENTREGA REALIZADA
    if (datos.itemsActualizados && datos.itemsActualizados.length > 0) {
      setProductos(prevStock => {
        return prevStock.map(prod => {
          let cantADescontar = 0;
          datos.itemsActualizados.forEach(it => {
            const match = encontrarProductoStock(it.nombre, prevStock);
            if (match && match.sku === prod.sku) {
              cantADescontar += it.cantidad || 1;
            }
          });

          if (cantADescontar > 0) {
            const nuevoStock = Math.max(0, prod.stockActual - cantADescontar);
            // Sincronizar stock con API de Sheets si hay conexión
            const sheetId = getSpreadsheetId();
            if (sheetId) {
              llamarApi("ACTUALIZAR_STOCK", { sku: prod.sku, nuevoStock });
            }
            return { ...prod, stockActual: nuevoStock };
          }
          return prod;
        });
      });
    }

    // 3. Si se cobró dinero en el momento, impacta en Caja
    if (datos.montoAbonado > 0) {
      setResumenCaja(prev => ({
        ...prev,
        totalIngresos: prev.totalIngresos + datos.montoAbonado,
        saldoNeto: prev.saldoNeto + datos.montoAbonado,
        totalMovimientos: prev.totalMovimientos + 1
      }));
    }

    // 3. Si quedó saldo pendiente monetario (fiado), se registra en Fiados
    if (datos.saldoPendiente > 0 && pedidoParaFinalizar) {
      const nuevoFiado: FiadoCliente = {
        idFiado: `FIA-${Date.now().toString().slice(-4)}`,
        nombreCliente: pedidoParaFinalizar.nombreCliente,
        telefono: pedidoParaFinalizar.telefono || "",
        concepto: `Saldo Entrega #${datos.pedidoId} (${datos.itemsDetalleTexto.slice(0, 35)})`,
        deudaInicial: datos.saldoPendiente,
        abonos: 0,
        saldoPendiente: datos.saldoPendiente,
        fechaRegistro: HOY_FECHA,
        estado: "PENDIENTE"
      };
      setFiados(prev => [nuevoFiado, ...prev]);
    }

    // 4. Actualizar envases adeudados (bidones, sifones, etc.) en la ficha del cliente
    if (datos.envases.length > 0 && pedidoParaFinalizar) {
      setClientes(prev =>
        prev.map(c => {
          if (c.nombre.toLowerCase() === pedidoParaFinalizar!.nombreCliente.toLowerCase()) {
            const envActuales = { ...(c.envasesPendientes || {}) };
            datos.envases.forEach(env => {
              const previo = envActuales[env.tipo] || 0;
              const nuevoSaldo = Math.max(0, previo + env.saldoEntrega);
              envActuales[env.tipo] = nuevoSaldo;
            });
            return { ...c, envasesPendientes: envActuales };
          }
          return c;
        })
      );
    }

    // 5. Sincronizar en Google Sheets
    const sheetId = getSpreadsheetId();
    if (sheetId && pedidoModificado) {
      llamarApi("ACTUALIZAR_ESTADO_PEDIDO", {
        idPedido: datos.pedidoId,
        nuevoEstado: "ENTREGADO",
        pedido: pedidoModificado
      });
    }

    // 6. ENVIAR AUTOMÁTICAMENTE EL TICKET POR WHATSAPP AL CLIENTE
    if (pedidoModificado && pedidoParaFinalizar) {
      const clienteParaTicketCalc: ClienteRegistrado = clienteAsociado || {
        idCliente: "CLI-TEMP",
        nombre: pedidoParaFinalizar.nombreCliente,
        telefono: pedidoParaFinalizar.telefono,
        direccion: pedidoParaFinalizar.direccion
      };

      const textoWhatsApp = construirMensajeWhatsApp({
        pedido: pedidoModificado,
        cliente: clienteParaTicketCalc,
        nombreComercio: usuarioActual.nombreComercio || nombreTienda
      });

      if (pedidoParaFinalizar.telefono) {
        const cleanPhone = pedidoParaFinalizar.telefono.replace(/[^0-9]/g, "");
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(textoWhatsApp)}`, "_blank");
      }

      // Dejar el ticket visible para confirmación o impresión
      setPedidoParaTicket(pedidoModificado);
    }

    setPedidoParaFinalizar(null);
  };

  const handleCancelarPedidoDesdeEntrega = (pedidoId: string, motivo: string) => {
    setPedidos(pedidos.map(p => {
      if (p.idPedido === pedidoId) {
        return {
          ...p,
          estado: "CANCELADO",
          motivoCancelacion: motivo
        };
      }
      return p;
    }));

    const sheetId = getSpreadsheetId();
    if (sheetId) {
      llamarApi("ACTUALIZAR_ESTADO_PEDIDO", {
        idPedido: pedidoId,
        nuevoEstado: "CANCELADO",
        motivo
      });
    }

    setPedidoParaFinalizar(null);
  };

  // Manejo de Aceptación / Rechazo de Sugerencias < 300 metros
  const handleAceptarSugerenciaUna = (idPedido: string) => {
    setPedidos(pedidos.map(p => {
      if (p.idPedido === idPedido) {
        return {
          ...p,
          fechaEntregaProgramada: fechaSeleccionada, // Cambia la fecha a hoy
          estado: "EN_RUTA" // Se suma a la ruta
        };
      }
      return p;
    }));
    setSugerenciasCercanas(sugerenciasCercanas.filter(s => s.pedido.idPedido !== idPedido));
  };

  const handleRechazarSugerenciaUna = (idPedido: string) => {
    setSugerenciasDescartadasIds([...sugerenciasDescartadasIds, idPedido]);
    setSugerenciasCercanas(sugerenciasCercanas.filter(s => s.pedido.idPedido !== idPedido));
  };

  const handleAceptarTodasSugerencias = () => {
    const ids = sugerenciasCercanas.map(s => s.pedido.idPedido);
    setPedidos(pedidos.map(p => {
      if (ids.includes(p.idPedido)) {
        return {
          ...p,
          fechaEntregaProgramada: fechaSeleccionada,
          estado: "EN_RUTA"
        };
      }
      return p;
    }));
    setSugerenciasCercanas([]);
  };

  const handleRechazarTodasSugerencias = () => {
    const ids = sugerenciasCercanas.map(s => s.pedido.idPedido);
    setSugerenciasDescartadasIds([...sugerenciasDescartadasIds, ...ids]);
    setSugerenciasCercanas([]);
  };

  const pedidosEnRutaCount = pedidos.filter(p => p.estado === "EN_RUTA").length;

  // Filtrado por fecha y estado seleccionado
  const pedidosFiltrados = pedidos.filter(p => {
    const coincideFecha = !fechaSeleccionada || p.fechaEntregaProgramada === fechaSeleccionada;
    if (!coincideFecha) return false;
    if (filtroEstado === "TODOS") return true;
    return p.estado === filtroEstado;
  });

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black text-zinc-100 border-x border-zinc-800 select-none overflow-hidden font-sans selection:bg-cyan-400 selection:text-black">
      {/* 1. Header NeoFaro */}
      <header className="bg-zinc-950/95 border-b border-zinc-800/80 px-4 pt-3 pb-3 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NeoEnviosLogo subtitulo={usuarioActual.nombreComercio || nombreTienda} size="sm" />
        </div>

        <div className="flex items-center gap-1.5">
          {esAdmin && (
            <button
              onClick={() => setVistaAdminAbierta(true)}
              title="Volver al Panel Maestro de Administración"
              className="px-2.5 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-violet-950/60 border border-violet-400/30 transition active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>Panel</span>
            </button>
          )}

          <button
            onClick={cargarDatos}
            title="Sincronizar con Google Sheets"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 active:scale-95 transition"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin text-cyan-400" : ""}`} />
          </button>
          <button
            onClick={() => setModalConfigAbierto(true)}
            title="Configuración de Base de Datos"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 active:scale-95 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            title="Cerrar Sesión e ingresar otro usuario"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-950/80 hover:text-rose-300 border border-zinc-800 text-zinc-400 active:scale-95 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Selector de Fecha de Entrega y En Ruta */}
      <div className="p-3 bg-zinc-950 border-b border-zinc-900 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Selector de Fecha */}
          <div className="flex-1 flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer w-full"
              style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
            />
          </div>

          {/* Botón rápido Hoy */}
          <button
            onClick={() => setFechaSeleccionada(HOY_FECHA)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              fechaSeleccionada === HOY_FECHA
                ? "bg-cyan-950/80 text-cyan-300 border-cyan-800/80"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
            }`}
          >
            Hoy
          </button>
        </div>

        {/* Resumen Superior */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div
            onClick={() => setTab("mapa")}
            className="bg-zinc-900/90 border border-amber-900/40 rounded-2xl p-2.5 flex items-center justify-between cursor-pointer active:scale-95 transition hover:border-amber-700/60"
          >
            <div>
              <span className="text-amber-400 block text-[10px] font-bold uppercase tracking-wider">
                EN RUTA ACTIVA
              </span>
              <span className="text-base font-black text-amber-300">{pedidosEnRutaCount} en mapa</span>
            </div>
            <Truck className="w-5 h-5 text-amber-400 opacity-90" />
          </div>

          <div
            onClick={() => setTab("fiados")}
            className="bg-zinc-900/90 border border-rose-900/40 rounded-2xl p-2.5 flex items-center justify-between cursor-pointer active:scale-95 transition hover:border-rose-700/60"
          >
            <div>
              <span className="text-rose-400 block text-[10px] font-bold uppercase tracking-wider">
                FIADOS POR COBRAR
              </span>
              <span className="text-base font-black text-rose-300">${totalPendienteFiados.toLocaleString()}</span>
            </div>
            <Clock className="w-5 h-5 text-rose-400 opacity-90" />
          </div>
        </div>
      </div>

      {/* 3. Banner Inteligente de Sugerencias a Menos de 300 Metros */}
      <BannerSugerenciasRuta
        sugerencias={sugerenciasCercanas}
        onAceptarUna={handleAceptarSugerenciaUna}
        onRechazarUna={handleRechazarSugerenciaUna}
        onAceptarTodas={handleAceptarTodasSugerencias}
        onRechazarTodas={handleRechazarTodasSugerencias}
      />

      {/* 4. Área Principal */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-3">
        {tab === "pedidos" && (
          <div className="space-y-3 pb-24">
            <div className="flex items-center justify-between gap-2">
              <div className="flex bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-xl text-xs font-semibold text-zinc-400">
                {["TODOS", "PENDIENTE", "EN_RUTA", "ENTREGADO"].map((estado) => (
                  <button
                    key={estado}
                    onClick={() => setFiltroEstado(estado)}
                    className={`px-2.5 py-1.5 rounded-lg transition ${
                      filtroEstado === estado ? "bg-zinc-800 text-cyan-300 font-bold shadow-sm" : "hover:text-zinc-200"
                    }`}
                  >
                    {estado === "TODOS" ? "Todos" : estado === "PENDIENTE" ? "Pend." : estado === "EN_RUTA" ? `En Ruta (${pedidosEnRutaCount})` : "Listos"}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setTab("mapa")}
                title="Ir al mapa interactivo de entregas"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-md border border-amber-400/30 active:scale-95 transition"
              >
                <MapIcon className="w-3.5 h-3.5 text-amber-200" />
                <span>Ver Mapa</span>
              </button>
            </div>

            {pedidosFiltrados.length === 0 ? (
              <div className="bg-zinc-950/80 rounded-2xl p-8 text-center border border-dashed border-zinc-800 text-zinc-500 mt-4">
                <Package className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                <p className="font-semibold text-sm text-zinc-300">No hay pedidos para {fechaSeleccionada}</p>
                <p className="text-xs mt-1 text-zinc-500">Toca el botón flotante '+' para programar un envío.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Banner de Modo Reparto si hay pedidos en ruta */}
                {filtroEstado === "EN_RUTA" && (
                  <div className="p-3 bg-gradient-to-r from-amber-950/60 to-zinc-900 border border-amber-800/60 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                        📋 Hoja de Ruta y Entregas
                      </span>
                      <p className="text-xs text-zinc-200 font-semibold">
                        {pedidosFiltrados.length} pedidos listos para despachar
                      </p>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Marca cada entrega a medida que llegues
                    </span>
                  </div>
                )}

                {pedidosFiltrados.map((pedido) => (
                  <TarjetaPedido
                    key={pedido.idPedido}
                    pedido={pedido}
                    numeroParada={pedido.ordenRuta > 0 ? pedido.ordenRuta : undefined}
                    onCambiarEstado={handleCambiarEstado}
                    onIniciarEntrega={(p) => setPedidoParaFinalizar(p)}
                    onVerTicket={(p) => {
                      setPedidoParaTicket(p);
                      setFiadoParaTicket(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB MAPA: Traza única y exclusivamente los pedidos EN_RUTA */}
        {tab === "mapa" && (
          <div className="h-full pb-20 flex flex-col">
            <div className="flex-1 min-h-[350px]">
              <MapaRuta pedidos={pedidos} />
            </div>
            <div className="p-2 text-center text-xs text-zinc-400">
              📍 El mapa traza exclusivamente los despachos en estado <strong>EN RUTA</strong>.
            </div>
          </div>
        )}

        {tab === "fiados" && (
          <ModuloFiados
            fiados={fiados}
            onRegistrarFiado={(f) => setFiados([f, ...fiados])}
            onRegistrarAbono={(id, m) => {
              setFiados(fiados.map(f => {
                if (f.idFiado === id) {
                  const nuevosAbonos = f.abonos + m;
                  const nuevoSaldo = Math.max(0, f.deudaInicial - nuevosAbonos);
                  setResumenCaja(prev => ({ ...prev, totalIngresos: prev.totalIngresos + m, saldoNeto: prev.saldoNeto + m }));
                  return { ...f, abonos: nuevosAbonos, saldoPendiente: nuevoSaldo, estado: nuevoSaldo <= 0 ? "PAGADO" : "PENDIENTE" };
                }
                return f;
              }));
            }}
            onVerTicketFiado={(f) => {
              setFiadoParaTicket(f);
              setPedidoParaTicket(null);
            }}
          />
        )}

        {tab === "stock" && (
          <ModuloStock
            productos={productos}
            onGuardarProducto={(p) => setProductos([p, ...productos])}
            onActualizarStock={(sku, n) => setProductos(productos.map(p => p.sku === sku ? { ...p, stockActual: n } : p))}
          />
        )}

        {tab === "clientes" && (
          <ModuloClientes
            clientes={clientes}
            onGuardarCliente={(c) => setClientes([c, ...clientes])}
            onCrearPedidoParaCliente={(cli) => {
              setClienteParaPedido(cli);
              setModalNuevoAbierto(true);
            }}
          />
        )}

        {tab === "caja" && (
          <div className="space-y-4 pb-24">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Balance del Negocio</span>
              <div className="text-3xl font-black text-cyan-300 tracking-tight">
                ${resumenCaja.saldoNeto.toLocaleString()}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Total Ventas</span>
                  </div>
                  <span className="text-lg font-black text-cyan-300">
                    +${resumenCaja.totalIngresos.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs mb-1">
                    <TrendingDown className="w-4 h-4" />
                    <span>Total Gastos</span>
                  </div>
                  <span className="text-lg font-black text-rose-300">
                    -${resumenCaja.totalGastos.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 5. Botón Flotante "+" */}
      {tab === "pedidos" && (
        <div className="fixed bottom-20 right-5 z-40 max-w-md">
          <button
            onClick={() => {
              setClienteParaPedido(null);
              setModalNuevoAbierto(true);
            }}
            className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 active:scale-95 text-white font-black text-sm rounded-full shadow-[0_0_20px_rgba(139,92,246,0.6)] border border-cyan-400/40 transition-all"
          >
            <Plus className="w-5 h-5 stroke-[3] text-cyan-200" />
            <span>NUEVO PEDIDO</span>
          </button>
        </div>
      )}

      {/* 6. Bottom Navigation Bar */}
      <nav className="bg-zinc-950/95 border-t border-zinc-800/80 px-2 py-2 flex items-center justify-around z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <button
          onClick={() => setTab("pedidos")}
          className={`flex flex-col items-center gap-1 transition ${
            tab === "pedidos" ? "text-cyan-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[9px]">Pedidos</span>
        </button>

        <button
          onClick={() => setTab("mapa")}
          className={`flex flex-col items-center gap-1 transition relative ${
            tab === "mapa" ? "text-amber-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span className="text-[9px]">Mapa</span>
          {pedidosEnRutaCount > 0 && (
            <span className="absolute -top-1 right-2 px-1 rounded-full bg-amber-500 text-black text-[9px] font-black">
              {pedidosEnRutaCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab("fiados")}
          className={`flex flex-col items-center gap-1 transition relative ${
            tab === "fiados" ? "text-rose-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[9px]">Fiados</span>
          {totalPendienteFiados > 0 && (
            <span className="absolute -top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setTab("stock")}
          className={`flex flex-col items-center gap-1 transition ${
            tab === "stock" ? "text-violet-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span className="text-[9px]">Stock</span>
        </button>

        <button
          onClick={() => setTab("clientes")}
          className={`flex flex-col items-center gap-1 transition ${
            tab === "clientes" ? "text-cyan-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[9px]">Clientes</span>
        </button>

        <button
          onClick={() => setTab("caja")}
          className={`flex flex-col items-center gap-1 transition ${
            tab === "caja" ? "text-cyan-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span className="text-[9px]">Caja</span>
        </button>
      </nav>

      {/* Modal Nuevo Pedido */}
      {modalNuevoAbierto && (
        <ModalNuevoPedido
          onCerrar={() => {
            setModalNuevoAbierto(false);
            setClienteParaPedido(null);
          }}
          onGuardar={handleGuardarPedido}
          clientesPreexistentes={clientes}
          productosStock={productos}
          clienteSeleccionadoInicial={clienteParaPedido}
          fechaDefault={fechaSeleccionada}
        />
      )}

      {/* Modal Finalizar Entrega en Caliente (con cambios, envases y cobro) */}
      {pedidoParaFinalizar && (
        <ModalFinalizarEntrega
          pedido={pedidoParaFinalizar}
          numeroParada={pedidoParaFinalizar.ordenRuta > 0 ? pedidoParaFinalizar.ordenRuta : undefined}
          productosStock={productos}
          cliente={clientes.find(c => c.nombre.toLowerCase() === pedidoParaFinalizar.nombreCliente.toLowerCase())}
          onCerrar={() => setPedidoParaFinalizar(null)}
          onConfirmarEntrega={handleConfirmarEntrega}
          onCancelarPedido={handleCancelarPedidoDesdeEntrega}
        />
      )}

      {/* Modal Ticket Digital */}
      {(pedidoParaTicket || fiadoParaTicket) && (
        <ModalTicket
          pedido={pedidoParaTicket}
          fiado={fiadoParaTicket}
          nombreComercio={usuarioActual.nombreComercio || nombreTienda}
          onCerrar={() => {
            setPedidoParaTicket(null);
            setFiadoParaTicket(null);
          }}
        />
      )}

      {/* Modal Configuración */}
      {modalConfigAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Conexión Google Sheets</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Nombre de tu Comercio</label>
                <input
                  type="text"
                  value={nombreTienda}
                  onChange={(e) => setNombreTienda(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-cyan-400"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Spreadsheet ID del Cliente</label>
                <input
                  type="text"
                  placeholder="Ej: 1A2b3C4d..."
                  value={configSheetId}
                  onChange={(e) => setConfigSheetId(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-[11px] text-white outline-none focus:ring-2 focus:ring-cyan-400"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setModalConfigAbierto(false)}
                className="w-1/2 py-2.5 border border-zinc-800 rounded-xl font-semibold text-zinc-400 text-xs hover:bg-zinc-900"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setSpreadsheetId(configSheetId.trim());
                  setStoreName(nombreTienda.trim());
                  setModalConfigAbierto(false);
                  cargarDatos();
                }}
                className="w-1/2 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-xl font-bold text-xs shadow-md border border-cyan-400/30"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
