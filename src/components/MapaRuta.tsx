import React, { useEffect, useRef } from "react";
import { Pedido } from "../types";
import { Navigation, MapPin, Truck, AlertCircle } from "lucide-react";

declare const L: any;

interface Props {
  pedidos: Pedido[];
  onSeleccionarPedido?: (pedido: Pedido) => void;
}

export const MapaRuta: React.FC<Props> = ({ pedidos, onSeleccionarPedido }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  // REGLA CLAVE: Solo se visualizan en el mapa los pedidos con estado "EN_RUTA"
  const pedidosEnRuta = pedidos.filter(p => p.estado === "EN_RUTA");

  useEffect(() => {
    if (!mapContainerRef.current || typeof L === "undefined") return;

    if (!mapInstanceRef.current) {
      const initialLat = -34.6037;
      const initialLng = -58.3816;

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    const pedidosConCoords = pedidosEnRuta
      .filter((p) => p.latLng && p.latLng.includes(","))
      .map((p) => {
        const [lat, lng] = p.latLng.split(",").map((n) => parseFloat(n.trim()));
        return { ...p, lat, lng };
      })
      .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));

    if (pedidosConCoords.length === 0) return;

    const latLngPoints: [number, number][] = [];
    const ordenados = [...pedidosConCoords].sort((a, b) => (a.ordenRuta || 99) - (b.ordenRuta || 99));

    ordenados.forEach((p, idx) => {
      latLngPoints.push([p.lat, p.lng]);

      const numeroParada = p.ordenRuta > 0 ? p.ordenRuta : idx + 1;
      const colorBg = "#f59e0b"; // Ámbar neón para despachos activos en ruta

      const customIcon = L.divIcon({
        className: "custom-pin",
        html: `
          <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; border: 2px solid white; box-shadow: 0 0 14px rgba(245, 158, 11, 0.8); font-size: 13px;">
            ${numeroParada}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([p.lat, p.lng], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4; color: #f4f4f5;">
          <div style="font-weight: bold; color: #fff; margin-bottom: 2px;">#${p.idPedido} - ${p.nombreCliente}</div>
          <div style="color: #a1a1aa; font-size: 12px; margin-bottom: 4px;">📍 ${p.direccion}</div>
          <div style="font-weight: 700; color: #f59e0b;">Total a cobrar: $${p.totalCobrar.toLocaleString()} (${p.metodoPago})</div>
          <div style="margin-top: 6px; font-size: 11px; padding: 2px 6px; border-radius: 4px; display: inline-block; background: #27272a; color: #fcd34d;">
            🚚 <strong>EN RUTA (Parada ${numeroParada})</strong>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on("click", () => {
        if (onSeleccionarPedido) onSeleccionarPedido(p);
      });

      markersLayer.addLayer(marker);
    });

    if (latLngPoints.length > 1) {
      routeLineRef.current = L.polyline(latLngPoints, {
        color: "#f59e0b",
        weight: 4,
        opacity: 0.9,
        dashArray: "6, 8"
      }).addTo(map);
    }

    const bounds = L.latLngBounds(latLngPoints);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [pedidosEnRuta.length]);

  const abrirEnGoogleMaps = () => {
    if (pedidosEnRuta.length === 0) return;

    if (pedidosEnRuta.length === 1) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pedidosEnRuta[0].direccion)}`, "_blank");
      return;
    }

    const destinoFinal = encodeURIComponent(pedidosEnRuta[pedidosEnRuta.length - 1].direccion);
    const paradasIntermedias = pedidosEnRuta
      .slice(0, pedidosEnRuta.length - 1)
      .map(p => encodeURIComponent(p.direccion))
      .join("|");

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinoFinal}&waypoints=${paradasIntermedias}&travelmode=driving`;
    window.open(url, "_blank");
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-zinc-950 rounded-2xl overflow-hidden shadow-inner border border-zinc-800">
      {/* Botón flotante GPS cuando hay pedidos en ruta */}
      {pedidosEnRuta.length > 0 ? (
        <div className="absolute top-3 right-3 z-[1000] flex gap-2">
          <button
            onClick={abrirEnGoogleMaps}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-950/60 transition active:scale-95 border border-amber-300/40"
          >
            <Navigation className="w-4 h-4 text-amber-100" />
            <span>Navegar {pedidosEnRuta.length} Paradas en Maps</span>
          </button>
        </div>
      ) : (
        <div className="absolute top-3 left-3 right-3 z-[1000] bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-xs text-zinc-300 flex items-center gap-2 shadow-lg backdrop-blur-md">
          <Truck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            No hay pedidos <strong>EN RUTA</strong>. Pasa pedidos a "En Ruta" para trazar la logística y optimizar paradas.
          </span>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
};
