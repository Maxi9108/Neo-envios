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
