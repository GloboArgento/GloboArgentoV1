// -------------------- SUPABASE --------------------
// Se inicializa primero para que esté disponible en todo el archivo
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

// -------------------- Lista de banderas --------------------
const banderas = [
    { pais: "Argentina", img: "https://flagcdn.com/w160/ar.png", pista: "Fútbol, tango y mate." },
    { pais: "Brasil", img: "https://flagcdn.com/w160/br.png", pista: "Carnaval famoso mundialmente." },
    { pais: "México", img: "https://flagcdn.com/w160/mx.png", pista: "Tacos y tequila originarios." },
    { pais: "Canadá", img: "https://flagcdn.com/w160/ca.png", pista: "Hockey y hojas de arce." },
    { pais: "Estados Unidos", img: "https://flagcdn.com/w160/us.png", pista: "La estatua de la libertad." },
    { pais: "Japón", img: "https://flagcdn.com/w160/jp.png", pista: "Sol naciente y sushi." },
    { pais: "Reino Unido", img: "https://flagcdn.com/w160/gb.png", pista: "Big Ben y té típico." },
    { pais: "Francia", img: "https://flagcdn.com/w160/fr.png", pista: "Torre Eiffel y croissants." },
    { pais: "Alemania", img: "https://flagcdn.com/w160/de.png", pista: "Oktoberfest y autos famosos." },
    { pais: "Italia", img: "https://flagcdn.com/w160/it.png", pista: "Pizza y pasta." },
    { pais: "España", img: "https://flagcdn.com/w160/es.png", pista: "Paella y flamenco." },
    { pais: "China", img: "https://flagcdn.com/w160/cn.png", pista: "Gran Muralla." },
    { pais: "India", img: "https://flagcdn.com/w160/in.png", pista: "Taj Mahal y especias." },
    { pais: "Sudáfrica", img: "https://flagcdn.com/w160/za.png", pista: "Tres capitales y safari." },
    { pais: "Australia", img: "https://flagcdn.com/w160/au.png", pista: "Canguros y koalas." },
    { pais: "Colombia", img: "https://flagcdn.com/w160/co.png", pista: "Café y cumbia." },
    { pais: "Perú", img: "https://flagcdn.com/w160/pe.png", pista: "Machu Picchu y ceviche." },
    { pais: "Venezuela", img: "https://flagcdn.com/w160/ve.png", pista: "Arepas y Salto Ángel." },
    { pais: "Chile", img: "https://flagcdn.com/w160/cl.png", pista: "Vinos y la cordillera." },
    { pais: "Uruguay", img: "https://flagcdn.com/w160/uy.png", pista: "Mate, fútbol y tranquilidad." }
];

// -------------------- Funciones auxiliares --------------------
function mezclarArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// -------------------- Variables del juego --------------------
let banderasMezcladas = mezclarArray([...banderas]);
let currentIndex = 0;
let aciertos = 0;
let intentos = 0;

const vidasBaseInicial = 3;
let vidasBase = vidasBaseInicial;
let vidasExtra = parseInt(localStorage.getItem('vidasExtra')) || 0;
let vidas = vidasBase + vidasExtra;

let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [{ totalPartidas:0,totalAciertos:0,totalFallos:0,totalDesafios:0 }];
let u = usuarios[0];

const estadisticasDiv = document.getElementById("estadisticas");
const boton5050      = document.getElementById("boton5050");
const botonPista     = document.getElementById("botonPista");
const pistaDiv       = document.getElementById("pista");
const opcionesDiv    = document.getElementById("opciones");
const volverMenuBtn  = document.getElementById("volverMenu");
const vidasDiv       = document.getElementById("vidas");

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

// -------------------- GUARDAR PUNTAJE EN SUPABASE --------------------
async function guardarPuntajeEnRanking(puntaje) {
    // Obtener nombre de usuario (Google o local)
    const { data: { session } } = await supabaseClient.auth.getSession();

    let nombreUsuario;
    if (session?.user) {
        // Usuario logueado con Google
        nombreUsuario = session.user.user_metadata?.full_name
                     || session.user.user_metadata?.name
                     || session.user.email?.split("@")[0]
                     || "Anónimo";
    } else {
        // Usuario local (sin cuenta)
        nombreUsuario = localStorage.getItem("usuario") || "Anónimo";
    }

    // Solo guardar si el puntaje es mayor a 0 (no tiene sentido guardar partidas vacías)
    if (puntaje <= 0) return;

    const { error } = await supabaseClient
        .from("ranking")           // nombre de tu tabla en Supabase
        .insert({
            usuario: nombreUsuario,
            puntos: puntaje
            // created_at lo genera Supabase automáticamente
        });

    if (error) {
        console.error("Error guardando puntaje:", error.message);
        // No mostramos error al usuario, el juego sigue funcionando igual
    } else {
        console.log(`✅ Puntaje guardado: ${nombreUsuario} → ${puntaje} puntos`);
    }
}

// -------------------- Actualizar vidas --------------------
function actualizarVidas() {
    vidasDiv.innerHTML = "";

    for (let i = 0; i < vidasBase; i++) {
        const heart = document.createElement("span");
        heart.className = "corazon";
        heart.textContent = "❤️";
        vidasDiv.appendChild(heart);
    }
    for (let i = 0; i < (vidasBaseInicial - vidasBase); i++) {
        const heartPerdida = document.createElement("span");
        heartPerdida.className = "corazon perdido";
        heartPerdida.textContent = "🖤";
        vidasDiv.appendChild(heartPerdida);
    }
    for (let i = 0; i < vidasExtra; i++) {
        const heartExtra = document.createElement("span");
        heartExtra.className = "corazonExtra";
        heartExtra.textContent = "💛";
        vidasDiv.appendChild(heartExtra);
    }
}

