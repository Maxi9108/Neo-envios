import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Package,
  Boxes,
  Truck,
  MessageCircle,
  HelpCircle,
  Phone,
  RefreshCw,
  Search,
  Receipt
} from "lucide-react";
import { Pedido, ItemPedido, RegistroEnvaseRetornable, ProductoStock, ClienteRegistrado } from "../types";

interface Props {
  pedido: Pedido;
  numeroParada?: number;
  productosStock?: ProductoStock[];
  cliente?: ClienteRegistrado | null;
  tiposEnvasesConfigurados?: string[];
  onCerrar: () => void;
  onConfirmarEntrega: (datos: {
    pedidoId: string;
    itemsActualizados: ItemPedido[];
    itemsDetalleTexto: string;
    nuevoTotal: number;
    montoAbonado: number;
    saldoPendiente: number;
    metodoPago: string;
    envases: RegistroEnvaseRetornable[];
    notasRepartidor: string;
  }) => void;
  onCancelarPedido: (pedidoId: string, motivo: string) => void;
}

// Convertir string de items o crear lista estructurada inicial
function inicializarItems(pedido: Pedido): ItemPedido[] {
  if (pedido.itemsEstructurados && pedido.itemsEstructurados.length > 0) {
    return pedido.itemsEstructurados.map(it => ({ ...it }));
  }

  // Si no hay estructurados, parsear o crear un item a partir del texto
  if (pedido.itemsDetalle && pedido.itemsDetalle.trim()) {
    const partes = pedido.itemsDetalle.split(/,|\+/);
    if (partes.length > 1) {
      const precioPorItem = Math.round(pedido.totalCobrar / partes.length);
      return partes.map(p => {
        const limpia = p.trim();
        return {
          nombre: limpia,
          cantidad: 1,
          precioUnitario: precioPorItem,
          subtotal: precioPorItem
        };
      });
    }

    return [
      {
        nombre: pedido.itemsDetalle.trim(),
        cantidad: 1,
        precioUnitario: pedido.totalCobrar,
        subtotal: pedido.totalCobrar
      }
    ];
  }

  return [
    {
      nombre: "Consumo / Envío general",
      cantidad: 1,
      precioUnitario: pedido.totalCobrar,
      subtotal: pedido.totalCobrar
    }
  ];
}

