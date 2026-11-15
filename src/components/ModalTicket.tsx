import React from "react";
import { X, MessageCircle, Printer, Share2, Receipt, AlertCircle, CheckCircle2, PackageCheck } from "lucide-react";
import { Pedido, FiadoCliente, RegistroEnvaseRetornable, ClienteRegistrado } from "../types";

interface Props {
  pedido?: Pedido | null;
  fiado?: FiadoCliente | null;
  cliente?: ClienteRegistrado | null;
  nombreComercio: string;
  onCerrar: () => void;
}

export function construirMensajeWhatsApp({
  pedido,
  fiado,
  cliente,
  nombreComercio
}: {
  pedido?: Pedido | null;
  fiado?: FiadoCliente | null;
  cliente?: ClienteRegistrado | null;
  nombreComercio: string;
}): string {
  const fechaActual = new Date().toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  const clienteNombre = pedido ? pedido.nombreCliente : fiado?.nombreCliente || "Cliente";
  const numeroReferencia = pedido ? pedido.idPedido : fiado?.idFiado || "";

  let mensaje = `*🧾 COMPROBANTE DIGITAL - ${nombreComercio.toUpperCase()}*\n`;
  mensaje += `_Familia NeoFaro_\n`;
  mensaje += `--------------------------------------\n`;
  mensaje += `📅 Fecha: ${fechaActual}\n`;
  mensaje += `👤 Cliente: ${clienteNombre}\n`;
  if (pedido?.direccion) {
    mensaje += `📍 Entrega: ${pedido.direccion}\n`;
  }
  mensaje += `🔖 Ref: #${numeroReferencia}\n`;
  mensaje += `--------------------------------------\n`;

  if (pedido) {
    mensaje += `*📦 DETALLE DE LA COMPRA / SERVICIO:*\n`;
    if (pedido.itemsEstructurados && pedido.itemsEstructurados.length > 0) {
      pedido.itemsEstructurados.forEach(it => {
        mensaje += `• ${it.cantidad}x ${it.nombre} ($${it.precioUnitario.toLocaleString()}) = *$${it.subtotal.toLocaleString()}*\n`;
      });
    } else {
      mensaje += `• ${pedido.itemsDetalle || "Consumo general"}\n`;
    }

    mensaje += `\n*💵 Monto Total:* $${pedido.totalCobrar.toLocaleString()}\n`;

    if (pedido.montoAbonado !== undefined) {
      mensaje += `*💳 Total Abonado Hoy:* $${pedido.montoAbonado.toLocaleString()} (${pedido.metodoPago})\n`;
    } else {
      mensaje += `*💳 Forma de Pago:* ${pedido.metodoPago}\n`;
    }

    // Saldo pendiente de pago monetario
    const saldoPendiente = pedido.saldoPendienteCobro ?? (pedido.esFiado ? pedido.totalCobrar : 0);
    if (saldoPendiente > 0) {
      mensaje += `\n*⚠️ SALDO PENDIENTE A ABONAR:* $${saldoPendiente.toLocaleString()}\n`;
      mensaje += `_(Registrado en su cuenta de cliente)_\n`;
    } else {
      mensaje += `*Estado Pago:* ✅ Totalmente Pagado\n`;
    }

    // Envases Retornables (Bidones, Sifones, Cajones, etc.)
    if (pedido.envasesRetornables && pedido.envasesRetornables.length > 0) {
      const conMovimiento = pedido.envasesRetornables.filter(
        e => e.entregados > 0 || e.devueltos > 0 || (e.saldoTotalAcumulado && e.saldoTotalAcumulado > 0)
      );

      if (conMovimiento.length > 0) {
        mensaje += `\n*🔄 CONTROL DE ENVASES RETORNABLES:*\n`;
        conMovimiento.forEach(env => {
          mensaje += `• *${env.tipo}:*\n`;
          mensaje += `   - Entregados llenos: ${env.entregados} u.\n`;
          mensaje += `   - Recibidos vacíos: ${env.devueltos} u.\n`;
          if (env.saldoTotalAcumulado !== undefined && env.saldoTotalAcumulado > 0) {
            mensaje += `   *⚠️ Pendiente actual en su poder: ${env.saldoTotalAcumulado} u.*\n`;
          } else if (env.saldoEntrega !== 0) {
            mensaje += `   *Diferencia hoy: ${env.saldoEntrega > 0 ? "+" : ""}${env.saldoEntrega} u.*\n`;
          }
        });
      }
    }
  }

  if (fiado) {
    mensaje += `\n*📋 ESTADO DE CUENTA / FIADOS:*\n`;
    mensaje += `• Concepto: ${fiado.concepto}\n`;
    mensaje += `• Deuda Inicial: $${fiado.deudaInicial.toLocaleString()}\n`;
    mensaje += `• Total Abonado: $${fiado.abonos.toLocaleString()}\n`;
    mensaje += `*SALDO PENDIENTE: $${fiado.saldoPendiente.toLocaleString()}*\n`;
  }

  // Si el cliente en ficha general tiene envases pendientes acumulados
  if (cliente?.envasesPendientes) {
    const tipos = Object.keys(cliente.envasesPendientes).filter(k => (cliente.envasesPendientes?.[k] || 0) > 0);
    if (tipos.length > 0 && (!pedido || !pedido.envasesRetornables || pedido.envasesRetornables.length === 0)) {
      mensaje += `\n*⚠️ ENVASES RETORNABLES EN SU PODER:*\n`;
      tipos.forEach(t => {
        mensaje += `• ${t}: ${cliente.envasesPendientes?.[t]} unidad(es)\n`;
      });
    }
  }

  mensaje += `\n--------------------------------------\n`;
  mensaje += `¡Muchas gracias por su preferencia! ✨\n`;
  mensaje += `_Neo-Envíos • Familia NeoFaro_`;

  return mensaje;
}