// -------------------- Mostrar pregunta --------------------
function mostrarPregunta() {
    const pregunta = banderasMezcladas[currentIndex];
    document.getElementById("bandera").src = pregunta.img;

    opcionesDiv.innerHTML = "";

    let opciones = [pregunta];
    let otras = banderas.filter(b => b.pais !== pregunta.pais);
    opciones = opciones.concat(mezclarArray(otras).slice(0, 4));
    opciones = mezclarArray(opciones);

    opciones.forEach(item => {
        const btn = document.createElement("button");
        btn.textContent = item.pais;

        btn.onclick = () => {
            intentos++;
            const botones = opcionesDiv.querySelectorAll("button");
            botones.forEach(b => b.disabled = true);

            if (item.pais === pregunta.pais) {
                btn.style.background = "linear-gradient(135deg, #A6E6A6, #78D78F)";
                btn.style.color = "#fff";
                btn.style.transform = "scale(1.2)";
                btn.style.boxShadow = "0 0 15px #78D78F";
                setTimeout(() => {
                    btn.style.transform = "scale(1)";
                    btn.style.boxShadow = "none";
                }, 600);
                aciertos++;
                sumarMonedas(5);
            } else {
                btn.style.background = "linear-gradient(135deg, #F2A6A6, #E85C5C)";
                btn.style.color = "#fff";
                btn.style.animation = "shake 0.5s";

                const correctBtn = [...botones].find(b => b.textContent === pregunta.pais);
                correctBtn.style.background = "linear-gradient(135deg, #A6E6A6, #78D78F)";
                correctBtn.style.color = "#fff";
                correctBtn.style.transform = "scale(1.2)";
                correctBtn.style.boxShadow = "0 0 15px #78D78F";
                setTimeout(() => {
                    correctBtn.style.transform = "scale(1)";
                    correctBtn.style.boxShadow = "none";
                }, 600);

                if (vidasExtra > 0) {
                    vidasExtra--;
                    localStorage.setItem('vidasExtra', vidasExtra);
                } else if (vidasBase > 0) {
                    vidasBase--;
                }
                vidas--;
            }

            actualizarVidas();

            setTimeout(() => {
                currentIndex++;
                pistaDiv.style.display = "none";

                if (vidas <= 0) {
                    mostrarEstadisticas();
                    return;
                }

                if (currentIndex < banderasMezcladas.length) {
                    mostrarPregunta();
                } else {
                    mostrarEstadisticas();
                }
                document.getElementById("contador").textContent = aciertos;
            }, 1100);
        };

        opcionesDiv.appendChild(btn);
    });

    boton5050.disabled = false;
    botonPista.disabled = false;
}

// -------------------- Botones de ayuda --------------------
boton5050.onclick = () => {
    if (!gastarMonedas(15)) return;
    const botones = [...opcionesDiv.querySelectorAll("button")];
    const correctBtn = botones.find(b => b.textContent === banderasMezcladas[currentIndex].pais);
    const incorrectBtns = botones.filter(b => b.textContent !== banderasMezcladas[currentIndex].pais);
    const elegidos = mezclarArray(incorrectBtns).slice(0, 2);

    botones.forEach(b => {
        if (!elegidos.includes(b) && b !== correctBtn) {
            b.style.opacity = 0.3;
            b.disabled = true;
        } else {
            b.style.opacity = 1;
        }
    });
    boton5050.disabled = true;
};

botonPista.onclick = () => {
    if (!gastarMonedas(15)) return;
    const pregunta = banderasMezcladas[currentIndex];
    pistaDiv.textContent = pregunta.pista;
    pistaDiv.style.display = "block";
    botonPista.disabled = true;
};

// -------------------- Estadísticas --------------------
// ⚠️ IMPORTANTE: esta función es async porque necesita esperar el guardado en Supabase
async function mostrarEstadisticas() {
    const fallos = intentos - aciertos;
    const puntajeFinal = aciertos; // el puntaje son los aciertos

    u.totalPartidas++;
    u.totalAciertos += aciertos;
    u.totalFallos += fallos;
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    document.getElementById("aciertos").textContent = aciertos;
    document.getElementById("fallos").textContent = fallos;
    document.getElementById("puntajeFinal").textContent = puntajeFinal;

    estadisticasDiv.style.display = "flex";
    estadisticasDiv.style.flexDirection = "column";
    estadisticasDiv.style.alignItems = "center";
    estadisticasDiv.style.justifyContent = "center";

    // Guardar en Supabase (no bloqueante: si falla, el juego sigue andando)
    guardarPuntajeEnRanking(puntajeFinal);

    // Reiniciar para la próxima partida
    currentIndex = 0;
    aciertos = 0;
    intentos = 0;
    vidasBase = vidasBaseInicial;
    vidasExtra = parseInt(localStorage.getItem('vidasExtra')) || 0;
    vidas = vidasBase + vidasExtra;
    actualizarVidas();
    banderasMezcladas = mezclarArray([...banderas]);
}

// -------------------- Volver al menú --------------------
volverMenuBtn.addEventListener("click", () => {
    window.location.href = "index.html";
});

// -------------------- Inicializa el juego --------------------
actualizarVidas();
actualizarMonedasDisplay(false);
mostrarPregunta();
