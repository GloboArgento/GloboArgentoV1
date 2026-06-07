// ============================================================
// monedas.js — funciones compartidas para el sistema de monedas
// Incluir este script en juego.html, emoji.html, desafio.html, tienda.html
// SIEMPRE después de supabase.js
// ============================================================

// Cliente Supabase compartido (si ya existe en la página, no lo redeclara)
if (typeof _sbMonedas === 'undefined') {
    var _sbMonedas = (() => {
        const { createClient } = supabase;
        return createClient(
            "https://tapctytjeknttbmoqflx.supabase.co",
            "sb_publishable_vre912nf_gM7sSk6lgzBZQ_sgUIAwlP",
            { auth: { flowType:'pkce', persistSession:true, detectSessionInUrl:true, storage:window.localStorage } }
        );
    })();
}

// Obtener userId de sesión activa (null si sin cuenta)
async function _getUserId() {
    const { data: { session } } = await _sbMonedas.auth.getSession();
    return session?.user?.id || null;
}

// Leer monedas desde Supabase (o localStorage si sin cuenta)
async function leerMonedas() {
    const userId = await _getUserId();
    if (!userId) return parseInt(localStorage.getItem('monedas')) || 0;

    const { data } = await _sbMonedas.from("Perfiles").select("monedas").eq("id", userId).single();
    return data?.monedas ?? 0;
}

// Guardar monedas en Supabase (o localStorage si sin cuenta)
async function guardarMonedas(cantidad) {
    const userId = await _getUserId();
    if (!userId) {
        localStorage.setItem('monedas', cantidad);
        return;
    }
    await _sbMonedas.from("Perfiles").update({ monedas: cantidad }).eq("id", userId);
}

// Sumar monedas
async function sumarMonedasDB(cantidad) {
    const actual = await leerMonedas();
    const nuevo  = actual + cantidad;
    await guardarMonedas(nuevo);
    return nuevo;
}

// Gastar monedas — devuelve true si pudo, false si no alcanza
async function gastarMonedasDB(cantidad) {
    const actual = await leerMonedas();
    if (actual < cantidad) return false;
    await guardarMonedas(actual - cantidad);
    return true;
}