export const ModalFinalizarEntrega: React.FC<Props> = ({
  pedido,
  numeroParada,
  productosStock = [],
  cliente,
  tiposEnvasesConfigurados = ["Bidón 20L", "Sifón de Soda", "Bidón 12L", "Cajón"],
  onCerrar,
  onConfirmarEntrega,
  onCancelarPedido
}) => {
  // Lista editable de items
  const [items, setItems] = useState<ItemPedido[]>(() => inicializarItems(pedido));

  // Buscador y agregado de productos del stock
  const [mostrarBuscadorStock, setMostrarBuscadorStock] = useState(false);
  const [busquedaStock, setBusquedaStock] = useState("");

  // Agregar ítem manual
  const [nuevoItemNombre, setNuevoItemNombre] = useState("");
  const [nuevoItemPrecio, setNuevoItemPrecio] = useState("");
  const [mostrarAgregarManual, setMostrarAgregarManual] = useState(false);

  // Envases retornables
  const [listaTiposEnvases, setListaTiposEnvases] = useState<string[]>(tiposEnvasesConfigurados);
  const [nuevoTipoEnvase, setNuevoTipoEnvase] = useState("");
  const [mostrarInputNuevoEnvase, setMostrarInputNuevoEnvase] = useState(false);

  // Estado de envases: { [tipo]: { entregados: number, devueltos: number } }
  const [envasesEstado, setEnvasesEstado] = useState<{
    [tipo: string]: { entregados: number; devueltos: number };
  }>(() => {
    const initial: { [tipo: string]: { entregados: number; devueltos: number } } = {};
    tiposEnvasesConfigurados.forEach(t => {
      initial[t] = { entregados: 0, devueltos: 0 };
    });
    return initial;
  });

  // Métodos de pago y cobro
  const [metodoPago, setMetodoPago] = useState<string>(pedido.metodoPago || "Efectivo");
  const [tipoCobro, setTipoCobro] = useState<"TOTAL" | "PARCIAL" | "FIADO">("TOTAL");
  const [montoCobradoManual, setMontoCobradoManual] = useState<string>(pedido.totalCobrar.toString());
  const [notasRepartidor, setNotasRepartidor] = useState<string>(pedido.notasRepartidor || "");

  // Cancelación
  const [mostrarConfirmarCancelacion, setMostrarConfirmarCancelacion] = useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  // Calcular total actual de items
  const totalCalculado = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);

  // Sincronizar monto cobrado cuando cambia el total y el modo es TOTAL
  useEffect(() => {
    if (tipoCobro === "TOTAL") {
      setMontoCobradoManual(totalCalculado.toString());
    } else if (tipoCobro === "FIADO") {
      setMontoCobradoManual("0");
    }
  }, [totalCalculado, tipoCobro]);

  const montoAbonadoReal = Math.max(0, parseFloat(montoCobradoManual) || 0);
  const saldoPendiente = Math.max(0, totalCalculado - montoAbonadoReal);

  // Modificación de cantidades de ítems
  const cambiarCantidadItem = (index: number, delta: number) => {
    setItems(prev => {
      return prev
        .map((it, idx) => {
          if (idx !== index) return it;
          const nuevaCant = Math.max(0, it.cantidad + delta);
          return {
            ...it,
            cantidad: nuevaCant,
            subtotal: nuevaCant * it.precioUnitario
          };
        })
        .filter(it => it.cantidad > 0);
    });
  };

  const eliminarItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const agregarProductoDesdeStock = (p: ProductoStock) => {
    const yaExisteIndex = items.findIndex(it => it.nombre.toLowerCase() === p.producto.toLowerCase());
    if (yaExisteIndex >= 0) {
      cambiarCantidadItem(yaExisteIndex, 1);
    } else {
      setItems([
        ...items,
        {
          nombre: p.producto,
          cantidad: 1,
          precioUnitario: p.precioVenta,
          subtotal: p.precioVenta
        }
      ]);
    }
    setMostrarBuscadorStock(false);
    setBusquedaStock("");
  };

  const agregarItemManual = () => {
    if (!nuevoItemNombre.trim()) return;
    const precio = parseFloat(nuevoItemPrecio) || 0;
    setItems([
      ...items,
      {
        nombre: nuevoItemNombre.trim(),
        cantidad: 1,
        precioUnitario: precio,
        subtotal: precio
      }
    ]);
    setNuevoItemNombre("");
    setNuevoItemPrecio("");
    setMostrarAgregarManual(false);
  };

  // Manejo de contadores de envases retornables
  const cambiarEnvase = (tipo: string, campo: "entregados" | "devueltos", delta: number) => {
    setEnvasesEstado(prev => {
      const actual = prev[tipo] || { entregados: 0, devueltos: 0 };
      const nuevoValor = Math.max(0, actual[campo] + delta);
      return {
        ...prev,
        [tipo]: {
          ...actual,
          [campo]: nuevoValor
        }
      };
    });
  };

  const agregarNuevoTipoEnvase = () => {
    const limpio = nuevoTipoEnvase.trim();
    if (!limpio || listaTiposEnvases.includes(limpio)) return;
    setListaTiposEnvases([...listaTiposEnvases, limpio]);
    setEnvasesEstado(prev => ({
      ...prev,
      [limpio]: { entregados: 0, devueltos: 0 }
    }));
    setNuevoTipoEnvase("");
    setMostrarInputNuevoEnvase(false);
  };

  // Finalizar entrega
  const handleFinalizar = () => {
    if (items.length === 0) {
      alert("El pedido debe contener al menos un producto. Si el cliente no quiso nada, utiliza 'Cancelar Pedido'.");
      return;
    }

    // Compilar envases retornables con movimiento o con saldo acumulado
    const envasesCompilados: RegistroEnvaseRetornable[] = [];
    listaTiposEnvases.forEach(tipo => {
      const reg = envasesEstado[tipo] || { entregados: 0, devueltos: 0 };
      const saldoEstaEntrega = reg.entregados - reg.devueltos;
      const deudaPrevia = cliente?.envasesPendientes?.[tipo] || 0;
      const saldoTotalAcumulado = deudaPrevia + saldoEstaEntrega;

      if (reg.entregados > 0 || reg.devueltos > 0 || saldoTotalAcumulado > 0) {
        envasesCompilados.push({
          tipo,
          entregados: reg.entregados,
          devueltos: reg.devueltos,
          saldoEntrega: saldoEstaEntrega,
          saldoTotalAcumulado: Math.max(0, saldoTotalAcumulado)
        });
      }
    });

    // Texto resumen para el pedido
    const detalleTexto = items.map(it => `${it.cantidad}x ${it.nombre}`).join(", ");

    onConfirmarEntrega({
      pedidoId: pedido.idPedido,
      itemsActualizados: items,
      itemsDetalleTexto: detalleTexto,
      nuevoTotal: totalCalculado,
      montoAbonado: montoAbonadoReal,
      saldoPendiente: saldoPendiente,
      metodoPago: saldoPendiente > 0 && montoAbonadoReal === 0 ? "Fiado (Pendiente)" : metodoPago,
      envases: envasesCompilados,
      notasRepartidor
    });
  };

  const handleConfirmarCancelacion = () => {
    onCancelarPedido(pedido.idPedido, motivoCancelacion.trim() || "Cliente canceló en el domicilio");
  };

  // Filtrado de stock para buscador
  const stockFiltrado = productosStock.filter(p =>
    p.producto.toLowerCase().includes(busquedaStock.toLowerCase()) ||
    (p.categoria && p.categoria.toLowerCase().includes(busquedaStock.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Cabecera */}
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {numeroParada !== undefined && (
              <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white text-xs font-black flex items-center justify-center shadow-md">
                {numeroParada}
              </span>
            )}
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Registrar Entrega</span>
                <span className="text-[10px] text-cyan-400 font-mono">#{pedido.idPedido}</span>
              </h2>
              <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">
                {pedido.nombreCliente} • {pedido.direccion}
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Tarjeta de información rápida del cliente */}
          <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Cliente y Destino:</span>
              <p className="text-zinc-200 font-semibold">{pedido.nombreCliente}</p>
              <p className="text-[11px] text-zinc-400">📍 {pedido.direccion}</p>
            </div>
            {pedido.telefono && (
              <a
                href={`tel:${pedido.telefono}`}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700/60 transition active:scale-95"
                title="Llamar al cliente"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* 1. SECCIÓN ARTÍCULOS Y CAMBIOS EN EL PEDIDO */}
          <div className="bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-violet-400" />
                <span className="font-bold text-zinc-200 text-xs uppercase tracking-wide">
                  Artículos del Pedido
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMostrarBuscadorStock(!mostrarBuscadorStock)}
                  className="px-2 py-1 bg-violet-950/80 hover:bg-violet-900 text-violet-300 rounded-lg text-[10px] font-bold border border-violet-800/60 flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Stock</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarAgregarManual(!mostrarAgregarManual)}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-semibold border border-zinc-700 transition"
                >
                  <span>+ Manual</span>
                </button>
              </div>
            </div>

            {/* Buscador de Stock para agregar cosas nuevas */}
            {mostrarBuscadorStock && (
              <div className="p-2.5 bg-zinc-900 rounded-xl border border-violet-500/30 space-y-2 animate-fade-in">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar producto en stock para agregar..."
                    value={busquedaStock}
                    onChange={e => setBusquedaStock(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-400"
                    style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {stockFiltrado.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 p-2 text-center">No se encontraron productos</p>
                  ) : (
                    stockFiltrado.map(p => (
                      <div
                        key={p.sku}
                        onClick={() => agregarProductoDesdeStock(p)}
                        className="p-2 rounded-lg bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800/50 flex items-center justify-between cursor-pointer transition active:scale-95"
                      >
                        <div>
                          <p className="font-semibold text-zinc-200 text-xs">{p.producto}</p>
                          <span className="text-[10px] text-zinc-400">Stock: {p.stockActual} u.</span>
                        </div>
                        <span className="font-bold text-cyan-400 text-xs">
                          +${p.precioVenta.toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Input para ítem manual */}
            {mostrarAgregarManual && (
              <div className="p-2.5 bg-zinc-900 rounded-xl border border-cyan-500/30 space-y-2 animate-fade-in">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Producto solicitado..."
                    value={nuevoItemNombre}
                    onChange={e => setNuevoItemNombre(e.target.value)}
                    className="col-span-2 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                  />
                  <input
                    type="number"
                    placeholder="Precio $"
                    value={nuevoItemPrecio}
                    onChange={e => setNuevoItemPrecio(e.target.value)}
                    className="col-span-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-bold"
                    style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                  />
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMostrarAgregarManual(false)}
                    className="px-2 py-1 text-zinc-400 hover:text-white text-[11px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={agregarItemManual}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[11px] font-bold"
                  >
                    Agregar Ítem
                  </button>
                </div>
              </div>
            )}

            {/* Lista de productos actuales en el pedido */}
            <div className="space-y-1.5">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800/70 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-200 text-xs truncate">{it.nombre}</p>
                    <span className="text-[10px] text-zinc-400">
                      ${it.precioUnitario.toLocaleString()} c/u
                    </span>
                  </div>

                  {/* Controles de cantidad */}
                  <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => cambiarCantidadItem(idx, -1)}
                      className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white active:scale-90"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-zinc-100 text-xs">
                      {it.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiarCantidadItem(idx, 1)}
                      className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-white active:scale-90"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <span className="font-black text-cyan-300 text-xs block">
                      ${it.subtotal.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminarItem(idx)}
                    className="p-1 text-zinc-500 hover:text-rose-400 transition"
                    title="Quitar del pedido"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Subtotal de compra */}
            <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-xs">
              <span className="text-zinc-400 font-semibold">Total de Artículos:</span>
              <span className="text-base font-black text-emerald-400">
                ${totalCalculado.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 2. SECCIÓN ENVASES RETORNABLES (BIDONES, SIFONES, CAJONES) */}
          <div className="bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-zinc-200 text-xs uppercase tracking-wide">
                  Envases Retornables (Bidones / Sifones)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMostrarInputNuevoEnvase(!mostrarInputNuevoEnvase)}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Otro envase</span>
              </button>
            </div>

            {mostrarInputNuevoEnvase && (
              <div className="flex gap-1.5 p-2 bg-zinc-900 rounded-xl border border-cyan-500/30">
                <input
                  type="text"
                  placeholder="Ej: Bidón 10L, Pallet, Cajón plástico..."
                  value={nuevoTipoEnvase}
                  onChange={e => setNuevoTipoEnvase(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
                <button
                  type="button"
                  onClick={agregarNuevoTipoEnvase}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-bold"
                >
                  Agregar
                </button>
              </div>
            )}

            <div className="space-y-2">
              {listaTiposEnvases.map(tipo => {
                const reg = envasesEstado[tipo] || { entregados: 0, devueltos: 0 };
                const dif = reg.entregados - reg.devueltos;
                const deudaPrevia = cliente?.envasesPendientes?.[tipo] || 0;
                const deudaFinal = deudaPrevia + dif;

                return (
                  <div
                    key={tipo}
                    className="p-2.5 bg-zinc-900/90 rounded-xl border border-zinc-800/70 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-200 text-xs flex items-center gap-1">
                        📦 {tipo}
                      </span>
                      {deudaFinal > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/50">
                          Deberá: {deudaFinal} u.
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-semibold">Al día (0 debe)</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {/* Entregados llenos */}
                      <div className="bg-zinc-950/80 p-1.5 rounded-lg border border-zinc-800/80 flex items-center justify-between">
                        <span className="text-zinc-400">Entregó:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => cambiarEnvase(tipo, "entregados", -1)}
                            className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                          >
                            -
                          </button>
                          <span className="font-bold text-cyan-300 w-4 text-center">
                            {reg.entregados}
                          </span>
                          <button
                            type="button"
                            onClick={() => cambiarEnvase(tipo, "entregados", 1)}
                            className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Devueltos vacíos */}
                      <div className="bg-zinc-950/80 p-1.5 rounded-lg border border-zinc-800/80 flex items-center justify-between">
                        <span className="text-zinc-400">Devolvió:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => cambiarEnvase(tipo, "devueltos", -1)}
                            className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                          >
                            -
                          </button>
                          <span className="font-bold text-emerald-400 w-4 text-center">
                            {reg.devueltos}
                          </span>
                          <button
                            type="button"
                            onClick={() => cambiarEnvase(tipo, "devueltos", 1)}
                            className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. SECCIÓN COBRO Y PAGO PENDIENTE */}
          <div className="bg-zinc-900/40 p-3.5 rounded-2xl border border-zinc-800/60 space-y-3">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-zinc-200 text-xs uppercase tracking-wide">
                Cobro y Estado de Pago
              </span>
            </div>

            {/* Selector rápido: Total / Parcial / Fiado */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setTipoCobro("TOTAL")}
                className={`py-1.5 rounded-lg font-bold text-[10px] transition ${
                  tipoCobro === "TOTAL"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Cobro Total
              </button>
              <button
                type="button"
                onClick={() => setTipoCobro("PARCIAL")}
                className={`py-1.5 rounded-lg font-bold text-[10px] transition ${
                  tipoCobro === "PARCIAL"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Pago Parcial
              </button>
              <button
                type="button"
                onClick={() => setTipoCobro("FIADO")}
                className={`py-1.5 rounded-lg font-bold text-[10px] transition ${
                  tipoCobro === "FIADO"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Fiado (0%)
              </button>
            </div>

            {/* Inputs de monto cobrado y método */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Monto Cobrado Hoy ($):</label>
                <input
                  type="number"
                  value={montoCobradoManual}
                  onChange={e => {
                    setTipoCobro("PARCIAL");
                    setMontoCobradoManual(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-black text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  style={{ color: "#34d399", WebkitTextFillColor: "#34d399" }}
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Forma de Pago:</label>
                <select
                  value={metodoPago}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 font-medium"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Tarjeta Débito">Tarjeta Débito</option>
                  <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                  <option value="Fiado (Pendiente)">Fiado (Pendiente)</option>
                </select>
              </div>
            </div>

            {/* Resumen de saldo pendiente si existe */}
            {saldoPendiente > 0 ? (
              <div className="p-2.5 bg-rose-950/40 rounded-xl border border-rose-800/60 flex items-center justify-between text-xs animate-fade-in">
                <div className="flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Queda como Deuda / Fiado:</span>
                </div>
                <span className="font-black text-rose-400 text-sm">
                  ${saldoPendiente.toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="p-2 bg-emerald-950/30 rounded-xl border border-emerald-800/40 flex items-center gap-1.5 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pago completado sin deuda pendiente.</span>
              </div>
            )}
          </div>

          {/* Notas u observaciones */}
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Observaciones / Nota del Repartidor:</label>
            <input
              type="text"
              placeholder="Ej: Dejó el dinero en el buzón, atendió la vecina..."
              value={notasRepartidor}
              onChange={e => setNotasRepartidor(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-medium"
              style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
            />
          </div>

          {/* Cancelar pedido si no se pudo entregar */}
          {mostrarConfirmarCancelacion ? (
            <div className="p-3 bg-rose-950/60 rounded-2xl border border-rose-700/70 space-y-2 animate-fade-in">
              <p className="font-bold text-rose-200 text-xs">¿Confirmas la cancelación de este pedido?</p>
              <input
                type="text"
                placeholder="Motivo (ej: Cliente ausente, canceló el pedido)..."
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-950 border border-rose-800/80 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarCancelacion(false)}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarCancelacion}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
                >
                  Sí, Cancelar Pedido
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMostrarConfirmarCancelacion(true)}
                className="text-[11px] text-rose-400/80 hover:text-rose-300 hover:underline"
              >
                El cliente canceló o no se pudo entregar este pedido
              </button>
            </div>
          )}
        </div>

        {/* Acciones de Footer */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
          <button
            type="button"
            onClick={onCerrar}
            className="w-1/3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs transition active:scale-95"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleFinalizar}
            className="w-2/3 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 border border-teal-300/40 transition active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Finalizar y Enviar Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};

