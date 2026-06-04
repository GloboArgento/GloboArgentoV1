const paises = [
    {nombre: "Argentina", pista:"Cuna del tango y del mate amargo"},
    {nombre: "Brasil", pista:"Fútbol, carnaval y samba que contagia"},
    {nombre: "México", pista:"Tacos, mariachi y volcanes imponentes"},
    {nombre: "Chile", pista:"Poetas, vinos y el desierto más seco"},
    {nombre: "Colombia", pista:"Café aromático y la cumbia que mueve"},
    {nombre: "Perú", pista:"Machu Picchu y ceviche delicioso"},
    {nombre: "Uruguay", pista:"Chivito, mate y playas tranquilas"},
    {nombre: "Venezuela", pista:"Arepas y la cascada más alta"},
    {nombre: "Cuba", pista:"Habana Vieja, mojitos y coches antiguos"},
    {nombre: "Costa Rica", pista:"Pura vida y selvas exuberantes"},
    {nombre: "República Dominicana", pista:"Merengue y playas caribeñas"},
    {nombre: "Estados Unidos", pista:"La Estatua de la Libertad"},
    {nombre: "Japón", pista:"País del sushi y samuráis"},
    {nombre: "Reino Unido", pista:"Big Ben y té tradicional"},
    {nombre: "Francia", pista:"Torre Eiffel y croissants"},
    {nombre: "Alemania", pista:"Oktoberfest y autos famosos"},
    {nombre: "Italia", pista:"Pizza, Coliseo y arte renacentista"},
    {nombre: "España", pista:"Paella y flamenco apasionado"},
    {nombre: "China", pista:"La Gran Muralla y dragones legendarios"},
    {nombre: "India", pista:"Taj Mahal y especias exóticas"},
    {nombre: "Sudáfrica", pista:"Animales salvajes y safaris increíbles"},
    {nombre: "Australia", pista:"Canguros y Opera House icónica"},
    {nombre: "Panamá", pista:"Canal que une dos océanos"},
    {nombre: "Guatemala", pista:"Ruinas mayas y volcanes imponentes"},
    {nombre: "Honduras", pista:"Ruinas de Copán y playas tropicales"},
    {nombre: "Bolivia", pista:"Salar de Uyuni y montañas altas"},
    {nombre: "Paraguay", pista:"Ríos grandes y cultura guaraní"},
    {nombre: "Ecuador", pista:"Islas Galápagos y volcanes activos"},
    {nombre: "Nicaragua", pista:"Lagos y volcanes impresionantes"},
    {nombre: "El Salvador", pista:"Surf y pupusas deliciosas"},
    {nombre: "Belice", pista:"Arrecifes y selvas tropicales"},
    {nombre: "Jamaica", pista:"Reggae y playas de ensueño"},
    {nombre: "Haití", pista:"Historia, arte y cultura caribeña"},
    {nombre: "Trinidad y Tobago", pista:"Carnaval y calipso vibrante"},
    {nombre: "Guyana", pista:"Selva amazónica y cataratas enormes"},
    {nombre: "Surinam", pista:"Diversidad cultural y naturaleza pura"},
    {nombre: "París (sí, Francia extra)", pista:"Torre Eiffel y croissants"},
];

// -------------------- ELEMENTOS DEL DOM --------------------
const inputRespuesta = document.getElementById("inputRespuesta");
const botonEnviar = document.getElementById("botonEnviar");
const mensajeDesafio = document.getElementById("mensajeDesafio");
const pistaDesafio = document.getElementById("pistaDesafio");
const cronometroSpan = document.getElementById("cronometro");
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

function actualizarMonedasDisplay(animar = true){
    document.getElementById("cantidadMonedas").textContent = monedas;
    if(animar){
        monedaDiv.classList.add("monedaAnim");
        setTimeout(() => monedaDiv.classList.remove("monedaAnim"), 500);
    }
}

function sumarMonedas(cantidad){
    monedas += cantidad;
    localStorage.setItem('monedas', monedas);
    actualizarMonedasDisplay(true);
}

