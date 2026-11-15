import React, { useState } from "react";
import { FiadoCliente } from "../types";
import {
  BookOpen,
  Plus,
  Search,
  MessageCircle,
  DollarSign,
  User,
  Phone,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  X,
  CreditCard,
  Receipt
} from "lucide-react";

interface Props {
  fiados: FiadoCliente[];
  onRegistrarFiado: (fiado: FiadoCliente) => void;
  onRegistrarAbono: (idFiado: string, montoAbono: number) => void;
  onVerTicketFiado?: (fiado: FiadoCliente) => void;
}

export const ModuloFiados: React.FC<Props> = ({
  fiados,
  onRegistrarFiado,
  onRegistrarAbono,
  onVerTicketFiado
}) => {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"PENDIENTE" | "PAGADO" | "TODOS">("PENDIENTE");
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalAbonoAbierto, setModalAbonoAbierto] = useState(false);
  const [fiadoSeleccionado, setFiadoSeleccionado] = useState<FiadoCliente | null>(null);
  const [montoAbonoInput, setMontoAbonoInput] = useState("");

  // Formulario nuevo fiado
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [concepto, setConcepto] = useState("");
  const [deudaInicial, setDeudaInicial] = useState("");

  const totalPendienteCobro = fiados
    .filter((f) => f.estado === "PENDIENTE")
    .reduce((acc, f) => acc + f.saldoPendiente, 0);

  const totalCobrado = fiados.reduce((acc, f) => acc + f.abonos, 0);

  const fiadosFiltrados = fiados.filter((f) => {
    const coincideTexto =
      f.nombreCliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.telefono.includes(busqueda) ||
      f.concepto.toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideTexto) return false;
    if (filtro === "TODOS") return true;
    return f.estado === filtro;
  });

  const handleCrearFiado = (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(deudaInicial) || 0;
    if (!nombreCliente.trim() || monto <= 0) {
      alert("Por favor ingresa un nombre y un monto válido.");
      return;
    }

    const nuevo: FiadoCliente = {
      idFiado: `FIA-${Date.now().toString().slice(-5)}`,
      nombreCliente: nombreCliente.trim(),
      telefono: telefono.trim(),
      concepto: concepto.trim() || "Compra con fiado",
      deudaInicial: monto,
      abonos: 0,
      saldoPendiente: monto,
      fechaRegistro: new Date().toISOString().split("T")[0],
      estado: "PENDIENTE"
    };

    onRegistrarFiado(nuevo);
    setModalNuevoAbierto(false);
    setNombreCliente("");
    setTelefono("");
    setConcepto("");
    setDeudaInicial("");
  };

  const enviarWhatsAppCobro = (f: FiadoCliente, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!f.telefono) {
      alert("Este fiado no tiene teléfono de contacto.");
      return;
    }
    const cleanPhone = f.telefono.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `¡Hola ${f.nombreCliente}! Te recordamos de Neo-Envíos (NeoFaro) que tienes un saldo pendiente de $${f.saldoPendiente.toLocaleString()} correspondiente a "${f.concepto}". ¿Podrías confirmarnos cuándo pasarías a abonarlo? ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  const handleGuardarAbono = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiadoSeleccionado) return;
    const monto = parseFloat(montoAbonoInput) || 0;
    if (monto <= 0) {
      alert("Ingresa un monto válido para el abono.");
      return;
    }

    onRegistrarAbono(fiadoSeleccionado.idFiado, monto);
    setModalAbonoAbierto(false);
    setFiadoSeleccionado(null);
    setMontoAbonoInput("");
  };

  return (
    <div className="space-y-3 pb-24">
      {/* 1. Métricas Principales de Cuentas por Cobrar */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-3.5 shadow-lg backdrop-blur-md">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">POR COBRAR (FIADOS)</span>
          <span className="text-xl font-black text-rose-300 block mt-0.5">
            ${totalPendienteCobro.toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-400/80 block">
            {fiados.filter((f) => f.estado === "PENDIENTE").length} clientes con saldo
          </span>
        </div>

        <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-2xl p-3.5 shadow-lg backdrop-blur-md">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">TOTAL COBRADO</span>
          <span className="text-xl font-black text-cyan-300 block mt-0.5">
            ${totalCobrado.toLocaleString()}
          </span>
          <span className="text-[10px] text-cyan-400/80 block">abonos ingresados a caja</span>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Botón Nuevo Fiado */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar deudor o concepto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm"
          />
        </div>

        <button
          onClick={() => setModalNuevoAbierto(true)}
          className="flex items-center gap-1 px-3.5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition border border-rose-400/30"
        >
          <Plus className="w-4 h-4" />
          <span>Anotar Fiado</span>
        </button>
      </div>

      {/* Filtros de Estado */}
      <div className="flex bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-xl text-xs font-semibold text-zinc-400">
        <button
          onClick={() => setFiltro("PENDIENTE")}
          className={`flex-1 py-1.5 rounded-lg transition ${
            filtro === "PENDIENTE" ? "bg-zinc-800 text-rose-400 font-bold shadow-sm" : "hover:text-zinc-200"
          }`}
        >
          Pendientes ({fiados.filter((f) => f.estado === "PENDIENTE").length})
        </button>
        <button
          onClick={() => setFiltro("PAGADO")}
          className={`flex-1 py-1.5 rounded-lg transition ${
            filtro === "PAGADO" ? "bg-zinc-800 text-cyan-400 font-bold shadow-sm" : "hover:text-zinc-200"
          }`}
        >
          Saldados
        </button>
        <button
          onClick={() => setFiltro("TODOS")}
          className={`flex-1 py-1.5 rounded-lg transition ${
            filtro === "TODOS" ? "bg-zinc-800 text-zinc-100 font-bold shadow-sm" : "hover:text-zinc-200"
          }`}
        >
          Todos
        </button>
      </div>

      {/* Lista de Fiados */}
      {fiadosFiltrados.length === 0 ? (
        <div className="bg-zinc-950/80 rounded-2xl p-8 text-center border border-dashed border-zinc-800 text-zinc-500">
          <BookOpen className="w-9 h-9 mx-auto mb-2 text-zinc-600" />
          <p className="font-semibold text-xs text-zinc-400">No hay fiados en esta categoría</p>
          <p className="text-[11px] mt-1">Lleva el control de deudas y envía recordatorios por WhatsApp.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {fiadosFiltrados.map((item) => {
            const esPendiente = item.estado === "PENDIENTE";

            return (
              <div
                key={item.idFiado}
                className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800/80 shadow-md hover:border-violet-500/40 transition space-y-2.5 backdrop-blur-md"
              >
                {/* Cabecera Tarjeta: Deudor y Estado */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                      <span>{item.nombreCliente}</span>
                      <span className="text-[10px] text-zinc-500 font-mono font-normal">#{item.idFiado}</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5 italic">📝 {item.concepto}</p>
                  </div>

                  <div>
                    {esPendiente ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/70 text-rose-300 border border-rose-800/60">
                        Debe ${item.saldoPendiente.toLocaleString()}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
                        ✓ Saldado
                      </span>
                    )}
                  </div>
                </div>

                {/* Barra de progreso de pago */}
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-cyan-400 h-1.5 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((item.abonos / item.deudaInicial) * 100))}%`
                    }}
                  />
                </div>

                {/* Subtotales y Acciones */}
                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
                  <div className="space-x-2 text-[11px]">
                    <span>Total: <strong>${item.deudaInicial.toLocaleString()}</strong></span>
                    <span>•</span>
                    <span className="text-cyan-400">Abono: <strong>${item.abonos.toLocaleString()}</strong></span>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="flex items-center gap-1.5">
                    {/* Botón Ticket de Deuda */}
                    {onVerTicketFiado && (
                      <button
                        onClick={() => onVerTicketFiado(item)}
                        title="Ver Comprobante / Ticket de Deuda"
                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700/60 transition active:scale-95"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    )}

                    {item.telefono && esPendiente && (
                      <button
                        onClick={(e) => enviarWhatsAppCobro(item, e)}
                        title="Cobrar por WhatsApp"
                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700/60 transition active:scale-95"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}

                    {esPendiente && (
                      <button
                        onClick={() => {
                          setFiadoSeleccionado(item);
                          setMontoAbonoInput(item.saldoPendiente.toString());
                          setModalAbonoAbierto(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 border border-cyan-400/20"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-cyan-200" />
                        <span>Abonar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar Nuevo Fiado */}
      {modalNuevoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-100">Anotar Cuenta Fiada</h3>
              <button
                onClick={() => setModalNuevoAbierto(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearFiado} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Nombre del Cliente / Deudor</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Don Carlos Vecino"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="Ej: +54 9 11 4455 6677"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Concepto / ¿Qué se llevó?</label>
                <input
                  type="text"
                  placeholder="Ej: 2x Gaseosas y fiambre del domingo"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Monto de la Deuda ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={deudaInicial}
                  onChange={(e) => setDeudaInicial(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-black text-rose-400 focus:ring-2 focus:ring-rose-500 outline-none"
                  style={{ color: "#fb7185", WebkitTextFillColor: "#fb7185" }}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoAbierto(false)}
                  className="w-1/2 py-2.5 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-md border border-rose-400/30"
                >
                  Registrar Fiado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Abono */}
      {modalAbonoAbierto && fiadoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-zinc-100">Registrar Abono</h3>
                <p className="text-xs text-zinc-400">{fiadoSeleccionado.nombreCliente}</p>
              </div>
              <button
                onClick={() => setModalAbonoAbierto(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-900 border border-zinc-800/80 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Deuda Total:</span>
                <span>${fiadoSeleccionado.deudaInicial.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-400">
                <span>Saldo Pendiente Actual:</span>
                <span>${fiadoSeleccionado.saldoPendiente.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleGuardarAbono} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Monto que paga hoy ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={montoAbonoInput}
                  onChange={(e) => setMontoAbonoInput(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-base font-black text-cyan-300 focus:ring-2 focus:ring-cyan-400 outline-none"
                  style={{ color: "#22d3ee", WebkitTextFillColor: "#22d3ee" }}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbonoAbierto(false)}
                  className="w-1/2 py-2.5 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-md border border-cyan-400/30"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
