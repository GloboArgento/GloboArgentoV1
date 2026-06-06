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

// -------------------- Lista de países --------------------
const paises = [
    {nombre: "Argentina",           pista:"Cuna del tango y del mate amargo"},
    {nombre: "Brasil",              pista:"Fútbol, carnaval y samba que contagia"},
    {nombre: "México",              pista:"Tacos, mariachi y volcanes imponentes"},
    {nombre: "Chile",               pista:"Poetas, vinos y el desierto más seco"},
    {nombre: "Colombia",            pista:"Café aromático y la cumbia que mueve"},
    {nombre: "Perú",                pista:"Machu Picchu y ceviche delicioso"},
    {nombre: "Uruguay",             pista:"Chivito, mate y playas tranquilas"},
    {nombre: "Venezuela",           pista:"Arepas y la cascada más alta"},
    {nombre: "Cuba",                pista:"Habana Vieja, mojitos y coches antiguos"},
    {nombre: "Costa Rica",          pista:"Pura vida y selvas exuberantes"},
    {nombre: "República Dominicana",pista:"Merengue y playas caribeñas"},
    {nombre: "Estados Unidos",      pista:"La Estatua de la Libertad"},
    {nombre: "Japón",               pista:"País del sushi y samuráis"},
    {nombre: "Reino Unido",         pista:"Big Ben y té tradicional"},
    {nombre: "Francia",             pista:"Torre Eiffel y croissants"},
    {nombre: "Alemania",            pista:"Oktoberfest y autos famosos"},
    {nombre: "Italia",              pista:"Pizza, Coliseo y arte renacentista"},
    {nombre: "España",              pista:"Paella y flamenco apasionado"},
    {nombre: "China",               pista:"La Gran Muralla y dragones legendarios"},
    {nombre: "India",               pista:"Taj Mahal y especias exóticas"},
    {nombre: "Sudáfrica",           pista:"Animales salvajes y safaris increíbles"},
    {nombre: "Australia",           pista:"Canguros y Opera House icónica"},
    {nombre: "Panamá",              pista:"Canal que une dos océanos"},
    {nombre: "Guatemala",           pista:"Ruinas mayas y volcanes imponentes"},
    {nombre: "Honduras",            pista:"Ruinas de Copán y playas tropicales"},
    {nombre: "Bolivia",             pista:"Salar de Uyuni y montañas altas"},
    {nombre: "Paraguay",            pista:"Ríos grandes y cultura guaraní"},
    {nombre: "Ecuador",             pista:"Islas Galápagos y volcanes activos"},
    {nombre: "Nicaragua",           pista:"Lagos y volcanes impresionantes"},
    {nombre: "El Salvador",         pista:"Surf y pupusas deliciosas"},
    {nombre: "Belice",              pista:"Arrecifes y selvas tropicales"},
    {nombre: "Jamaica",             pista:"Reggae y playas de ensueño"},
    {nombre: "Haití",               pista:"Historia, arte y cultura caribeña"},
    {nombre: "Trinidad y Tobago",   pista:"Carnaval y calipso vibrante"},
    {nombre: "Guyana",              pista:"Selva amazónica y cataratas enormes"},
    {nombre: "Surinam",             pista:"Diversidad cultural y naturaleza pura"},
];

// -------------------- ELEMENTOS DEL DOM --------------------
const inputRespuesta  = document.getElementById("inputRespuesta");
const botonEnviar     = document.getElementById("botonEnviar");
const mensajeDesafio  = document.getElementById("mensajeDesafio");
const pistaDesafio    = document.getElementById("pistaDesafio");
const cronometroSpan  = document.getElementById("cronometro");
cronometroSpan.style.position = "relative";

// -------------------- MONEDAS --------------------
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
    setTimeout(() => mensajeMoneda.style.opacity = "0", 1800);
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

