// -------------------- SUPABASE --------------------
const { createClient } = supabase;
const supabaseClient = createClient(
    "https://tapctytjeknttbmoqflx.supabase.co",
    "sb_publishable_vre912nf_gM7sSk6lgzBZQ_sgUIAwlP",
    {
        auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true, storage: window.localStorage }
    }
);

// -------------------- SUMAR PUNTOS AL RANKING --------------------
async function sumarPuntosRanking(puntosNuevos) {
    if (puntosNuevos <= 0) return;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) return;

    const { data: perfil } = await supabaseClient
        .from("Perfiles").select("nombre_usuario").eq("id", session.user.id).single();
    if (!perfil?.nombre_usuario) return;

    const nombreUsuario = perfil.nombre_usuario;
    const { data: existente, error: errorBusqueda } = await supabaseClient
        .from("Ranking").select("puntos").eq("usuario", nombreUsuario).single();

    if (errorBusqueda && errorBusqueda.code !== "PGRST116") return;

    if (existente) {
        await supabaseClient.from("Ranking")
            .update({ puntos: existente.puntos + puntosNuevos }).eq("usuario", nombreUsuario);
    } else {
        await supabaseClient.from("Ranking")
            .insert({ usuario: nombreUsuario, puntos: puntosNuevos });
    }
}

// -------------------- ACTUALIZAR ESTADÍSTICAS EN SUPABASE --------------------
async function actualizarEstadisticasSupabase(partidas, aciertos, fallos, desafios) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;
    const { data: existente, error: errBusq } = await supabaseClient
        .from("Estadisticas").select("*").eq("id", userId).single();

    if (errBusq && errBusq.code !== "PGRST116") return;

    if (existente) {
        await supabaseClient.from("Estadisticas").update({
            total_partidas: existente.total_partidas + partidas,
            total_aciertos: existente.total_aciertos + aciertos,
            total_fallos:   existente.total_fallos   + fallos,
            total_desafios: existente.total_desafios + desafios,
            updated_at: new Date().toISOString()
        }).eq("id", userId);
    } else {
        await supabaseClient.from("Estadisticas").insert({
            id: userId, total_partidas: partidas,
            total_aciertos: aciertos, total_fallos: fallos, total_desafios: desafios
        });
    }
}

// -------------------- Lista de países con emojis --------------------
const paisesEmojis = [
    { pais: "Argentina",     emojis: ["🥩","⚽","🍷","🌄","🧉"] },
    { pais: "Brasil",        emojis: ["🥥","⚽","🎉","🌴","🥁"] },
    { pais: "México",        emojis: ["🌮","🌵","🎉","🐍","🎸"] },
    { pais: "Canadá",        emojis: ["🍁","🛶","🏒","🐻","❄️"] },
    { pais: "Japón",         emojis: ["🍣","🗻","🎎","🈴","🌸"] },
    { pais: "Francia",       emojis: ["🥐","🍷","🗼","🎨","🛵"] },
    { pais: "Alemania",      emojis: ["🍺","🥨","🏰","🚗","⚽"] },
    { pais: "Italia",        emojis: ["🍕","🍝","🏛️","🎨","⛵"] },
    { pais: "España",        emojis: ["🥘","🍷","💃","🏰","🎶"] },
    { pais: "Estados Unidos",emojis: ["🍔","🎬","🗽","🎸","🏈"] },
    { pais: "Australia",     emojis: ["🦘","🌊","🏄‍♂️","🐨","🌏"] },
    { pais: "India",         emojis: ["🕌","🍛","🐘","🎉","🌸"] },
    { pais: "Egipto",        emojis: ["🕌","🏜️","🦁","🛶","🗿"] },
    { pais: "Noruega",       emojis: ["❄️","⛷️","🏔️","🛶","🐟"] },
    { pais: "Sudáfrica",     emojis: ["🦁","🏞️","⛺","🍷","🌍"] },
    { pais: "China",         emojis: ["🀄","🐉","🏯","🥟","🈶"] },
    { pais: "Grecia",        emojis: ["🏛️","🍇","⛵","🦑","🌊"] },
    { pais: "Tailandia",     emojis: ["🏝️","🐘","🍤","🛶","🎭"] },
    { pais: "Rusia",         emojis: ["❄️","🏰","🚂","🥟","🐻"] },
    { pais: "Nueva Zelanda", emojis: ["🏔️","🛶","🦘","🌿","⚽"] }
];

function mezclarArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
mezclarArray(paisesEmojis);

let currentIndex = 0;
let tiempo = 15;
let timer;
let aciertosEmoji = 0; // contador de aciertos de la sesión

const emojiContainer = document.getElementById("emoji-container");
const inputPais      = document.getElementById("inputPais");
const botonComprobar = document.getElementById("botonComprobar");
const mensajeEmoji   = document.getElementById("mensajeEmoji");
const barraTiempo    = document.getElementById("barraTiempo");

// -------------------- SISTEMA DE MONEDAS --------------------
let monedas = parseInt(localStorage.getItem('monedas')) || 0;
const monedaDiv = document.createElement("div");
monedaDiv.id = "monedaDiv";
monedaDiv.innerHTML = `🪙 <span id="cantidadMonedas">${monedas}</span>`;
document.body.appendChild(monedaDiv);
const mensajeMoneda = document.createElement("div");
mensajeMoneda.id = "mensajeMoneda";
document.body.appendChild(mensajeMoneda);

function mostrarMensaje(msg) {
    mensajeMoneda.textContent = msg;
    mensajeMoneda.style.opacity = "1";
    setTimeout(() => { mensajeMoneda.style.opacity = "0"; }, 1800);
}
function actualizarMonedasDisplay(animar = true) {
    document.getElementById("cantidadMonedas").textContent = monedas;
    if (animar) {
        monedaDiv.classList.add("monedaAnim");
        setTimeout(() => monedaDiv.classList.remove("monedaAnim"), 500);
    }
}
function sumarMonedas(cantidad) {
    monedas += cantidad;
    localStorage.setItem('monedas', monedas);
    actualizarMonedasDisplay(true);
}

// -------------------- Funciones del juego --------------------
function normalizar(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function mostrarEmoji() {
    const item = paisesEmojis[currentIndex];
    emojiContainer.textContent = item.emojis.join(" ");
    inputPais.value = "";
    mensajeEmoji.textContent = "";
    tiempo = 15;
    barraTiempo.style.width = "100%";
    barraTiempo.style.backgroundColor = "#4A90E2";

    clearInterval(timer);
    timer = setInterval(() => {
        tiempo--;
        barraTiempo.style.width = `${(tiempo / 15) * 100}%`;
        barraTiempo.style.backgroundColor = `hsl(${(tiempo / 15) * 120}, 70%, 50%)`;
        if (tiempo <= 0) {
            clearInterval(timer);
            mensajeEmoji.textContent = `¡Se acabó el tiempo! Era ${item.pais}`;
            setTimeout(() => {
                currentIndex++;
                if (currentIndex >= paisesEmojis.length) currentIndex = 0;
                mostrarEmoji();
            }, 1500);
        }
    }, 1000);
}

function comprobarRespuesta() {
    const respuesta = normalizar(inputPais.value.trim());
    const correcto  = normalizar(paisesEmojis[currentIndex].pais);
    clearInterval(timer);

    if (respuesta === correcto) {
        mensajeEmoji.textContent = "✅ Correcto!";
        sumarMonedas(8);
        aciertosEmoji++;
        // Guardar en estadísticas (acierto de emoji cuenta como acierto general)
        actualizarEstadisticasSupabase(0, 1, 0, 0);
        sumarPuntosRanking(8);
    } else {
        mensajeEmoji.textContent = `❌ Incorrecto! Era ${paisesEmojis[currentIndex].pais}`;
        actualizarEstadisticasSupabase(0, 0, 1, 0);
    }

    setTimeout(() => {
        currentIndex++;
        if (currentIndex >= paisesEmojis.length) currentIndex = 0;
        mostrarEmoji();
    }, 1500);
}

botonComprobar.onclick = comprobarRespuesta;
inputPais.addEventListener("keydown", (e) => { if (e.key === "Enter") comprobarRespuesta(); });

// -------------------- Inicializa --------------------
actualizarMonedasDisplay(false);
mostrarEmoji();
