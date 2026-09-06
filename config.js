// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIGURACIÓN DEL JUEGO — edita esto con calma              ║
// ║  (la carta va en carta.js)                                   ║
// ╚══════════════════════════════════════════════════════════════╝

export const CONFIG = {
  // Nombre (o apodo) que aparece en la portada y en el final.
  nombre: 'Azumi',

  // Fecha que aparece chiquita en la portada.
  fecha: '06 · 09',

  // Años que cumple = estrellas que hay que recoger.
  totalEstrellas: 20,

  // Una frase por estrella, en el orden en que las va recogiendo (1ª, 2ª, 3ª…).
  // Cortas, que quepan en una línea de celular. Deja '' si no quieres frase en alguna.
  frases: [
    'año 1 · llegaste al mundo ✦',
    'año 2 · primeros pasos',
    'año 3 · ya tenías esa risa',
    'año 4 · curiosa desde siempre',
    'año 5 · mirando al cielo',
    'año 6 · soñando en grande',
    'año 7 · brillabas sin saberlo',
    'año 8 · coleccionando estrellas',
    'año 9 · creciendo con luz propia',
    'año 10 · dos dígitos ya',
    'año 11 · hasta el infinito',
    'año 12 · y más allá',
    'año 13 · valiente',
    'año 14 · con los pies en la Tierra',
    'año 15 · y la cabeza en la Luna',
    'año 16 · ahí estábamos',
    'año 17 · nuestras aventuras',
    'año 18 · despegue oficial 🚀',
    'año 19 · órbita estable',
    'año 20 · ✦ hoy ✦',
  ],

  // Fotos para las polaroids del final.
  //  'auto'  → busca public/fotos/1.jpg, 2.jpg, 3.jpg… (hasta 8)
  //  []      → sin fotos
  //  ['fotos/1.jpg', 'fotos/mi-foto.png']  → lista manual
  fotos: 'auto',

  // Colores del neón (puedes cambiarlos, son colores CSS normales).
  paleta: {
    fondo: '#05030f',
    estrellas: ['#fde68a', '#d8b4fe', '#7dd3fc', '#c4b5fd', '#86efac', '#fdba74', '#ffffff'],
    nebulosas: ['#6d28d9', '#0284c7', '#9333ea'],
  },

  // Ajustes finos (normalmente no hace falta tocarlos)
  pixelDetail: 300,   // más alto = píxeles más pequeños (más detalle); más bajo = más chunky
  vibracion: true,    // vibración cortita al recoger cada estrella (solo Android)
  bloom: true,        // resplandor extra en el final
  modoLibre: true,    // permitir seguir volando después de la carta
};
