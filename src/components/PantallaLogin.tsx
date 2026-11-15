import React, { useState } from "react";
import { LogIn, Store, Shield, ArrowRight, UserCheck, AlertCircle, Sparkles, Eye, EyeOff } from "lucide-react";
import { UsuarioSesion } from "../types";
import { setSesionActual } from "../api";
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

  const handleIniciarSesion = (e: React.FormEvent) => {
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

    // 2. Ingreso o Registro de Comercio
    if (!cleanEmail || !cleanPass) {
      setError("Por favor completa tu correo y contraseña.");
      return;
    }

    const comercioUser: UsuarioSesion = {
      email: cleanEmail,
      nombre: nombreComercio.trim() || cleanEmail.split("@")[0],
      rol: "COMERCIO",
      idComercio: `COM-${Date.now().toString().slice(-4)}`,
      nombreComercio: nombreComercio.trim() || "Mi Comercio Delivery",
      spreadsheetId: spreadsheetId.trim()
    };

    setSesionActual(comercioUser);
    onLoginExitoso(comercioUser);
  };

  const cargarDemoAdmin = () => {
    setEmail("maxi0802@gmail.com");
    setPassword("admin123");
  };

  const cargarDemoComercio = () => {
    setEmail("comercio@gmail.com");
    setPassword("123456");
    setNombreComercio("Hamburguesería Don Pepe");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Resplandores Neón de Fondo estilo NeoFaro */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="bg-zinc-950/90 border border-zinc-800/80 w-full max-w-sm rounded-3xl shadow-[0_0_35px_rgba(0,0,0,0.8)] backdrop-blur-xl p-6 space-y-6 relative z-10">
        {/* Cabecera con Logo Oficial NeoFaro */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <NeoEnviosLogo subtitulo="Ecosistema de Comercio NeoFaro" size="lg" />
          <p className="text-xs text-zinc-400 pt-1">Control de entregas, stock y caja centralizada</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleIniciarSesion} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs text-white placeholder:text-zinc-500 transition font-medium"
              style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff", backgroundColor: "#18181b" }}
            />
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
                <label className="block font-semibold text-zinc-300 mb-1">Nombre de tu Comercio</label>
                <input
                  type="text"
                  placeholder="Ej: Pizzería Roma Express"
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
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-violet-950/60 transition-all flex items-center justify-center gap-2 mt-2 border border-cyan-400/30"
          >
            <LogIn className="w-4 h-4 text-cyan-200" />
            <span>{esRegistroComercio ? "Crear Cuenta de Comercio" : "Ingresar a Neo-Envíos"}</span>
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setEsRegistroComercio(!esRegistroComercio)}
            className="text-xs text-cyan-400 font-semibold hover:underline"
          >
            {esRegistroComercio ? "¿Ya tienes usuario? Inicia sesión" : "¿Eres nuevo comercio? Regístrate aquí"}
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
