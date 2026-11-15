// Serverless Function para Vercel: /api/verificar-neofaro
// Valida en tiempo real si un comercio o usuario pertenece al ecosistema NeoFaro

const SUPABASE_URL = process.env.NEOFARO_SUPABASE_URL || "https://hajepxscgwbgiifcfndz.supabase.co";
const SUPABASE_KEY = process.env.NEOFARO_SUPABASE_SERVICE_KEY || "sb_publishable_2mXV3C1pkQcp5SK8xD2FIg_EkjLTAhI";

export default async function handler(req, res) {
  // Cabeceras CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const emailRaw = req.method === "POST" ? req.body?.email : req.query?.email;
    const nombreRaw = req.method === "POST" ? req.body?.nombreComercio : req.query?.nombreComercio;

    const cleanEmail = (emailRaw || "").trim().toLowerCase();
    const cleanNombre = (nombreRaw || "").trim().toLowerCase();

    if (!cleanEmail && !cleanNombre) {
      return res.status(400).json({
        registrado: false,
        mensaje: "Debes proporcionar el correo electrónico del comercio."
      });
    }

    // Admin maestro siempre autorizado
    if (cleanEmail === "maxi0802@gmail.com" || cleanEmail === "lic.maxisanchez@gmail.com") {
      return res.status(200).json({
        registrado: true,
        nombreComercio: "Administración Central NeoFaro",
        email: cleanEmail,
        rol: "ADMIN"
      });
    }

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    };

    // 1. Buscar en solicitudes_modificacion (donde se guarda email_comercio y datos del comercio en NeoFaro)
    const solRes = await fetch(`${SUPABASE_URL}/rest/v1/solicitudes_modificacion?select=*`, { headers });
    if (solRes.ok) {
      const solicitudes = await solRes.json();
      if (Array.isArray(solicitudes)) {
        const matchSol = solicitudes.find(s => {
          const em1 = (s.cambios?.email_comercio || "").trim().toLowerCase();
          const em2 = (s.cambios?.email || "").trim().toLowerCase();
          const nom = (s.comercio_nombre || s.cambios?.nombre || "").trim().toLowerCase();
          return (cleanEmail && (em1 === cleanEmail || em2 === cleanEmail)) || (cleanNombre && nom === cleanNombre);
        });

        if (matchSol) {
          return res.status(200).json({
            registrado: true,
            idComercio: matchSol.comercio_id || matchSol.id,
            nombreComercio: matchSol.comercio_nombre || matchSol.cambios?.nombre || "Comercio NeoFaro",
            email: matchSol.cambios?.email_comercio || matchSol.cambios?.email || cleanEmail,
            direccion: matchSol.cambios?.direccion || "",
            telefono: matchSol.cambios?.whatsapp || matchSol.cambios?.telefono || ""
          });
        }
      }
    }

    // 2. Buscar en tabla 'usuarios' de NeoFaro
    if (cleanEmail) {
      const usrRes = await fetch(
        `${SUPABASE_URL}/rest/v1/usuarios?email=ilike.${encodeURIComponent(cleanEmail)}&select=*`,
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
                `${SUPABASE_URL}/rest/v1/comercios?id=eq.${encodeURIComponent(u.comercio_id)}&select=*`,
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
          return res.status(200).json({
            registrado: true,
            idComercio: u.comercio_id || u.id,
            nombreComercio: u.comercio_nombre || u.nombre || "Comercio NeoFaro",
            email: u.email,
            direccion,
            telefono
          });
        }
      }
    }

    // 3. Buscar en tabla 'comercios' por nombre si fue provisto
    const comRes = await fetch(`${SUPABASE_URL}/rest/v1/comercios?select=*`, { headers });
    if (comRes.ok) {
      const comercios = await comRes.json();
      if (Array.isArray(comercios) && comercios.length > 0) {
        const matchCom = comercios.find(c => {
          const nom = (c.nombre || "").trim().toLowerCase();
          return cleanNombre && nom === cleanNombre;
        });
        if (matchCom) {
          return res.status(200).json({
            registrado: true,
            idComercio: matchCom.id,
            nombreComercio: matchCom.nombre,
            direccion: matchCom.direccion || "",
            telefono: matchCom.telefono || ""
          });
        }
      }
    }

    // 4. Buscar en Auth Users de Supabase NeoFaro
    if (cleanEmail) {
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers });
      if (authRes.ok) {
        const authData = await authRes.json();
        const usersList = authData?.users || [];
        const matchUser = usersList.find(u => (u.email || "").trim().toLowerCase() === cleanEmail);
        if (matchUser) {
          return res.status(200).json({
            registrado: true,
            idComercio: matchUser.id,
            nombreComercio: matchUser.user_metadata?.nombre || matchUser.user_metadata?.comercio_nombre || cleanEmail.split("@")[0],
            email: matchUser.email
          });
        }
      }
    }

    // Si no se encontró en ninguna tabla de NeoFaro:
    return res.status(200).json({
      registrado: false,
      mensaje: "Este comercio no se encuentra registrado en NeoFaro. Debes registrarte primero en la plataforma NeoFaro para poder utilizar Neo-Envíos."
    });
  } catch (error) {
    console.error("Error verificando comercio en NeoFaro:", error);
    return res.status(500).json({
      registrado: false,
      error: "Error al conectar con el servidor de verificación de NeoFaro."
    });
  }
}

