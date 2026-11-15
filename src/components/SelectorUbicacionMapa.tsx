import React, { useEffect, useRef, useState } from "react";
import { MapPin, Check, X, Search, Loader2 } from "lucide-react";
import { geocodificarInversa } from "../api";

declare const L: any;

interface Props {
  latInicial?: number;
  lngInicial?: number;
  onConfirmarUbicacion: (latLngStr: string, direccionTexto: string) => void;
  onCerrar: () => void;
}

export const SelectorUbicacionMapa: React.FC<Props> = ({
  latInicial = -34.6037,
  lngInicial = -58.3816,
  onConfirmarUbicacion,
  onCerrar
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [latSeleccionada, setLatSeleccionada] = useState<number>(latInicial);
  const [lngSeleccionada, setLngSeleccionada] = useState<number>(lngInicial);
  const [direccionObtenida, setDireccionObtenida] = useState<string>("Localizando...");
  const [cargandoDireccion, setCargandoDireccion] = useState<boolean>(false);

  useEffect(() => {
    if (!mapContainerRef.current || typeof L === "undefined") return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([latInicial, lngInicial], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Icono de Pin Neón NeoFaro
      const neonPinIcon = L.divIcon({
        className: "custom-picker-pin",
        html: `
          <div style="background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: white; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 15px rgba(6,182,212,0.7);">
            <div style="transform: rotate(45deg); width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      const marker = L.marker([latInicial, lngInicial], {
        icon: neonPinIcon,
        draggable: true
      }).addTo(map);

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setLatSeleccionada(lat);
        setLngSeleccionada(lng);
        obtenerNombreDireccion(lat, lng);
      });

      marker.on("dragend", async (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setLatSeleccionada(lat);
        setLngSeleccionada(lng);
        obtenerNombreDireccion(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      obtenerNombreDireccion(latInicial, lngInicial);
    }
  }, []);

  const obtenerNombreDireccion = async (lat: number, lng: number) => {
    setCargandoDireccion(true);
    const dir = await geocodificarInversa(lat, lng);
    setDireccionObtenida(dir);
    setCargandoDireccion(false);
  };

  const handleConfirmar = () => {
    const latLngStr = `${latSeleccionada},${lngSeleccionada}`;
    onConfirmarUbicacion(latLngStr, direccionObtenida);
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Cabecera */}
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 text-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm">Fijar Ubicación Exacta en el Mapa</h3>
              <p className="text-[11px] text-zinc-400">Toca en el mapa o arrastra el marcador neón</p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenedor del Mapa */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Footer con Dirección Resuelta y Confirmación */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 space-y-3">
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Dirección Seleccionada:</span>
            <div className="font-medium text-zinc-200 min-h-[32px] flex items-center">
              {cargandoDireccion ? (
                <div className="flex items-center gap-2 text-cyan-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Obteniendo calle y localidad...</span>
                </div>
              ) : (
                <span>📍 {direccionObtenida}</span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCerrar}
              className="w-1/3 py-3 border border-zinc-800 text-zinc-400 font-semibold rounded-2xl text-xs hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={cargandoDireccion}
              className="w-2/3 py-3 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold rounded-2xl text-xs shadow-lg shadow-violet-950/50 flex items-center justify-center gap-1.5 transition active:scale-95 border border-cyan-400/30"
            >
              <Check className="w-4 h-4 stroke-[3] text-cyan-200" />
              <span>Confirmar esta Ubicación</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
