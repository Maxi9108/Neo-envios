import React, { useState, useEffect } from "react";
import { X, MapPin, Phone, User, DollarSign, Package, Clock, Loader2, Sparkles, Navigation, ListFilter, Calendar } from "lucide-react";
import { buscarLocalidadesDireccion } from "../api";
import { ClienteRegistrado, ProductoStock, ResultadoGeocodificacion } from "../types";
import { SelectorUbicacionMapa } from "./SelectorUbicacionMapa";

interface Props {
  onCerrar: () => void;
  onGuardar: (pedido: any) => Promise<void>;
  clientesPreexistentes?: ClienteRegistrado[];
  productosStock?: ProductoStock[];
  clienteSeleccionadoInicial?: ClienteRegistrado | null;
  fechaDefault?: string;
}

export const ModalNuevoPedido: React.FC<Props> = ({
  onCerrar,
  onGuardar,
  clientesPreexistentes = [],
  productosStock = [],
  clienteSeleccionadoInicial = null,
  fechaDefault
}) => {
  const hoyStr = new Date().toISOString().split("T")[0];
  const [nombreCliente, setNombreCliente] = useState(clienteSeleccionadoInicial?.nombre || "");
  const [telefono, setTelefono] = useState(clienteSeleccionadoInicial?.telefono || "");
  const [direccion, setDireccion] = useState(clienteSeleccionadoInicial?.direccion || "");
  const [latLng, setLatLng] = useState(clienteSeleccionadoInicial?.latLng || "");
  const [fechaEntregaProgramada, setFechaEntregaProgramada] = useState(fechaDefault || hoyStr);
  const [itemsDetalle, setItemsDetalle] = useState("");
  const [totalCobrar, setTotalCobrar] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [franjaHoraria, setFranjaHoraria] = useState("Inmediato");
  const [notas, setNotas] = useState(clienteSeleccionadoInicial?.notasDireccion || "");

  const [cargando, setCargando] = useState(false);
  const [modalMapaAbierto, setModalMapaAbierto] = useState(false);

  const [sugerenciasLocalidades, setSugerenciasLocalidades] = useState<ResultadoGeocodificacion[]>([]);
  const [buscandoLocalidades, setBuscandoLocalidades] = useState(false);

  useEffect(() => {
    if (!direccion || direccion.trim().length < 4) {
      setSugerenciasLocalidades([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoLocalidades(true);
      const resultados = await buscarLocalidadesDireccion(direccion);
      setSugerenciasLocalidades(resultados);
      setBuscandoLocalidades(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [direccion]);

  const seleccionarSugerencia = (sug: ResultadoGeocodificacion) => {
    setDireccion(sug.display_name);
    setLatLng(`${sug.lat},${sug.lng}`);
    setSugerenciasLocalidades([]);
  };

  const seleccionarClienteExistente = (c: ClienteRegistrado) => {
    setNombreCliente(c.nombre);
    setTelefono(c.telefono);
    setDireccion(c.direccion);
    if (c.latLng) setLatLng(c.latLng);
    if (c.notasDireccion) setNotas(c.notasDireccion);
  };

  const agregarProductoAlDetalle = (p: ProductoStock) => {
    const textoActual = itemsDetalle ? `${itemsDetalle}, 1x ${p.producto}` : `1x ${p.producto}`;
    setItemsDetalle(textoActual);
    const montoActual = parseFloat(totalCobrar) || 0;
    setTotalCobrar((montoActual + p.precioVenta).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCliente.trim() || !direccion.trim()) {
      alert("Por favor completa el nombre del cliente y la dirección.");
      return;
    }

    setCargando(true);

    let finalLatLng = latLng;
    if (!finalLatLng) {
      const res = await buscarLocalidadesDireccion(direccion);
      if (res && res.length > 0) {
        finalLatLng = `${res[0].lat},${res[0].lng}`;
      }
    }

    const nuevoPedido = {
      nombreCliente,
      telefono,
      direccion,
      latLng: finalLatLng,
      fechaEntregaProgramada: fechaEntregaProgramada || hoyStr,
      franjaHoraria,
      itemsDetalle,
      totalCobrar: parseFloat(totalCobrar) || 0,
      metodoPago,
      notasRepartidor: notas
    };

    await onGuardar(nuevoPedido);
    setCargando(false);
    onCerrar();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Cabecera modal */}
          <div className="px-6 py-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Nuevo Pedido con Envío</span>
                <span className="text-[9px] font-mono bg-violet-950/80 text-violet-300 border border-violet-800/60 px-1.5 py-0.5 rounded">
                  NeoFaro
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Programa la fecha y ruta de entrega</p>
            </div>
            <button
              onClick={onCerrar}
              className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario scrollable */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm">
            {/* Clientes frecuentes */}
            {clientesPreexistentes.length > 0 && !clienteSeleccionadoInicial && (
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Clientes Frecuentes
                </span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {clientesPreexistentes.map((c) => (
                    <button
                      key={c.idCliente}
                      type="button"
                      onClick={() => seleccionarClienteExistente(c)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-violet-950/60 hover:text-cyan-300 rounded-xl text-xs font-medium text-zinc-300 whitespace-nowrap border border-zinc-800 transition"
                    >
                      👤 {c.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fecha Programada de Entrega (Requisito clave) */}
            <div className="p-3 bg-zinc-900/90 border border-violet-500/30 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Fecha Programada de Envío</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {fechaEntregaProgramada === hoyStr ? "Para Hoy" : "Programado"}
                </span>
              </div>
              <input
                type="date"
                required
                value={fechaEntregaProgramada}
                onChange={(e) => setFechaEntregaProgramada(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-cyan-400 outline-none font-bold"
                style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Destinatario / Cliente</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Gómez"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium transition"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Teléfono (WhatsApp)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  placeholder="Ej: +54 9 11 5555 4444"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium transition"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>
            </div>

            {/* Dirección con Selector en Mapa y Lista de Localidades */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-300">Dirección de Entrega</label>
                <button
                  type="button"
                  onClick={() => setModalMapaAbierto(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Elegir en el Mapa</span>
                </button>
              </div>

              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. San Martín 1200..."
                  value={direccion}
                  onChange={(e) => {
                    setDireccion(e.target.value);
                    setLatLng("");
                  }}
                  className="w-full pl-10 pr-9 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium transition"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
                {buscandoLocalidades && (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3 top-3" />
                )}
              </div>

              {sugerenciasLocalidades.length > 0 && (
                <div className="mt-1.5 p-2 bg-zinc-900 border border-violet-500/40 rounded-2xl space-y-1.5 shadow-lg">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 uppercase px-1">
                    <ListFilter className="w-3 h-3" />
                    <span>Varias localidades encontradas. Selecciona una:</span>
                  </div>
                  {sugerenciasLocalidades.map((sug) => (
                    <div
                      key={sug.place_id}
                      onClick={() => seleccionarSugerencia(sug)}
                      className="p-2 bg-zinc-950 hover:bg-violet-950/60 rounded-xl border border-zinc-800 cursor-pointer text-xs text-zinc-200 flex items-start gap-1.5 transition active:scale-[0.99]"
                    >
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{sug.display_name}</span>
                    </div>
                  ))}
                </div>
              )}

              {latLng && (
                <p className="text-[11px] text-cyan-400 font-medium mt-1 flex items-center gap-1">
                  ✓ Coordenadas fijadas ({latLng})
                </p>
              )}
            </div>

            {/* Catálogo Rápido de Stock */}
            {productosStock.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Catálogo Rápido (Click para sumar)
                </span>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {productosStock.map((p) => (
                    <button
                      key={p.sku}
                      type="button"
                      onClick={() => agregarProductoAlDetalle(p)}
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-cyan-300 rounded-xl text-xs font-medium whitespace-nowrap hover:bg-violet-950/60 transition active:scale-95"
                    >
                      + {p.producto} (${p.precioVenta.toLocaleString()})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Detalle */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Detalle del Pedido</label>
              <div className="relative">
                <Package className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Ej: 1x Promo Hamburguesa + Gaseosa"
                  value={itemsDetalle}
                  onChange={(e) => setItemsDetalle(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium transition"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>
            </div>

            {/* Monto y Método */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Total a Cobrar ($)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={totalCobrar}
                    onChange={(e) => setTotalCobrar(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl font-bold text-cyan-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                    style={{ color: "#22d3ee", WebkitTextFillColor: "#22d3ee" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="MercadoPago">MercadoPago</option>
                  <option value="Fiado (Pendiente)">Fiado (Anotar Deuda)</option>
                  <option value="Pagado">Ya Pagado</option>
                </select>
              </div>
            </div>

            {/* Horario y Notas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Franja Horaria</label>
                <input
                  type="text"
                  placeholder="Inmediato"
                  value={franjaHoraria}
                  onChange={(e) => setFranjaHoraria(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-cyan-400 outline-none font-medium"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Piso / Notas</label>
                <input
                  type="text"
                  placeholder="Ej: Timbre 4B"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-cyan-400 outline-none font-medium"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onCerrar}
                className="w-1/3 py-3 border border-zinc-800 text-zinc-400 font-semibold rounded-2xl hover:bg-zinc-900 active:scale-95 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="w-2/3 py-3 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold rounded-2xl shadow-lg border border-cyan-400/30 active:scale-95 transition flex items-center justify-center gap-2"
              >
                {cargando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Pedido</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {modalMapaAbierto && (
        <SelectorUbicacionMapa
          onConfirmarUbicacion={(coords, dirTexto) => {
            setLatLng(coords);
            setDireccion(dirTexto);
            setSugerenciasLocalidades([]);
          }}
          onCerrar={() => setModalMapaAbierto(false)}
        />
      )}
    </>
  );
};
