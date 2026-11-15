import React, { useState } from "react";
import {
  LogIn,
  Store,
  Shield,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ExternalLink,
  SearchCheck
} from "lucide-react";
import { UsuarioSesion } from "../types";
import {
  setSesionActual,
  verificarComercioEnNeoFaro,
  getComerciosRegistrados,
  setComerciosRegistrados,
  ResultadoVerificacionNeoFaro
} from "../api";
import { NeoEnviosLogo } from "./NeoEnviosLogo";

interface Props {
  onLoginExitoso: (usuario: UsuarioSesion) => void;
}

export const PantallaLogin: React.FC<Props> = ({ onLoginExitoso }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [nombreComercio, setNombreComercio] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [esRegistroComercio, setEsRegistroComercio] = useState(false);
  const [error, setError] = useState("");

  // Estado de verificación automática contra NeoFaro
  const [verificandoNeoFaro, setVerificandoNeoFaro] = useState(false);
  const [estadoNeoFaro, setEstadoNeoFaro] = useState<ResultadoVerificacionNeoFaro | null>(null);

  const ejecutarVerificacionNeoFaro = async (correoAProbar?: string, nombreAProbar?: string) => {
    const targetEmail = (correoAProbar !== undefined ? correoAProbar : email).trim().toLowerCase();
    const targetNombre = (nombreAProbar !== undefined ? nombreAProbar : nombreComercio).trim();

    if (!targetEmail || !targetEmail.includes("@")) {
      return null;
    }

    setVerificandoNeoFaro(true);
    setError("");

    const resultado = await verificarComercioEnNeoFaro(targetEmail, targetNombre);
    setEstadoNeoFaro(resultado);
    setVerificandoNeoFaro(false);

    if (resultado.registrado && resultado.nombreComercio && !nombreComercio.trim()) {
      setNombreComercio(resultado.nombreComercio);
    }

    return resultado;
  };

  const handleIniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Verificación de Perfil Administrador Maestro
    if (cleanEmail === "maxi0802@gmail.com") {
      if (cleanPass === "admin123") {
        const adminUser: UsuarioSesion = {
          email: "maxi0802@gmail.com",
          nombre: "Maxi Sánchez (Admin General)",
          rol: "ADMIN"
        };
        setSesionActual(adminUser);
        onLoginExitoso(adminUser);
        return;
      } else {
        setError("Contraseña incorrecta para el usuario administrador.");
        return;
      }
    }

    if (!cleanEmail || !cleanPass) {
      setError("Por favor completa tu correo y contraseña.");
      return;
    }

    // 2. Verificación obligatoria en tiempo real contra NeoFaro
    const verif = await ejecutarVerificacionNeoFaro(cleanEmail, nombreComercio);

    if (!verif || !verif.registrado) {
      // No está registrado en NeoFaro -> Bloqueo automático
      return;
    }

    const nombreFinal = verif.nombreComercio || nombreComercio.trim() || cleanEmail.split("@")[0];
    const idFinal = verif.idComercio || `COM-${Date.now().toString().slice(-4)}`;

    // Si es un alta en Neo-Envíos, agregarlo al padrón local de comercios activos
    const listaActual = getComerciosRegistrados();
    const yaExiste = listaActual.some(c => c.emailPropietario.toLowerCase() === cleanEmail);
    if (!yaExiste) {
      setComerciosRegistrados([
        {
          idComercio: idFinal,
          nombreComercio: nombreFinal,
          emailPropietario: cleanEmail,
          spreadsheetId: spreadsheetId.trim() || `1sheet_${idFinal}`,
          estadoSuscripcion: "ACTIVO",
          fechaAlta: new Date().toISOString().split("T")[0]
        },
        ...listaActual
      ]);
    }

    const comercioUser: UsuarioSesion = {
      email: cleanEmail,
      nombre: nombreFinal,
      rol: "COMERCIO",
      idComercio: idFinal,
      nombreComercio: nombreFinal,
      spreadsheetId: spreadsheetId.trim()
    };

    setSesionActual(comercioUser);
    onLoginExitoso(comercioUser);
  };

  const cargarDemoAdmin = () => {
    setEmail("maxi0802@gmail.com");
    setPassword("admin123");
    setEstadoNeoFaro(null);
    setError("");
  };

  const cargarDemoComercio = () => {
    setEmail("comercio@gmail.com");
    setPassword("123456");
    setNombreComercio("Hamburguesería Don Pepe");
    setEstadoNeoFaro({
      registrado: true,
      nombreComercio: "Hamburguesería Don Pepe",
      email: "comercio@gmail.com"
    });
    setError("");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Resplandores Neón de Fondo estilo NeoFaro */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="bg-zinc-950/90 border border-zinc-800/80 w-full max-w-sm rounded-3xl shadow-[0_0_35px_rgba(0,0,0,0.8)] backdrop-blur-xl p-6 space-y-5 relative z-10">
        {/* Cabecera con Logo Oficial NeoFaro */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <NeoEnviosLogo subtitulo="Ecosistema de Comercio NeoFaro" size="lg" />
          <p className="text-xs text-zinc-400 pt-1">
            {esRegistroComercio
              ? "Alta de comercio vinculado a la red NeoFaro"
              : "Control de entregas, stock y caja centralizada"}
          </p>
        </div>

        {/* Leyenda de Error General */}
        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* LEYENDA CUANDO EL COMERCIO NO ESTÁ REGISTRADO EN NEOFARO */}
        {estadoNeoFaro && !estadoNeoFaro.registrado && (
          <div className="p-4 bg-gradient-to-br from-rose-950/90 via-zinc-950 to-amber-950/60 border-2 border-rose-500/60 rounded-2xl space-y-3 shadow-[0_0_25px_rgba(244,63,94,0.25)] animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-black text-rose-200 uppercase tracking-wide">
                  No registrado en NeoFaro
                </h3>
                <p className="text-[11px] text-zinc-200 leading-relaxed">
                  Este comercio <strong>no se encuentra registrado en NeoFaro</strong>. Para darte de alta y utilizar{" "}
                  <span className="text-cyan-300 font-semibold">Neo-Envíos</span>, primero debes registrarte en la plataforma oficial de NeoFaro.
                </p>
              </div>
            </div>

            <a
              href="https://neofaro.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition active:scale-95"
            >
              <span>Registrarme en NeoFaro Ahora</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* CONFIRMACIÓN CUANDO EL COMERCIO SÍ ESTÁ EN NEOFARO */}
        {estadoNeoFaro && estadoNeoFaro.registrado && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center gap-2.5 text-emerald-200 text-xs animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                ✓ Comercio Verificado en NeoFaro
              </span>
              <span className="font-bold text-white">
                {estadoNeoFaro.nombreComercio || email}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleIniciarSesion} className="space-y-3.5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-zinc-300">Correo Electrónico (NeoFaro)</label>
              {esRegistroComercio && (
                <button
                  type="button"
                  onClick={() => ejecutarVerificacionNeoFaro()}
                  disabled={verificandoNeoFaro || !email.includes("@")}
                  className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 disabled:opacity-40"
                >
                  <SearchCheck className="w-3 h-3" />
                  <span>Verificar correo</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="tu@comercio.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (estadoNeoFaro) setEstadoNeoFaro(null);
                }}
                onBlur={() => {
                  if (esRegistroComercio && email.includes("@")) {
                    ejecutarVerificacionNeoFaro(email);
                  }
                }}
                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs text-white placeholder:text-zinc-500 transition font-medium"
                style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff", backgroundColor: "#18181b" }}
              />
              {verificandoNeoFaro && (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3 top-3" />
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={mostrarPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-10 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs text-white placeholder:text-zinc-500 transition font-mono tracking-widest"
                style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff", backgroundColor: "#18181b" }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-white transition"
                title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {mostrarPassword ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Campos adicionales si es nuevo comercio */}
          {esRegistroComercio && (
            <>
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Nombre de tu Comercio en NeoFaro</label>
                <input
                  type="text"
                  placeholder="Se autocompleta al verificar o escríbelo..."
                  value={nombreComercio}
                  onChange={(e) => setNombreComercio(e.target.value)}
                  className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 font-medium"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff", backgroundColor: "#18181b" }}
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Spreadsheet ID (Google Sheets)</label>
                <input
                  type="text"
                  placeholder="Opcional: ID de tu hoja"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-white placeholder:text-zinc-500"
                  style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff", backgroundColor: "#18181b" }}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={verificandoNeoFaro}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-violet-950/60 transition-all flex items-center justify-center gap-2 mt-2 border border-cyan-400/30 disabled:opacity-50"
          >
            {verificandoNeoFaro ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                <span>Verificando en NeoFaro...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-cyan-200" />
                <span>
                  {esRegistroComercio ? "Verificar y Dar de Alta en Neo-Envíos" : "Ingresar a Neo-Envíos"}
                </span>
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setEsRegistroComercio(!esRegistroComercio);
              setEstadoNeoFaro(null);
              setError("");
            }}
            className="text-xs text-cyan-400 font-semibold hover:underline"
          >
            {esRegistroComercio
              ? "¿Ya tienes cuenta en Neo-Envíos? Inicia sesión"
              : "¿Eres nuevo comercio? Regístrate aquí (Requiere NeoFaro)"}
          </button>
        </div>

        {/* Accesos rápidos de prueba */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-2">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block text-center">
            Accesos Rápidos
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={cargarDemoAdmin}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[11px] font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Admin Maestro</span>
            </button>
            <button
              type="button"
              onClick={cargarDemoComercio}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[11px] font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Store className="w-3.5 h-3.5 text-violet-400" />
              <span>Comercio Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