// -------------------- FUNCIONES DEL DESAFÍO --------------------
function normalizar(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Segundos extra comprados
let segundosExtra = parseInt(localStorage.getItem('segundosExtra')) || 0;

// -------------------- CONTROL DE DESAFÍOS --------------------
// Clonamos el array para ir eliminando los que ya aparecieron
let paisesRestantes = [...paises];

let desafioHoy = null;
let tiempoBase = 15;
let tiempo = tiempoBase;
let timer = null;

// Función para mostrar animación de +segundosExtra
function mostrarAnimacionSegundosExtra(extra) {
    if(extra <= 0) return;
    const animSpan = document.createElement("span");
    animSpan.textContent = `+${extra}s`;
    animSpan.style.position = "absolute";
    animSpan.style.top = "-25px";
    animSpan.style.left = "50%";
    animSpan.style.transform = "translateX(-50%)";
    animSpan.style.fontSize = "18px";
    animSpan.style.color = "#28a745";
    animSpan.style.fontWeight = "bold";
    animSpan.style.transition = "all 1s ease-out";
    cronometroSpan.appendChild(animSpan);

    setTimeout(() => {
        animSpan.style.top = "-50px";
        animSpan.style.opacity = "0";
    }, 50);

    setTimeout(() => animSpan.remove(), 1100);
}

// Función para actualizar el cronómetro y colores
function actualizarColorCronometro() {
    if (tiempo > 10) cronometroSpan.style.color = "#28a745"; 
    else if (tiempo > 5) cronometroSpan.style.color = "#ffc107"; 
    else cronometroSpan.style.color = "#dc3545"; 
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

// Selecciona un nuevo desafío de los restantes
function nuevoDesafio() {
    if(paisesRestantes.length === 0){
        juegoTerminado();
        return;
    }

    // Elegir aleatorio
    const idx = Math.floor(Math.random() * paisesRestantes.length);
    desafioHoy = paisesRestantes[idx];
    paisesRestantes.splice(idx,1); // eliminar para que no se repita

    pistaDesafio.textContent = desafioHoy.pista;

    // Reset de cronómetro
    clearInterval(timer);
    tiempo = tiempoBase;
    if(segundosExtra > 0){
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

// Cuando se acaban las pistas
function juegoTerminado() {
    clearInterval(timer);
    cronometroSpan.textContent = "0";
    botonEnviar.disabled = true;
    inputRespuesta.disabled = true;

    mensajeDesafio.innerHTML = `
        🎉 <span style="color:#e84393; font-size:24px;">¡Juego Terminado!</span> 🎉
    `;
    mensajeDesafio.style.fontWeight = "bold";
    mensajeDesafio.style.fontSize = "24px";
    mensajeDesafio.style.textAlign = "center";
    mensajeDesafio.style.animation = "juegoTerminado 1s ease infinite alternate";

    // Animación CSS simple
    const style = document.createElement('style');
    style.innerHTML = `
    @keyframes juegoTerminado {
        0% { transform: scale(1); color: #e84393; }
        50% { transform: scale(1.2); color: #fdcb6e; }
        100% { transform: scale(1); color: #e84393; }
    }`;
    document.head.appendChild(style);
}

// Usuarios en localStorage
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [{ totalPartidas:0, totalAciertos:0, totalFallos:0, totalDesafios:0 }];
let u = usuarios[0];

// Comprobar respuesta
function comprobarDesafio() {
    clearInterval(timer);
    const respuesta = inputRespuesta.value.trim();
    if(!respuesta) return;

    if(normalizar(respuesta) === normalizar(desafioHoy.nombre)){
        mensajeDesafio.textContent = "¡Correcto! 🎉";
        mensajeDesafio.style.color = "green";
        u.totalDesafios = (u.totalDesafios || 0) + 1;
        sumarMonedas(10);
    } else {
        mensajeDesafio.textContent = `Incorrecto ❌ Era ${desafioHoy.nombre}`;
        mensajeDesafio.style.color = "red";
    }

    mensajeDesafio.style.fontWeight = "bold";
    mensajeDesafio.style.fontSize = "20px";
    mensajeDesafio.style.transition = "all 0.5s";
    mensajeDesafio.style.animation = "pulse 0.6s";

    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    // Pasar al siguiente desafío
    setTimeout(nuevoDesafio, 1500);
}

// -------------------- EVENTOS --------------------
botonEnviar.addEventListener("click", comprobarDesafio);
inputRespuesta.addEventListener("keydown", (e) => {
    if(e.key === "Enter") comprobarDesafio();
});

// -------------------- INICIALIZACIÓN --------------------
actualizarMonedasDisplay(false);
nuevoDesafio();
