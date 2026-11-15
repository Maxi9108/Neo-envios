# 🚚 Neo-Envíos • Familia NeoFaro

Plataforma inteligente de control de despachos, logística de entregas en ruta, gestión de inventario, cuentas corrientes/fiados y arqueo de caja centralizada. Diseñada para operar **24/7** como **PWA (Progressive Web App)** instalable en dispositivos móviles y de escritorio.

---

## ✨ Características Principales

* **🚚 Hoja de Ruta y Mapa Interactivo:**
  * Traza de ruta geodésica exclusivamente sobre pedidos en estado `EN_RUTA`.
  * Optimización de paradas numeradas con acceso directo a navegación GPS en Google Maps.
* **📍 Geocodificación y Selector de Localidades:**
  * Búsqueda inteligente de direcciones con resolución de múltiples localidades (Nominatim OpenStreetMap).
  * Selector modal con pin neón interactivo arrastrable y geocodificación inversa.
* **📅 Programación de Envíos y Detector de Cercanía (< 300m):**
  * Organización de pedidos por fecha pactada de entrega.
  * Algoritmo Haversine en tiempo real que alerta si un pedido de otra fecha queda a menos de 300 metros de la ruta activa, permitiendo aceptarlo o descartarlo individualmente o en lote.
* **📦 Modificación en Caliente durante la Entrega:**
  * Edición en vivo de artículos en el domicilio (sumar productos de stock, ítems libres o anular).
  * Descuento automático de existencias en el inventario al entregar.
* **🔄 Control de Envases Retornables (Bidones, Sifones, etc.):**
  * Registro de envases entregados vs. devueltos con historial acumulado de envases adeudados por cliente.
* **🧾 Comprobantes Digitales y WhatsApp Automático:**
  * Ticket comercial térmico para ventas y estado de deuda/fiados.
  * Disparo automático del comprobante con detalle de compra, saldo pendiente y envases adeudados vía WhatsApp.
* **💰 Finanzas y Caja:**
  * Libreta de deudores (fiados) con registro de abonos y balance neto en vivo.
* **👑 Panel Administrador Maestro:**
  * Acceso de administración centralizada (`maxi0802@gmail.com`) con aprovisionamiento de bases de datos multi-tenant en Google Drive y control de suspensiones.

---

## 🚀 Despliegue 24/7 en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new).
2. Conecta tu cuenta de GitHub y selecciona el repositorio **`Maxi9108/Neo-envios`**.
3. Mantén los ajustes predeterminados (Framework Preset: **Vite**, Build: `npm run build`, Output: `dist`).
4. Haz clic en **Deploy**. ¡Tu plataforma estará activa en la nube en menos de un minuto con HTTPS gratuito!

---

## 📲 Instalación como App Móvil (PWA)

* **En Android (Chrome):** Abre el enlace de Vercel y toca **«Agregar a la pantalla principal»** o **«Instalar aplicación»**.
* **En iOS (Safari):** Toca el botón Compartir y selecciona **«Agregar a inicio»**.
