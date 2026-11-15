import { Pedido, ResumenCaja, MovimientoCaja, ResultadoGeocodificacion, UsuarioSesion, ComercioCliente } from "./types";

export const API_URL = "https://script.google.com/macros/s/AKfycbxIEazEstasrTiwBGdGmBi-6ygdzsHiMaC_dsi9gR5M20ONA1vpH3E55jE53ynuWn43Ow/exec";

export const STORAGE_KEY_AUTH = "neoenvios_user_auth";
export const STORAGE_KEY_COMERCIOS = "neoenvios_comercios_list";
export const STORAGE_KEY_SPREADSHEET_ID = "neoenvios_spreadsheet_id";
export const STORAGE_KEY_STORE_NAME = "neoenvios_store_name";

// Guardar y recuperar sesión de usuario
export function getSesionActual(): UsuarioSesion | null {
  const json = localStorage.getItem(STORAGE_KEY_AUTH);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function setSesionActual(usuario: UsuarioSesion): void {
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(usuario));
  if (usuario.spreadsheetId) {
    localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, usuario.spreadsheetId);
  }
  if (usuario.nombreComercio) {
    localStorage.setItem(STORAGE_KEY_STORE_NAME, usuario.nombreComercio);
  }
}

export function cerrarSesion(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

export function getSpreadsheetId(): string {
  const sesion = getSesionActual();
  if (sesion && sesion.spreadsheetId) return sesion.spreadsheetId;
  return localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID) || "";
}

export function setSpreadsheetId(id: string): void {
  localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, id);
}

export function getStoreName(): string {
  const sesion = getSesionActual();
  if (sesion && sesion.nombreComercio) return sesion.nombreComercio;
  return localStorage.getItem(STORAGE_KEY_STORE_NAME) || "Mi Tienda";
}

export function setStoreName(name: string): void {
  localStorage.setItem(STORAGE_KEY_STORE_NAME, name);
}

// Lista de comercios del panel de control de administrador
export function getComerciosRegistrados(): ComercioCliente[] {
  const data = localStorage.getItem(STORAGE_KEY_COMERCIOS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  return [
    {
      idComercio: "COM-001",
      nombreComercio: "Hamburguesería Don Pepe",
      emailPropietario: "comercio@gmail.com",
      spreadsheetId: "1pX_demo_sheet_hamburgueseria_don_pepe",
      estadoSuscripcion: "ACTIVO",
      fechaAlta: "2026-11-14"
    },
    {
      idComercio: "COM-002",
      nombreComercio: "Pizzería Nápoles Express",
      emailPropietario: "napoles@gmail.com",
      spreadsheetId: "1qY_demo_sheet_napoles_express",
      estadoSuscripcion: "SUSPENDIDO",
      fechaAlta: "2026-11-10"
    }
  ];
}

export function setComerciosRegistrados(lista: ComercioCliente[]): void {
  localStorage.setItem(STORAGE_KEY_COMERCIOS, JSON.stringify(lista));
}

export async function llamarApi<T>(action: string, payload: Record<string, any> = {}): Promise<{ success: boolean; data?: T; error?: string; mensaje?: string }> {
  const spreadsheetId = payload.spreadsheetId || getSpreadsheetId();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action,
        spreadsheetId,
        ...payload
      })
    });

    const json = await res.json();
    return json;
  } catch (error: any) {
    console.error(`Error llamando a la API en ${action}:`, error);
    return { success: false, error: error.message || "Error de conexión con Google Apps Script" };
  }
}