// -------------------- FUNCIONES DEL DESAFÍO --------------------
function normalizar(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

let segundosExtra  = parseInt(localStorage.getItem('segundosExtra')) || 0;
let paisesRestantes = [...paises];
let desafioHoy = null;
let tiempoBase = 15;
let tiempo = tiempoBase;
let timer = null;

function mostrarAnimacionSegundosExtra(extra) {
    if (extra <= 0) return;
    const animSpan = document.createElement("span");
    animSpan.textContent = `+${extra}s`;
    animSpan.style.cssText = "position:absolute;top:-25px;left:50%;transform:translateX(-50%);font-size:18px;color:#28a745;font-weight:bold;transition:all 1s ease-out;";
    cronometroSpan.appendChild(animSpan);
    setTimeout(() => { animSpan.style.top = "-50px"; animSpan.style.opacity = "0"; }, 50);
    setTimeout(() => animSpan.remove(), 1100);
}

function actualizarColorCronometro() {
    if (tiempo > 10)     cronometroSpan.style.color = "#28a745";
    else if (tiempo > 5) cronometroSpan.style.color = "#ffc107";
    else                 cronometroSpan.style.color = "#dc3545";
}

function actualizarCronometro() {
    tiempo--;
    cronometroSpan.textContent = tiempo;
    actualizarColorCronometro();
    if (tiempo <= 0) {
        clearInterval(timer);
        mensajeDesafio.textContent = "Se acabó el tiempo ❌";
        mensajeDesafio.style.color = "red";
        botonEnviar.disabled = true;
        inputRespuesta.disabled = true;
    }
}

function nuevoDesafio() {
    if (paisesRestantes.length === 0) { juegoTerminado(); return; }

    const idx = Math.floor(Math.random() * paisesRestantes.length);
    desafioHoy = paisesRestantes[idx];
    paisesRestantes.splice(idx, 1);
    pistaDesafio.textContent = desafioHoy.pista;

    clearInterval(timer);
    tiempo = tiempoBase;
    if (segundosExtra > 0) {
        tiempo += segundosExtra;
        mostrarAnimacionSegundosExtra(segundosExtra);
        segundosExtra = 0;
        localStorage.setItem('segundosExtra', segundosExtra);
    }
    cronometroSpan.textContent = tiempo;
    actualizarColorCronometro();
    botonEnviar.disabled = false;
    inputRespuesta.disabled = false;
    inputRespuesta.value = "";
    mensajeDesafio.textContent = "";
    timer = setInterval(actualizarCronometro, 1000);
}

function juegoTerminado() {
    clearInterval(timer);
    cronometroSpan.textContent = "0";
    botonEnviar.disabled = true;
    inputRespuesta.disabled = true;
    mensajeDesafio.innerHTML = `🎉 <span style="color:#e84393;font-size:24px;">¡Juego Terminado!</span> 🎉`;
    mensajeDesafio.style.cssText = "font-weight:bold;font-size:24px;text-align:center;animation:juegoTerminado 1s ease infinite alternate;";
    const style = document.createElement('style');
    style.innerHTML = `@keyframes juegoTerminado { 0%{transform:scale(1);color:#e84393;} 50%{transform:scale(1.2);color:#fdcb6e;} 100%{transform:scale(1);color:#e84393;} }`;
    document.head.appendChild(style);
}

function comprobarDesafio() {
    clearInterval(timer);
    const respuesta = inputRespuesta.value.trim();
    if (!respuesta) return;

    if (normalizar(respuesta) === normalizar(desafioHoy.nombre)) {
        mensajeDesafio.textContent = "¡Correcto! 🎉";
        mensajeDesafio.style.color = "green";
        sumarMonedas(10);
        // Guardar en estadísticas: desafío correcto
        actualizarEstadisticasSupabase(0, 1, 0, 1);
        sumarPuntosRanking(10);
    } else {
        mensajeDesafio.textContent = `Incorrecto ❌ Era ${desafioHoy.nombre}`;
        mensajeDesafio.style.color = "red";
        actualizarEstadisticasSupabase(0, 0, 1, 0);
    }

    mensajeDesafio.style.fontWeight = "bold";
    mensajeDesafio.style.fontSize   = "20px";
    mensajeDesafio.style.transition = "all 0.5s";
    mensajeDesafio.style.animation  = "pulse 0.6s";

    setTimeout(nuevoDesafio, 1500);
}

// -------------------- EVENTOS --------------------
botonEnviar.addEventListener("click", comprobarDesafio);
inputRespuesta.addEventListener("keydown", (e) => { if (e.key === "Enter") comprobarDesafio(); });

// -------------------- INICIALIZACIÓN --------------------
actualizarMonedasDisplay(false);
nuevoDesafio();
