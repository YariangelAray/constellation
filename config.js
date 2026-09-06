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
    'una galaxia para mi estrella',
    'para la de los labios de mamadora luxury',
    'la leche de mi café',
    'a la que le brillan los ojitos bn bonitos',
    'el kook de mi yoon',
    'para mi "la edad es un número"',
    'la que llora por una mosca',
    'la que entiende la vibra',
    'mi farmeadora de aura',
    'la bebita de mi fiu fiu',
    'mi lucerito de media noche',
    'la que me saca el lado lesbico',
    'la que quisiera ser hombre para ser gay',
    'mi bombon de coco con extra coco',
    'la que en otra vida es mi esposa',
    'te amo',
    'nunca dejes de ser tu',
    'cree más en tí',
    'y en todo lo que puedes lograr',
    '20 años ✦ sin un 1 en la edad ✦',
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

  // ── Modo libre con reto (el "gusanito", después de la carta) ──
  arcade: {
    activo: true,          // false = modo libre relajado de siempre, sin cometas
    graciaSegundos: 10,    // segundos tranquilos al empezar, antes del primer cometa
    cometasMax: 5,         // cuántos cometas a la vez en lo más difícil
    estrellaDorada: true,  // aparece de vez en cuando una estrella dorada
    valorDorada: 5,        // cuánto suma (y cuántos segmentos de cola da)
  },

  // Ajustes finos (normalmente no hace falta tocarlos)
  pixelDetail: 300,   // más alto = píxeles más pequeños (más detalle); más bajo = más chunky
  vibracion: true,    // vibración cortita al recoger cada estrella (solo Android)
  bloom: true,        // resplandor extra en el final
  modoLibre: true,    // permitir seguir volando después de la carta
};