export async function buscarLocalidadesDireccion(direccion: string): Promise<ResultadoGeocodificacion[]> {
  if (!direccion || direccion.trim().length < 3) return [];

  try {
    const query = encodeURIComponent(direccion.trim());
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&addressdetails=1`, {
      headers: {
        "Accept-Language": "es"
      }
    });
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        place_id: item.place_id,
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    }
  } catch (e) {
    console.warn("Fallo búsqueda de localidades:", e);
  }
  return [];
}

export async function geocodificarDireccion(direccion: string): Promise<{ lat: number; lng: number } | null> {
  const resultados = await buscarLocalidadesDireccion(direccion);
  if (resultados.length > 0) {
    return { lat: resultados[0].lat, lng: resultados[0].lng };
  }
  return null;
}

export async function geocodificarInversa(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: {
        "Accept-Language": "es"
      }
    });
    const data = await res.json();
    if (data && data.display_name) {
      return data.display_name;
    }
  } catch (e) {
    console.warn("Fallo geocodificación inversa:", e);
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// =========================================================================
// VERIFICACIÓN AUTOMÁTICA CONTRA EL ECOSISTEMA NEOFARO
// =========================================================================
const NEOFARO_SUPABASE_URL = "https://hajepxscgwbgiifcfndz.supabase.co";
const NEOFARO_KEY = (import.meta as any).env?.VITE_NEOFARO_SUPABASE_KEY || "sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI";

export interface ResultadoVerificacionNeoFaro {
  registrado: boolean;
  idComercio?: string;
  nombreComercio?: string;
  email?: string;
  direccion?: string;
  telefono?: string;
  mensaje?: string;
}

export async function verificarComercioEnNeoFaro(
  email: string,
  nombreComercio?: string
): Promise<ResultadoVerificacionNeoFaro> {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanNombre = (nombreComercio || "").trim().toLowerCase();

  if (!cleanEmail && !cleanNombre) {
    return {
      registrado: false,
      mensaje: "Ingresa el correo electrónico de tu comercio."
    };
  }

  // 1. Administradores maestros siempre autorizados
  if (cleanEmail === "maxi0802@gmail.com" || cleanEmail === "lic.maxisanchez@gmail.com") {
    return {
      registrado: true,
      nombreComercio: "Administración Central NeoFaro",
      email: cleanEmail
    };
  }

  // 2. Verificar si ya fue provisionado en el Panel Admin de Neo-Envíos
  const comerciosLocales = getComerciosRegistrados();
  const matchLocal = comerciosLocales.find(
    c =>
      c.emailPropietario.trim().toLowerCase() === cleanEmail ||
      (cleanNombre && c.nombreComercio.trim().toLowerCase() === cleanNombre)
  );
  if (matchLocal) {
    return {
      registrado: true,
      idComercio: matchLocal.idComercio,
      nombreComercio: matchLocal.nombreComercio,
      email: matchLocal.emailPropietario
    };
  }

  // 3. Intentar vía Serverless Function /api/verificar-neofaro (Vercel)
  try {
    const resApi = await fetch("/api/verificar-neofaro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, nombreComercio: cleanNombre })
    });

    const contentType = resApi.headers.get("content-type") || "";
    if (resApi.ok && contentType.includes("application/json")) {
      const data = await resApi.json();
      if (typeof data.registrado === "boolean") {
        return data;
      }
    }
  } catch (_) {
    // En entorno local Vite dev, continuar con consulta directa a Supabase NeoFaro
  }

  // 4. Consulta en tiempo real a la Base de Datos de NeoFaro (Supabase)
  const headers = {
    apikey: NEOFARO_KEY,
    Authorization: `Bearer ${NEOFARO_KEY}`,
    "Content-Type": "application/json"
  };

  try {
    // 4a. Buscar en solicitudes_modificacion de NeoFaro
    const solRes = await fetch(`${NEOFARO_SUPABASE_URL}/rest/v1/solicitudes_modificacion?select=*`, { headers });
    if (solRes.ok) {
      const solicitudes = await solRes.json();
      if (Array.isArray(solicitudes)) {
        const matchSol = solicitudes.find((s: any) => {
          const em1 = (s.cambios?.email_comercio || "").trim().toLowerCase();
          const em2 = (s.cambios?.email || "").trim().toLowerCase();
          const nom = (s.comercio_nombre || s.cambios?.nombre || "").trim().toLowerCase();
          return (cleanEmail && (em1 === cleanEmail || em2 === cleanEmail)) || (cleanNombre && nom === cleanNombre);
        });

        if (matchSol) {
          return {
            registrado: true,
            idComercio: matchSol.comercio_id || matchSol.id,
            nombreComercio: matchSol.comercio_nombre || matchSol.cambios?.nombre || "Comercio NeoFaro",
            email: matchSol.cambios?.email_comercio || matchSol.cambios?.email || cleanEmail,
            direccion: matchSol.cambios?.direccion || "",
            telefono: matchSol.cambios?.whatsapp || matchSol.cambios?.telefono || ""
          };
        }
      }
    }

    // 4b. Buscar en tabla 'usuarios' de NeoFaro
    if (cleanEmail) {
      const usrRes = await fetch(
        `${NEOFARO_SUPABASE_URL}/rest/v1/usuarios?email=ilike.${encodeURIComponent(cleanEmail)}&select=*`,
        { headers }
      );
      if (usrRes.ok) {
        const usuarios = await usrRes.json();
        if (Array.isArray(usuarios) && usuarios.length > 0) {
          const u = usuarios[0];
          let direccion = "";
          let telefono = "";
          if (u.comercio_id) {
            try {
              const cRes = await fetch(
                `${NEOFARO_SUPABASE_URL}/rest/v1/comercios?id=eq.${encodeURIComponent(u.comercio_id)}&select=*`,
                { headers }
              );
              if (cRes.ok) {
                const cList = await cRes.json();
                if (Array.isArray(cList) && cList.length > 0) {
                  direccion = cList[0].direccion || "";
                  telefono = cList[0].telefono || cList[0].whatsapp || "";
                }
              }
            } catch (_) {}
          }
          return {
            registrado: true,
            idComercio: u.comercio_id || u.id,
            nombreComercio: u.comercio_nombre || u.nombre || "Comercio NeoFaro",
            email: u.email,
            direccion,
            telefono
          };
        }
      }
    }

    // 4c. Buscar en tabla 'comercios' de NeoFaro
    const comRes = await fetch(`${NEOFARO_SUPABASE_URL}/rest/v1/comercios?select=*`, { headers });
    if (comRes.ok) {
      const comercios = await comRes.json();
      if (Array.isArray(comercios) && comercios.length > 0) {
        const matchCom = comercios.find((c: any) => {
          const nom = (c.nombre || "").trim().toLowerCase();
          return cleanNombre && nom === cleanNombre;
        });
        if (matchCom) {
          return {
            registrado: true,
            idComercio: matchCom.id,
            nombreComercio: matchCom.nombre,
            direccion: matchCom.direccion || "",
            telefono: matchCom.telefono || ""
          };
        }
      }
    }

    // 4d. Buscar en Auth Users de NeoFaro
    if (cleanEmail) {
      const authRes = await fetch(`${NEOFARO_SUPABASE_URL}/auth/v1/admin/users`, { headers });
      if (authRes.ok) {
        const authData = await authRes.json();
        const usersList = authData?.users || [];
        const matchUser = usersList.find((u: any) => (u.email || "").trim().toLowerCase() === cleanEmail);
        if (matchUser) {
          return {
            registrado: true,
            idComercio: matchUser.id,
            nombreComercio:
              matchUser.user_metadata?.comercio_nombre ||
              matchUser.user_metadata?.nombre ||
              cleanEmail.split("@")[0],
            email: matchUser.email
          };
        }
      }
    }
  } catch (e) {
    console.warn("Error consultando NeoFaro:", e);
  }

  return {
    registrado: false,
    mensaje:
      "Este comercio no se encuentra registrado en NeoFaro. Para darte de alta en Neo-Envíos, primero debes estar registrado en la plataforma NeoFaro."
  };
}
