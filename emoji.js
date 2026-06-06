// -------------------- SUPABASE --------------------
const { createClient } = supabase;
const supabaseClient = createClient(
    "https://tapctytjeknttbmoqflx.supabase.co",
    "sb_publishable_vre912nf_gM7sSk6lgzBZQ_sgUIAwlP",
    {
        auth: {
            flowType: 'pkce',
            persistSession: true,
            detectSessionInUrl: true,
            storage: window.localStorage
        }
    }
);

// -------------------- FUNCIÓN COMPARTIDA: SUMAR PUNTOS AL RANKING --------------------
async function sumarPuntosRanking(puntosNuevos) {
    if (puntosNuevos <= 0) return;

    // Sin sesión de Supabase = juega sin cuenta, no sube al ranking
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) {
        console.log("Sin cuenta — los puntos no se guardan en el ranking.");
        return;
    }

    // Obtener nombre del perfil desde Supabase (nombre único en el juego)
    const { data: perfil } = await supabaseClient
        .from("Perfiles")
        .select("nombre_usuario")
        .eq("id", session.user.id)
        .single();

    if (!perfil?.nombre_usuario) {
        console.log("Sin perfil configurado — los puntos no se guardan.");
        return;
    }

    const nombreUsuario = perfil.nombre_usuario;

    const { data: existente, error: errorBusqueda } = await supabaseClient
        .from("Ranking")
        .select("puntos")
        .eq("usuario", nombreUsuario)
        .single();

    if (errorBusqueda && errorBusqueda.code !== "PGRST116") {
        console.error("Error buscando usuario en ranking:", errorBusqueda.message);
        return;
    }

    if (existente) {
        const { error } = await supabaseClient
            .from("Ranking")
            .update({ puntos: existente.puntos + puntosNuevos })
            .eq("usuario", nombreUsuario);
        if (error) console.error("Error actualizando ranking:", error.message);
        else console.log(`✅ Ranking actualizado: ${nombreUsuario} → +${puntosNuevos} (total: ${existente.puntos + puntosNuevos})`);
    } else {
        const { error } = await supabaseClient
            .from("Ranking")
            .insert({ usuario: nombreUsuario, puntos: puntosNuevos });
        if (error) console.error("Error creando entrada en ranking:", error.message);
        else console.log(`✅ Nuevo en ranking: ${nombreUsuario} → ${puntosNuevos} puntos`);
    }
}

// -------------------- Lista de países con emojis --------------------
const paisesEmojis = [
    { pais: "Argentina", emojis: ["🥩","⚽","🍷","🌄","🧉"] },
    { pais: "Brasil", emojis: ["🥥","⚽","🎉","🌴","🥁"] },
    { pais: "México", emojis: ["🌮","🌵","🎉","🐍","🎸"] },
    { pais: "Canadá", emojis: ["🍁","🛶","🏒","🐻","❄️"] },
    { pais: "Japón", emojis: ["🍣","🗻","🎎","🈴","🌸"] },
    { pais: "Francia", emojis: ["🥐","🍷","🗼","🎨","🛵"] },
    { pais: "Alemania", emojis: ["🍺","🥨","🏰","🚗","⚽"] },
    { pais: "Italia", emojis: ["🍕","🍝","🏛️","🎨","⛵"] },
    { pais: "España", emojis: ["🥘","🍷","💃","🏰","🎶"] },
    { pais: "Estados Unidos", emojis: ["🍔","🎬","🗽","🎸","🏈"] },
    { pais: "Australia", emojis: ["🦘","🌊","🏄‍♂️","🐨","🌏"] },
    { pais: "India", emojis: ["🕌","🍛","🐘","🎉","🌸"] },
    { pais: "Egipto", emojis: ["🕌","🏜️","🦁","🛶","🗿"] },
    { pais: "Noruega", emojis: ["❄️","⛷️","🏔️","🛶","🐟"] },
    { pais: "Sudáfrica", emojis: ["🦁","🏞️","⛺","🍷","🌍"] },
    { pais: "China", emojis: ["🀄","🐉","🏯","🥟","🈶"] },
    { pais: "Grecia", emojis: ["🏛️","🍇","⛵","🦑","🌊"] },
    { pais: "Tailandia", emojis: ["🏝️","🐘","🍤","🛶","🎭"] },
    { pais: "Rusia", emojis: ["❄️","🏰","🚂","🥟","🐻"] },
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
    const cantidadSpan = document.getElementById("cantidadMonedas");
    cantidadSpan.textContent = monedas;
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

function gastarMonedas(cantidad) {
    if (monedas >= cantidad) {
        monedas -= cantidad;
        localStorage.setItem('monedas', monedas);
        actualizarMonedasDisplay(true);
        return true;
    } else {
        mostrarMensaje("❌ ¡Monedas insuficientes!");
        return false;
    }
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
        // +8 puntos al ranking por cada acierto en emoji
        sumarPuntosRanking(8);
    } else {
        mensajeEmoji.textContent = `❌ Incorrecto! Era ${paisesEmojis[currentIndex].pais}`;
    }

    setTimeout(() => {
        currentIndex++;
        if (currentIndex >= paisesEmojis.length) currentIndex = 0;
        mostrarEmoji();
    }, 1500);
}

botonComprobar.onclick = comprobarRespuesta;
inputPais.addEventListener("keydown", (e) => {
    if (e.key === "Enter") comprobarRespuesta();
});

// -------------------- Inicializa --------------------
actualizarMonedasDisplay(false);
mostrarEmoji();
