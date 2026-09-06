# Constelación 20 ✦

Un mini-juego de cumpleaños: una astronauta recoge 20 estrellas (una por cada año), las
estrellas forman un "20" en el cielo y aparece una carta.

## Lo único que tienes que editar

| Archivo | Qué hay |
|---|---|
| **`carta.js`** | El texto de la carta y la firma. Párrafos con renglón en blanco, `**negrita**`, `*cursiva*`, `---` separador. |
| **`config.js`** | Nombre, fecha, las 20 frases (una por estrella), fotos y colores. |
| **`public/fotos/`** | Opcional: `1.jpg`, `2.jpg`, `3.jpg`… para las polaroids del final (máx. 8, ideal ≤900 px). |

Después de editar: `git add . && git commit -m "carta" && git push` → en ~1 minuto el link
ya muestra la versión nueva (GitHub Actions compila y publica solo).

## Probar en tu compu

```bash
npm install      # solo la primera vez
npm run dev      # abre http://localhost:5173
```

Con el celular en la misma wifi puedes abrir la dirección "Network" que imprime Vite.

Atajos para no recoger 20 estrellas cada vez que pruebas:

- `?stars=19` → empiezas con 19 recogidas
- `?scene=final` → directo a la animación del "20"
- `?scene=carta` → directo a la carta
- `?reset=1` → borra el progreso guardado en ese navegador
- `?nofx=1` → sin bloom · `?fps=1` → contador de fps

## Publicar en GitHub Pages (una sola vez)

1. Sube el repo a GitHub (`git push -u origin main`).
2. En el repo: **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
3. Espera a que termine la acción "Deploy a GitHub Pages" (pestaña Actions).
4. El juego queda en `https://<usuario>.github.io/<repo>/`.

## Controles

- **Celular:** arrastra el dedo por la pantalla, la astronauta vuela hacia él.
- **Compu:** flechas o WASD.
- Si pasan unos segundos sin recoger nada, una flechita señala la estrella más cercana.
- El progreso se guarda solo; si cierra la pestaña puede seguir donde iba.

## Stack

Vite · PixiJS 8 · pixi-filters · GSAP · Tone.js · canvas-confetti. Todo el arte está dibujado
por código (`src/art/sprites.js`) y la música es chiptune generado en vivo (`src/core/audio.js`).
