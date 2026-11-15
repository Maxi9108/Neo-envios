import React, { useState } from "react";
import { ClienteRegistrado } from "../types";
import { Plus, Search, User, Phone, MapPin, MessageCircle, X, ChevronRight, PackageCheck, Boxes, AlertTriangle } from "lucide-react";
import { geocodificarDireccion } from "../api";

interface Props {
  clientes: ClienteRegistrado[];
  onGuardarCliente: (cliente: ClienteRegistrado) => void;
  onCrearPedidoParaCliente?: (cliente: ClienteRegistrado) => void;
}

export const ModuloClientes: React.FC<Props> = ({
  clientes,
  onGuardarCliente,
  onCrearPedidoParaCliente
}) => {
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [cargando, setCargando] = useState(false);

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.includes(busqueda) ||
    c.direccion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !direccion.trim()) return;

    setCargando(true);
    let latLng = "";
    const coords = await geocodificarDireccion(direccion);
    if (coords) {
      latLng = `${coords.lat},${coords.lng}`;
    }

    const nuevo: ClienteRegistrado = {
      idCliente: `CLI-${Date.now().toString().slice(-5)}`,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      latLng: latLng,
      notasDireccion: notas.trim(),
      totalPedidos: 0,
      envasesPendientes: {}
    };

    onGuardarCliente(nuevo);
    setCargando(false);
    setModalAbierto(false);

    setNombre("");
    setTelefono("");
    setDireccion("");
    setNotas("");
  };

  const abrirWhatsApp = (tel: string, nombreCli: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tel) return;
    const cleanPhone = tel.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(`¡Hola ${nombreCli}! Te escribimos de Neo-Envíos (NeoFaro). ¿En qué podemos ayudarte hoy?`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-3 pb-24">
      {/* Barra de Búsqueda y Botón Nuevo */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o calle..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-sm"
          />
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1 px-3.5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition border border-cyan-400/30"
        >
          <Plus className="w-4 h-4 text-cyan-200" />
          <span>Cliente</span>
        </button>
      </div>

      {/* Lista de Clientes */}
      {clientesFiltrados.length === 0 ? (
        <div className="bg-zinc-950/80 rounded-2xl p-8 text-center border border-dashed border-zinc-800 text-zinc-500">
          <User className="w-9 h-9 mx-auto mb-2 text-zinc-600" />
          <p className="font-semibold text-xs text-zinc-400">No hay clientes frecuentes registrados</p>
          <p className="text-[11px] mt-1">Registra tus clientes para crearles pedidos en 1 solo clic.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clientesFiltrados.map((cli) => {
            const tieneEnvases = cli.envasesPendientes && Object.entries(cli.envasesPendientes).some(([_, cant]) => cant > 0);

            return (
              <div
                key={cli.idCliente}
                className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800/80 shadow-md flex flex-col gap-2 hover:border-violet-500/40 transition backdrop-blur-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-100 text-sm truncate">{cli.nombre}</span>
                      <span className="text-[10px] font-mono bg-violet-950/80 border border-violet-800/50 text-violet-300 px-1.5 py-0.5 rounded font-medium">
                        {cli.totalPedidos || 0} pedidos
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{cli.direccion}</span>
                    </div>

                    {cli.telefono && (
                      <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{cli.telefono}</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cli.telefono && (
                      <button
                        onClick={(e) => abrirWhatsApp(cli.telefono, cli.nombre, e)}
                        title="Chatear por WhatsApp"
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700/60 rounded-xl transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}

                    {onCrearPedidoParaCliente && (
                      <button
                        onClick={() => onCrearPedidoParaCliente(cli)}
                        title="Crear pedido rápido para este cliente"
                        className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 border border-cyan-400/20"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-cyan-200" />
                        <span>Pedir</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Envases retornables adeudados si tiene */}
                {tieneEnvases && (
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <Boxes className="w-3.5 h-3.5 text-amber-400" />
                      <span>Envases adeudados:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(cli.envasesPendientes || {}).map(([env, cant]) => {
                        if (cant <= 0) return null;
                        return (
                          <span
                            key={env}
                            className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-800/50 text-[10px] font-bold text-amber-300"
                          >
                            {cant}x {env}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar Cliente */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-100">Registrar Cliente Frecuente</h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofía Martínez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="Ej: +54 9 11 2233 4455"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Dirección Exacta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. Callao 1050, Buenos Aires"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Piso / Dpto / Notas</label>
                <input
                  type="text"
                  placeholder="Ej: Piso 3 Depto B"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="w-1/2 py-2.5 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-md border border-cyan-400/30"
                >
                  {cargando ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