export const ModalTicket: React.FC<Props> = ({
  pedido,
  fiado,
  cliente,
  nombreComercio,
  onCerrar
}) => {
  if (!pedido && !fiado) return null;

  const fechaActual = new Date().toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  const clienteNombre = pedido ? pedido.nombreCliente : fiado?.nombreCliente || "Cliente";
  const clienteTelefono = pedido ? pedido.telefono : fiado?.telefono || "";
  const numeroReferencia = pedido ? pedido.idPedido : fiado?.idFiado || "";

  const enviarTicketPorWhatsApp = () => {
    if (!clienteTelefono) {
      alert("No hay un teléfono registrado para este comprobante.");
      return;
    }
    const cleanPhone = clienteTelefono.replace(/[^0-9]/g, "");
    const texto = construirMensajeWhatsApp({ pedido, fiado, cliente, nombreComercio });
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const imprimirTicket = () => {
    window.print();
  };

  const saldoPendiente = pedido
    ? (pedido.saldoPendienteCobro ?? (pedido.esFiado ? pedido.totalCobrar : 0))
    : fiado?.saldoPendiente || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Cabecera */}
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm text-zinc-100">Ticket Comercial Digital</span>
          </div>
          <button
            onClick={onCerrar}
            className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Ticket térmico */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-mono">
          <div className="bg-white text-zinc-900 p-4 sm:p-5 rounded-2xl shadow-inner border border-zinc-300 space-y-3 relative overflow-hidden">
            {/* Encabezado */}
            <div className="text-center border-b border-dashed border-zinc-300 pb-2.5">
              <h2 className="text-base font-black tracking-tight">{nombreComercio.toUpperCase()}</h2>
              <p className="text-[10px] text-zinc-500 font-sans">Ecosistema de Comercio NeoFaro</p>
              <p className="text-[10px] text-zinc-400 mt-1">{fechaActual}</p>
            </div>

            {/* Datos Cliente */}
            <div className="text-[11px] space-y-0.5 border-b border-dashed border-zinc-300 pb-2.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Cliente:</span>
                <span className="font-bold">{clienteNombre}</span>
              </div>
              {clienteTelefono && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Tel:</span>
                  <span>{clienteTelefono}</span>
                </div>
              )}
              {pedido?.direccion && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Dirección:</span>
                  <span className="text-right truncate max-w-[160px]">{pedido.direccion}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Comprobante:</span>
                <span className="font-bold">#{numeroReferencia}</span>
              </div>
            </div>

            {/* Detalle si es Pedido */}
            {pedido && (
              <div className="space-y-2 border-b border-dashed border-zinc-300 pb-2.5">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                  Artículos Adquiridos:
                </span>

                {pedido.itemsEstructurados && pedido.itemsEstructurados.length > 0 ? (
                  <div className="space-y-1">
                    {pedido.itemsEstructurados.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span className="text-zinc-800">
                          {it.cantidad}x {it.nombre}
                        </span>
                        <span className="font-semibold text-zinc-900">
                          ${it.subtotal.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] font-sans font-medium text-zinc-800 bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                    {pedido.itemsDetalle || "Consumo general"}
                  </p>
                )}

                <div className="pt-1.5 border-t border-zinc-200 space-y-0.5">
                  <div className="flex justify-between text-xs font-black">
                    <span>TOTAL COMPRA:</span>
                    <span className="text-zinc-900">${pedido.totalCobrar.toLocaleString()}</span>
                  </div>

                  {pedido.montoAbonado !== undefined && (
                    <div className="flex justify-between text-[11px] text-emerald-700 font-semibold">
                      <span>Abonado hoy:</span>
                      <span>${pedido.montoAbonado.toLocaleString()} ({pedido.metodoPago})</span>
                    </div>
                  )}

                  {saldoPendiente > 0 && (
                    <div className="flex justify-between text-xs font-black text-rose-700 pt-0.5">
                      <span>SALDO PENDIENTE:</span>
                      <span>${saldoPendiente.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sección Envases Retornables (Bidones, Sifones, etc.) */}
            {pedido?.envasesRetornables && pedido.envasesRetornables.length > 0 && (
              <div className="space-y-1.5 border-b border-dashed border-zinc-300 pb-2.5">
                <span className="text-[10px] text-zinc-600 uppercase font-black block">
                  Envases Retornables (Bidones / Sifones):
                </span>
                <div className="space-y-1 text-[11px]">
                  {pedido.envasesRetornables.map((env, idx) => (
                    <div key={idx} className="bg-zinc-50 p-1.5 rounded border border-zinc-200 text-zinc-700">
                      <div className="flex justify-between font-bold text-zinc-900">
                        <span>• {env.tipo}</span>
                        <span>
                          {env.saldoTotalAcumulado !== undefined && env.saldoTotalAcumulado > 0
                            ? `Debe: ${env.saldoTotalAcumulado} u.`
                            : "0 pendiente"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                        <span>Entregó: {env.entregados} u.</span>
                        <span>Devolvió: {env.devueltos} u.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalle si es Cuenta Pendiente / Fiado independiente */}
            {fiado && (
              <div className="space-y-2 border-b border-dashed border-zinc-300 pb-2.5">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                  Detalle de Deuda / Fiado:
                </span>
                <p className="text-[11px] font-sans text-zinc-700 bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                  {fiado.concepto}
                </p>

                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between text-zinc-600">
                    <span>Deuda Original:</span>
                    <span>${fiado.deudaInicial.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Abonado a la fecha:</span>
                    <span>-${fiado.abonos.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-sm font-black text-rose-700 border-t border-zinc-200">
                    <span>SALDO PENDIENTE:</span>
                    <span>${fiado.saldoPendiente.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Ticket */}
            <div className="text-center pt-1 space-y-0.5">
              <p className="text-[10px] font-bold text-zinc-700">¡Muchas gracias por su preferencia!</p>
              <p className="text-[9px] text-zinc-400 font-sans">Comprobante no válido como factura fiscal</p>
            </div>
          </div>
        </div>

        {/* Acciones de Envío / Impresión */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
          <button
            onClick={imprimirTicket}
            className="w-1/3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={enviarTicketPorWhatsApp}
            className="w-2/3 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-950/50 border border-teal-300/30"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar por WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
