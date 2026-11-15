import React, { useState } from "react";
import { Shield, Plus, ToggleLeft, ToggleRight, ExternalLink, Key, CheckCircle, AlertTriangle, Users, RefreshCw, X, ArrowLeft, Eye } from "lucide-react";
import { ComercioCliente } from "../types";
import { getComerciosRegistrados, setComerciosRegistrados, llamarApi, setSpreadsheetId, setStoreName } from "../api";
import { NeoEnviosLogo } from "./NeoEnviosLogo";

interface Props {
  onCerrarSesion: () => void;
  onVolverALaApp: () => void;
  onSeleccionarComercioParaVer?: (comercio: ComercioCliente) => void;
}

export const PanelAdmin: React.FC<Props> = ({ onCerrarSesion, onVolverALaApp, onSeleccionarComercioParaVer }) => {
  const [comercios, setComercios] = useState<ComercioCliente[]>(getComerciosRegistrados());
  const [modalNuevoComercio, setModalNuevoComercio] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Formulario nuevo comercio
  const [nombreComercio, setNombreComercio] = useState("");
  const [emailPropietario, setEmailPropietario] = useState("");
  const [spreadsheetId, setSpreadsheetIdInput] = useState("");

  const handleCrearComercio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreComercio.trim()) return;

    setCargando(true);
    const idComercio = `COM-${Math.floor(100 + Math.random() * 900)}`;

    let sheetIdFinal = spreadsheetId.trim();
    const res = await llamarApi("PROVISIONAR_COMERCIO", {
      datosComercio: {
        idComercio,
        nombreComercio: nombreComercio.trim(),
        emailPropietario: emailPropietario.trim()
      }
    });

    if (res.success && res.data && (res.data as any).spreadsheetId) {
      sheetIdFinal = (res.data as any).spreadsheetId;
    }

    const nuevo: ComercioCliente = {
      idComercio,
      nombreComercio: nombreComercio.trim(),
      emailPropietario: emailPropietario.trim() || "cliente@comercio.com",
      spreadsheetId: sheetIdFinal || `1sheet_${idComercio}`,
      estadoSuscripcion: "ACTIVO",
      fechaAlta: new Date().toISOString().split("T")[0]
    };

    const actualizada: ComercioCliente[] = [nuevo, ...comercios];
    setComercios(actualizada);
    setComerciosRegistrados(actualizada);

    setCargando(false);
    setModalNuevoComercio(false);
    setNombreComercio("");
    setEmailPropietario("");
    setSpreadsheetIdInput("");
  };

  const alternarEstadoSuscripcion = async (comercio: ComercioCliente) => {
    const nuevoEstado: "ACTIVO" | "SUSPENDIDO" = comercio.estadoSuscripcion === "ACTIVO" ? "SUSPENDIDO" : "ACTIVO";

    if (comercio.spreadsheetId && !comercio.spreadsheetId.startsWith("1sheet_")) {
      await llamarApi("ACTUALIZAR_ESTADO_CUENTA", {
        spreadsheetId: comercio.spreadsheetId,
        idComercio: comercio.idComercio,
        nuevoEstado: nuevoEstado
      });
    }

    const actualizada: ComercioCliente[] = comercios.map(c =>
      c.idComercio === comercio.idComercio ? { ...c, estadoSuscripcion: nuevoEstado } : c
    );
    setComercios(actualizada);
    setComerciosRegistrados(actualizada);
  };

  const entrarComoComercio = (c: ComercioCliente) => {
    setSpreadsheetId(c.spreadsheetId);
    setStoreName(c.nombreComercio);
    if (onSeleccionarComercioParaVer) {
      onSeleccionarComercioParaVer(c);
    } else {
      onVolverALaApp();
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 max-w-2xl mx-auto font-sans selection:bg-cyan-400 selection:text-black">
      {/* Barra superior de Administrador con Estética NeoFaro */}
      <div className="bg-zinc-950/90 border border-zinc-800 rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.7)] backdrop-blur-xl mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NeoEnviosLogo subtitulo="Panel de Control Central" size="md" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onVolverALaApp}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold transition shadow-md shadow-violet-950/50 border border-cyan-400/30"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-200" />
            <span>Ir a la App</span>
          </button>
          <button
            onClick={onCerrarSesion}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold border border-zinc-800 transition"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Resumen de comercios */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">TOTAL CLIENTES</span>
          <span className="text-2xl font-black text-white mt-0.5 block">{comercios.length} comercios</span>
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">ESTADO DE CUENTAS</span>
          <span className="text-2xl font-black text-cyan-400 mt-0.5 block">
            {comercios.filter(c => c.estadoSuscripcion === "ACTIVO").length} activos
          </span>
        </div>
      </div>

      {/* Lista de Comercios Clientes con Control de Suspensión */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            <span>Comercios en la Red NeoFaro</span>
          </h2>

          <button
            onClick={() => setModalNuevoComercio(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md border border-violet-400/30"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-300" />
            <span>Provisionar Comercio</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {comercios.map((comercio) => {
            const esActivo = comercio.estadoSuscripcion === "ACTIVO";

            return (
              <div
                key={comercio.idComercio}
                className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md hover:border-violet-500/40 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100 text-sm truncate">{comercio.nombreComercio}</span>
                    <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-cyan-300">
                      {comercio.idComercio}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{comercio.emailPropietario}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => entrarComoComercio(comercio)}
                      className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Abrir su App y Datos</span>
                    </button>
                  </div>
                </div>

                {/* Switch de Suspensión Inmediata */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => alternarEstadoSuscripcion(comercio)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${esActivo
                        ? "bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/60"
                        : "bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60"
                      }`}
                  >
                    {esActivo ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-cyan-400" />
                        <span>ACTIVO</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-rose-400" />
                        <span>SUSPENDIDO</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-zinc-500">
                    {esActivo ? "Operativo" : "Bloqueo por Pago"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Provisionar Comercio */}
      {modalNuevoComercio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-zinc-100 text-base">Provisionar Comercio en Google Drive</h3>
              <button
                onClick={() => setModalNuevoComercio(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearComercio} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Nombre del Comercio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Kiosco y Almacén El Sol"
                  value={nombreComercio}
                  onChange={(e) => setNombreComercio(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Email del Propietario</label>
                <input
                  type="email"
                  required
                  placeholder="cliente@gmail.com"
                  value={emailPropietario}
                  onChange={(e) => setEmailPropietario(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Spreadsheet ID (Opcional)</label>
                <input
                  type="text"
                  placeholder="Dejar en blanco para clonar plantilla automática"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoComercio(false)}
                  className="w-1/2 py-2.5 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg border border-cyan-400/30"
                >
                  {cargando ? "Clonando..." : "Dar de Alta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
