import React from "react";
import { Pedido } from "../types";
import { Phone, MessageCircle, CheckCircle2, Clock, Truck, ChevronRight, Receipt, ArrowRight, Boxes, AlertTriangle } from "lucide-react";

interface Props {
  pedido: Pedido;
  numeroParada?: number;
  onCambiarEstado: (idPedido: string, nuevoEstado: Pedido["estado"]) => void;
  onIniciarEntrega?: (pedido: Pedido) => void;
  onSeleccionar?: (pedido: Pedido) => void;
  onVerTicket?: (pedido: Pedido) => void;
}

export const TarjetaPedido: React.FC<Props> = ({
  pedido,
  numeroParada,
  onCambiarEstado,
  onIniciarEntrega,
  onSeleccionar,
  onVerTicket
}) => {
  const getBadgeEstado = () => {
    switch (pedido.estado) {
      case "ENTREGADO":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
            ✓ Entregado (Listo)
          </span>
        );
      case "EN_RUTA":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/50 animate-pulse">
            🚚 En Ruta
          </span>
        );
      case "CANCELADO":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/50">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-950/80 text-violet-300 border border-violet-800/50">
            ⏳ Pendiente
          </span>
        );
    }
  };

  const enviarWhatsAppAviso = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pedido.telefono) {
      alert("Este pedido no tiene número de teléfono registrado.");
      return;
    }
    const cleanPhone = pedido.telefono.replace(/[^0-9]/g, "");
    const mensaje = encodeURIComponent(
      `¡Hola ${pedido.nombreCliente}! Te escribimos de Neo-Envíos (NeoFaro) para avisarte sobre tu pedido #${pedido.idPedido}. Estado actual: ${pedido.estado}. Dirección de entrega: ${pedido.direccion}. Total: $${pedido.totalCobrar.toLocaleString()}. ¡Muchas gracias!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${mensaje}`, "_blank");
  };

  const saldoPendiente = pedido.saldoPendienteCobro ?? (pedido.esFiado ? pedido.totalCobrar : 0);

  return (
    <div
      onClick={() => onSeleccionar && onSeleccionar(pedido)}
      className="bg-zinc-900/90 rounded-2xl p-4 shadow-lg border border-zinc-800/80 hover:border-violet-500/50 transition-all active:scale-[0.99] flex flex-col gap-2.5 backdrop-blur-md"
    >
      {/* Línea 1: Parada (si está en ruta) + Cliente + Estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {pedido.estado === "EN_RUTA" && numeroParada !== undefined && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white text-xs font-black flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.6)]">
              {numeroParada}
            </div>
          )}
          <div>
            <h3 className="font-bold text-zinc-100 text-sm">{pedido.nombreCliente}</h3>
            <span className="text-[10px] text-zinc-400 font-mono">#{pedido.idPedido}</span>
          </div>
        </div>
        <div>{getBadgeEstado()}</div>
      </div>

      {/* Línea 2: Dirección & Horario */}
      <div className="text-xs text-zinc-300 space-y-1">
        <p className="font-medium flex items-start gap-1.5 text-zinc-200">
          <span className="text-cyan-400">📍</span> {pedido.direccion}
        </p>
        {pedido.itemsDetalle && (
          <p className="text-zinc-400 line-clamp-1 italic text-[11px]">
            📦 {pedido.itemsDetalle}
          </p>
        )}
      </div>

      {/* Badges de Envases Retornables y Saldo Pendiente */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {pedido.envasesRetornables && pedido.envasesRetornables.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-[10px] text-cyan-300">
            <Boxes className="w-3 h-3 text-cyan-400" />
            <span>
              {pedido.envasesRetornables.map(e => `${e.entregados} ${e.tipo}`).join(", ")}
            </span>
          </div>
        )}

        {saldoPendiente > 0 && pedido.estado === "ENTREGADO" && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-800/50 text-[10px] text-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Debe: ${saldoPendiente.toLocaleString()}</span>
          </div>
        )}

        {pedido.motivoCancelacion && (
          <div className="text-[10px] text-rose-400 italic">
            Motivo: {pedido.motivoCancelacion}
          </div>
        )}
      </div>

      {/* Línea 3: Total & Métodos */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
        <div className="text-xs">
          <span className="text-zinc-400 text-[11px]">Total: </span>
          <span className="font-black text-cyan-300 text-sm">${pedido.totalCobrar.toLocaleString()}</span>
          <span className="ml-1 text-[10px] text-zinc-400">({pedido.metodoPago})</span>
        </div>

        {/* Botón Ver Ticket */}
        {onVerTicket && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVerTicket(pedido);
            }}
            title="Generar y enviar Ticket Comercial por WhatsApp"
            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold border border-zinc-700/60 transition active:scale-95"
          >
            <Receipt className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ticket</span>
          </button>
        )}
      </div>

      {/* Línea 4: Selector Rápido de Estados */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40 gap-1.5" onClick={(e) => e.stopPropagation()}>
        <span className="text-[10px] font-bold text-zinc-500 uppercase">Cambiar estado:</span>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Si está pendiente, puede pasar a "En Ruta" o registrar entrega */}
          {pedido.estado === "PENDIENTE" && (
            <>
              <button
                onClick={() => onCambiarEstado(pedido.idPedido, "EN_RUTA")}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[11px] font-bold border border-amber-500/40 transition active:scale-95"
              >
                <Truck className="w-3 h-3 text-amber-400" />
                <span>Poner En Ruta</span>
              </button>

              <button
                onClick={() => {
                  if (onIniciarEntrega) {
                    onIniciarEntrega(pedido);
                  } else {
                    onCambiarEstado(pedido.idPedido, "ENTREGADO");
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-xl text-[11px] font-bold border border-cyan-500/40 transition active:scale-95"
              >
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                <span>Entregar</span>
              </button>
            </>
          )}

          {/* Si está en ruta, botón principal para registrar y finalizar entrega */}
          {pedido.estado === "EN_RUTA" && (
            <>
              <button
                onClick={() => onCambiarEstado(pedido.idPedido, "PENDIENTE")}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl text-[10px] transition"
              >
                Volver a Pendiente
              </button>

              <button
                onClick={() => {
                  if (onIniciarEntrega) {
                    onIniciarEntrega(pedido);
                  } else {
                    onCambiarEstado(pedido.idPedido, "ENTREGADO");
                  }
                }}
                className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-[11px] font-bold rounded-xl shadow-md border border-cyan-400/20 transition active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-200" />
                <span>Registrar Entrega</span>
              </button>
            </>
          )}

          {/* Si está entregado / listo */}
          {pedido.estado === "ENTREGADO" && (
            <button
              onClick={() => onCambiarEstado(pedido.idPedido, "PENDIENTE")}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl text-[10px] transition"
            >
              Reabrir Pedido
            </button>
          )}

          {pedido.telefono && (
            <button
              onClick={enviarWhatsAppAviso}
              title="Avisar por WhatsApp"
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700/60 transition active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
