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

// Mezcla el array usando Fisher-Yates
function mezclarArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Mezclamos los países al iniciar
mezclarArray(paisesEmojis);

let currentIndex = 0;
let tiempo = 15;
let timer;

const emojiContainer = document.getElementById("emoji-container");
const inputPais = document.getElementById("inputPais");
const botonComprobar = document.getElementById("botonComprobar");
const mensajeEmoji = document.getElementById("mensajeEmoji");
const barraTiempo = document.getElementById("barraTiempo");

// -------------------- SISTEMA DE MONEDAS --------------------
let monedas = parseInt(localStorage.getItem('monedas')) || 0;

// Crear elemento en la esquina superior derecha
const monedaDiv = document.createElement("div");
monedaDiv.id = "monedaDiv";
monedaDiv.innerHTML = `🪙 <span id="cantidadMonedas">${monedas}</span>`;
document.body.appendChild(monedaDiv);

// Crear contenedor para mensajes personalizados
const mensajeMoneda = document.createElement("div");
mensajeMoneda.id = "mensajeMoneda";
document.body.appendChild(mensajeMoneda);

// Función para mostrar mensaje temporal
function mostrarMensaje(msg) {
    mensajeMoneda.textContent = msg;
    mensajeMoneda.style.opacity = "1";
    setTimeout(() => {
        mensajeMoneda.style.opacity = "0";
    }, 1800);
}

// Función para actualizar la pantalla de monedas
function actualizarMonedasDisplay(animar = true) {
    const cantidadSpan = document.getElementById("cantidadMonedas");
    cantidadSpan.textContent = monedas;
    if(animar){
        monedaDiv.classList.add("monedaAnim");
        setTimeout(() => monedaDiv.classList.remove("monedaAnim"), 500);
    }
}

// Función para sumar monedas
function sumarMonedas(cantidad) {
    monedas += cantidad;
    localStorage.setItem('monedas', monedas);
    actualizarMonedasDisplay(true);
}

// Función para gastar monedas
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
// Normalizar texto (sin tildes y minúsculas)
function normalizar(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function mostrarEmoji() {
    const item = paisesEmojis[currentIndex];
    emojiContainer.textContent = item.emojis.join(" "); // Solo emojis
    inputPais.value = "";
    mensajeEmoji.textContent = "";
    tiempo = 15;
    barraTiempo.style.width = "100%";
    barraTiempo.style.backgroundColor = "#4A90E2";

    clearInterval(timer);
    timer = setInterval(() => {
        tiempo--;
        barraTiempo.style.width = `${(tiempo / 15) * 100}%`;
        barraTiempo.style.backgroundColor = `hsl(${(tiempo / 15) * 120}, 70%, 50%)`; // verde a rojo
        if(tiempo <= 0) {
            clearInterval(timer);
            mensajeEmoji.textContent = `¡Se acabó el tiempo! Era ${item.pais}`;
            setTimeout(() => {
                currentIndex++;
                if(currentIndex >= paisesEmojis.length) currentIndex = 0;
                mostrarEmoji();
            }, 1500);
        }
    }, 1000);
}

function comprobarRespuesta() {
    const respuesta = normalizar(inputPais.value.trim());
    const correcto = normalizar(paisesEmojis[currentIndex].pais);

    clearInterval(timer);

    if(respuesta === correcto) {
        mensajeEmoji.textContent = "✅ Correcto!";
        sumarMonedas(8); // +8 monedas por adivinar emoji
    } else {
        mensajeEmoji.textContent = `❌ Incorrecto! Era ${paisesEmojis[currentIndex].pais}`;
    }

    setTimeout(() => {
        currentIndex++;
        if(currentIndex >= paisesEmojis.length) currentIndex = 0;
        mostrarEmoji();
    }, 1500);
}

botonComprobar.onclick = comprobarRespuesta;

inputPais.addEventListener("keydown", (e) => {
    if(e.key === "Enter") {
        comprobarRespuesta();
    }
});

// -------------------- Inicializa el juego --------------------
actualizarMonedasDisplay(false);
mostrarEmoji();
