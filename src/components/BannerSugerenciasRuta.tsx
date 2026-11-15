import React from "react";
import { AlertTriangle, MapPin, Check, X, CheckCheck, XCircle } from "lucide-react";
import { SugerenciaCercania } from "../types";

interface Props {
  sugerencias: SugerenciaCercania[];
  onAceptarUna: (idPedido: string) => void;
  onRechazarUna: (idPedido: string) => void;
  onAceptarTodas: () => void;
  onRechazarTodas: () => void;
}

export const BannerSugerenciasRuta: React.FC<Props> = ({
  sugerencias,
  onAceptarUna,
  onRechazarUna,
  onAceptarTodas,
  onRechazarTodas
}) => {
  if (sugerencias.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-zinc-950 to-amber-950/80 border-y sm:border border-amber-500/40 sm:rounded-2xl p-3.5 space-y-3 shadow-xl backdrop-blur-md animate-fade-in">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-300 tracking-tight flex items-center gap-1.5">
              <span>¡Oportunidad de Entrega Cercana!</span>
              <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded-full font-mono">
                &lt; 300m
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Hay {sugerencias.length} pedido(s) programados para otra fecha pero quedan en el camino.
            </p>
          </div>
        </div>

        {/* Botones globales: Aceptar todos / Rechazar todos */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRechazarTodas}
            title="Ignorar todas las sugerencias por hoy"
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-[10px] font-bold flex items-center gap-1 transition active:scale-95"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descartar</span>
          </button>

          <button
            onClick={onAceptarTodas}
            title="Adelantar y sumar todos estos pedidos a la ruta de hoy"
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[10px] font-black flex items-center gap-1 shadow-md transition active:scale-95"
          >
            <CheckCheck className="w-3.5 h-3.5 stroke-[3]" />
            <span>Sumar Todos</span>
          </button>
        </div>
      </div>

      {/* Lista individual para Aceptar o Rechazar uno por uno */}
      <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
        {sugerencias.map(({ pedido, distanciaMetros }) => (
          <div
            key={pedido.idPedido}
            className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:border-amber-500/40 transition"
          >
            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-100 truncate">{pedido.nombreCliente}</span>
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                  a {distanciaMetros}m
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                📍 {pedido.direccion}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                <span>Fecha original: <strong className="text-zinc-300">{pedido.fechaEntregaProgramada}</strong></span>
                <span>•</span>
                <span className="text-cyan-400 font-bold">${pedido.totalCobrar.toLocaleString()}</span>
              </div>
            </div>

            {/* Acciones individuales: Aceptar o Rechazar este pedido */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onRechazarUna(pedido.idPedido)}
                title="Dejar para su fecha original"
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg transition active:scale-95 border border-zinc-700/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAceptarUna(pedido.idPedido)}
                title="Adelantar fecha a hoy y sumar a la ruta"
                className="flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black rounded-lg shadow-sm transition active:scale-95"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Entregar Hoy</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

