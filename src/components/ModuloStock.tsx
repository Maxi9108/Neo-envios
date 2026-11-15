import React, { useState } from "react";
import { ProductoStock } from "../types";
import { Plus, Search, AlertCircle, Package, TrendingUp, DollarSign, Edit3, Trash2, X, Check, ArrowDown, ArrowUp } from "lucide-react";

interface Props {
  productos: ProductoStock[];
  onGuardarProducto: (producto: ProductoStock) => void;
  onActualizarStock: (sku: string, nuevoStock: number) => void;
}

export const ModuloStock: React.FC<Props> = ({
  productos,
  onGuardarProducto,
  onActualizarStock
}) => {
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroStock, setFiltroStock] = useState<"TODOS" | "CRITICO" | "DISPONIBLE">("TODOS");

  // Formulario nuevo producto
  const [sku, setSku] = useState("");
  const [producto, setProducto] = useState("");
  const [precioCosto, setPrecioCosto] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [stockActual, setStockActual] = useState("");
  const [stockMinimo, setStockMinimo] = useState("5");
  const [categoria, setCategoria] = useState("General");

  const [edicionRapidaSku, setEdicionRapidaSku] = useState<string | null>(null);
  const [stockEditando, setStockEditando] = useState<number>(0);

  const valorTotalInventario = productos.reduce((acc, p) => acc + (p.stockActual * p.precioVenta), 0);
  const valorCostoTotal = productos.reduce((acc, p) => acc + (p.stockActual * (p.precioCosto || 0)), 0);
  const productosBajoStock = productos.filter((p) => p.stockActual <= (p.stockMinimo || 5));

  const productosFiltrados = productos.filter((p) => {
    const coincideTexto =
      p.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.categoria && p.categoria.toLowerCase().includes(busqueda.toLowerCase()));

    if (!coincideTexto) return false;

    if (filtroStock === "CRITICO") return p.stockActual <= (p.stockMinimo || 5);
    if (filtroStock === "DISPONIBLE") return p.stockActual > (p.stockMinimo || 5);
    return true;
  });

  const handleCrearProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto.trim()) return;

    const nuevo: ProductoStock = {
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
      producto: producto.trim(),
      precioCosto: parseFloat(precioCosto) || 0,
      precioVenta: parseFloat(precioVenta) || 0,
      stockActual: parseInt(stockActual, 10) || 0,
      stockMinimo: parseInt(stockMinimo, 10) || 5,
      categoria: categoria.trim() || "General"
    };

    onGuardarProducto(nuevo);
    setModalAbierto(false);
    setSku("");
    setProducto("");
    setPrecioCosto("");
    setPrecioVenta("");
    setStockActual("");
  };

  const modificarStockRapido = (skuItem: string, delta: number) => {
    const prod = productos.find((p) => p.sku === skuItem);
    if (!prod) return;
    const nuevo = Math.max(0, prod.stockActual + delta);
    onActualizarStock(skuItem, nuevo);
  };

  return (
    <div className="space-y-3 pb-24">
      {/* 1. Resumen de Inventario estilo NeoFaro */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3.5 shadow-lg backdrop-blur-md">
          <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">VALOR TOTAL VENTA</span>
          <span className="text-xl font-black text-cyan-300 block mt-0.5">${valorTotalInventario.toLocaleString()}</span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Costo: ${valorCostoTotal.toLocaleString()} ({productos.length} artículos)
          </span>
        </div>

        <div
          onClick={() => setFiltroStock(filtroStock === "CRITICO" ? "TODOS" : "CRITICO")}
          className={`rounded-2xl p-3.5 border shadow-lg transition cursor-pointer backdrop-blur-md ${productosBajoStock.length > 0
            ? "bg-amber-950/40 border-amber-800/60"
            : "bg-zinc-950/80 border-zinc-800/80"
            }`}
        >
          <div className="flex items-center gap-1">
            <AlertCircle className={`w-3.5 h-3.5 ${productosBajoStock.length > 0 ? "text-amber-400" : "text-zinc-500"}`} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">STOCK CRÍTICO</span>
          </div>
          <span className={`text-xl font-black block mt-0.5 ${productosBajoStock.length > 0 ? "text-amber-300" : "text-zinc-200"}`}>
            {productosBajoStock.length} items
          </span>
          <span className="text-[10px] text-amber-400/90 block mt-0.5">
            {filtroStock === "CRITICO" ? "Mostrando críticos (click restaurar)" : "Click para ver alertas"}
          </span>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Botón Nuevo Producto */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por producto, SKU, categoría..."
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
          <span>Nuevo</span>
        </button>
      </div>

      {/* Filtros rápidos de Stock */}
      <div className="flex bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-xl text-xs font-semibold text-zinc-400">
        <button
          onClick={() => setFiltroStock("TODOS")}
          className={`flex-1 py-1.5 rounded-lg transition ${filtroStock === "TODOS" ? "bg-zinc-800 text-zinc-100 font-bold shadow-sm" : "hover:text-zinc-200"
            }`}
        >
          Todos ({productos.length})
        </button>
        <button
          onClick={() => setFiltroStock("CRITICO")}
          className={`flex-1 py-1.5 rounded-lg transition ${filtroStock === "CRITICO" ? "bg-zinc-800 text-amber-400 font-bold shadow-sm" : "hover:text-zinc-200"
            }`}
        >
          Poco Stock ({productosBajoStock.length})
        </button>
        <button
          onClick={() => setFiltroStock("DISPONIBLE")}
          className={`flex-1 py-1.5 rounded-lg transition ${filtroStock === "DISPONIBLE" ? "bg-zinc-800 text-cyan-400 font-bold shadow-sm" : "hover:text-zinc-200"
            }`}
        >
          Óptimos
        </button>
      </div>

      {/* 3. Lista de Productos */}
      {productosFiltrados.length === 0 ? (
        <div className="bg-zinc-950/80 rounded-2xl p-8 text-center border border-dashed border-zinc-800 text-zinc-500">
          <Package className="w-9 h-9 mx-auto mb-2 text-zinc-600" />
          <p className="font-semibold text-xs text-zinc-400">No hay productos en esta vista</p>
          <p className="text-[11px] mt-1">Registra productos para controlar stock con cada pedido.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {productosFiltrados.map((item) => {
            const esCritico = item.stockActual <= (item.stockMinimo || 5);
            const esAgotado = item.stockActual <= 0;

            return (
              <div
                key={item.sku}
                className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800/80 shadow-md flex items-center justify-between gap-3 hover:border-violet-500/40 transition backdrop-blur-md"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100 text-sm truncate">{item.producto}</span>
                    <span className="text-[10px] font-mono bg-zinc-800 border border-zinc-700/60 px-1.5 py-0.5 rounded text-cyan-300">
                      {item.sku}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="font-bold text-cyan-300 text-sm">
                      ${item.precioVenta.toLocaleString()}
                    </span>
                    {item.precioCosto > 0 && (
                      <span className="text-zinc-500 text-[11px]">
                        Costo: ${item.precioCosto.toLocaleString()}
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400">
                      Margen: ${Math.max(0, item.precioVenta - item.precioCosto).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Controles de Stock Instantáneos estilo mostrador (+ / -) */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      onClick={() => modificarStockRapido(item.sku, -1)}
                      title="Disminuir 1 unidad"
                      className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 font-bold hover:bg-rose-950/60 hover:text-rose-300 active:scale-95 transition"
                    >
                      -
                    </button>

                    {edicionRapidaSku === item.sku ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          autoFocus
                          value={stockEditando}
                          onChange={(e) => setStockEditando(parseInt(e.target.value) || 0)}
                          className="w-12 p-0.5 text-center font-bold text-xs bg-zinc-900 border border-cyan-400 rounded-md text-white outline-none"
                        />
                        <button
                          onClick={() => {
                            onActualizarStock(item.sku, stockEditando);
                            setEdicionRapidaSku(null);
                          }}
                          className="p-1 bg-cyan-600 text-white rounded-md"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => {
                          setEdicionRapidaSku(item.sku);
                          setStockEditando(item.stockActual);
                        }}
                        title="Toca para escribir número directo"
                        className={`px-2 text-xs font-black cursor-pointer ${esAgotado
                          ? "text-rose-400"
                          : esCritico
                            ? "text-amber-400"
                            : "text-zinc-200"
                          }`}
                      >
                        {item.stockActual} u.
                      </span>
                    )}

                    <button
                      onClick={() => modificarStockRapido(item.sku, 1)}
                      title="Sumar 1 unidad"
                      className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 font-bold hover:bg-cyan-950/60 hover:text-cyan-300 active:scale-95 transition"
                    >
                      +
                    </button>
                  </div>

                  <span className={`text-[9px] font-bold ${esAgotado ? "text-rose-400" : esCritico ? "text-amber-400" : "text-cyan-400"
                    }`}>
                    {esAgotado ? "AGOTADO" : esCritico ? "POCO STOCK" : "DISPONIBLE"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Producto */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-100">Agregar Producto al Stock</h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearProducto} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Empanada de Carne Cortada a Cuchillo"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Código / SKU (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Auto"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium text-xs font-mono focus:ring-2 focus:ring-cyan-400 outline-none"
                    style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Categoría</label>
                  <input
                    type="text"
                    placeholder="General"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                    style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Precio Costo ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={precioCosto}
                    onChange={(e) => setPrecioCosto(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white font-medium text-xs focus:ring-2 focus:ring-cyan-400 outline-none"
                    style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-cyan-300 text-xs font-black focus:ring-2 focus:ring-cyan-400 outline-none"
                    style={{ color: "#22d3ee", WebkitTextFillColor: "#22d3ee" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-bold focus:ring-2 focus:ring-cyan-400 outline-none"
                    style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Aviso Stock Mínimo</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-xs font-medium focus:ring-2 focus:ring-cyan-400 outline-none"
                    style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                  />
                </div>
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
                  className="w-1/2 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-md border border-cyan-400/30"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
