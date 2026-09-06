# 01 — MVP jugable de Arkanoid

**Estado:** Draft
**Depende de:** Ninguno
**Fecha:** 2026-09-06
**Objetivo:** Construir un MVP jugable de Arkanoid en HTML/CSS/JS puro (sin dependencias) con un nivel fijo, vidas, power-ups básicos y controles de teclado y mouse.

## Alcance

**Incluido:**
- `index.html` como punto de entrada, con un `<canvas>` fijo de 480x640 (vertical).
- Bucle de juego (game loop) con `requestAnimationFrame`.
- Paleta controlable con teclado (flechas / A-D) y mouse (posición X).
- Bola con física simple: rebote en paredes, paleta y bloques; ángulo de rebote en la paleta depende del punto de impacto.
- Un único nivel de bloques, distribuido en grilla fija de 7 filas x 10 columnas:
  - Filas 1-2: bloques de 3 golpes (colores `red`, `hotpink`).
  - Filas 3-4: bloques de 2 golpes (colores `yellow`, `magenta`).
  - Filas 5-7: bloques de 1 golpe (colores `gray`, `cyan`, `green`).
- Sistema de vidas: 3 vidas iniciales. Al perder la bola (cae por debajo de la paleta), se pierde una vida y la bola vuelve a posicionarse pegada a la paleta esperando input para lanzarse.
- Power-ups básicos: **multibola** y **paleta grande**, con probabilidad fija (20%) de caer al destruir un bloque. Se recogen tocándolos con la paleta; si llegan al suelo sin ser recogidos, se pierden. Efecto temporal (duración fija, ej. 10s) antes de revertir al estado normal.
- Puntaje simple por bloque destruido (puntos según color/resistencia), visible en HUD junto a las vidas restantes.
- Best score persistido en `localStorage`, mostrado en la pantalla de inicio.
- Estados de UI: `START`, `PLAYING`, `PAUSED`, `GAME_OVER`, `VICTORY`.
  - `START`: pantalla inicial con best score y mensaje para comenzar.
  - `PLAYING` ↔ `PAUSED`: pausa/reanuda con tecla (ej. `P` o `Esc`).
  - `GAME_OVER`: al perder la última vida.
  - `VICTORY`: al destruir todos los bloques del nivel.
- Reutilización de `assets/spritesheet.js` para todo el renderizado (paddle, ball, block_<color>, animación de explosión al destruir bloques).

**Fuera de alcance (no incluido en este MVP):**
- Múltiples niveles o progresión entre niveles.
- Sonido (`ball-bounce.mp3`, `break-sound.mp3` no se wirean en este spec — spec futuro de audio).
- Power-up de bola lenta u otros efectos adicionales a multibola/paleta grande.
- Responsive/redimensionamiento del canvas.
- Tabla de puntajes online, multijugador, o cualquier persistencia más allá del best score local.
- Configuración de dificultad o niveles de velocidad seleccionables por el usuario.

## Modelo de datos

No hay persistencia de estructuras complejas ni backend. Estructuras en memoria (JS), todas viven en el mismo archivo de lógica del juego:

- **`gameState`**: string, uno de `START | PLAYING | PAUSED | GAME_OVER | VICTORY`.
- **`paddle`**: `{ x, y, width, height, speed }`. `width` cambia temporalmente con el power-up de paleta grande.
- **`balls`**: array de `{ x, y, dx, dy, radius, attached }`. Normalmente 1 elemento; el power-up de multibola añade instancias adicionales. `attached: true` mientras la bola espera lanzamiento sobre la paleta.
- **`blocks`**: array de `{ x, y, width, height, color, hitsRemaining, destroyed }`, generado una vez al iniciar el nivel según la grilla 7x10 descrita en Alcance.
- **`powerUps`**: array de power-ups cayendo en pantalla: `{ x, y, type, active }`, `type` es `'multiball' | 'bigpaddle'`.
- **`activeEffects`**: `{ bigPaddleUntil: timestamp | null }` — controla cuándo revertir el efecto temporal de paleta grande.
- **`score`**: number, puntaje de la partida actual.
- **`lives`**: number, inicia en 3.
- **`bestScore`**: number, leído/escrito en `localStorage` bajo la clave `arkanoid_best_score`.

Persistencia: únicamente `bestScore` en `localStorage`, como valor numérico plano bajo la clave `arkanoid_best_score`. Sin versionado — si la clave no existe o no es un número válido, se asume 0.

## Plan de implementación

1. Crear `index.html` con el `<canvas>` 480x640, referencias a `assets/spritesheet.js` y al nuevo `game.js`, y estructura mínima de HUD (score, vidas, best score) en HTML/CSS sobre o junto al canvas.
2. Crear `game.js`: llamar `loadSpritesheet()` y, en su callback, inicializar `gameState = 'START'` y dibujar la pantalla de inicio (best score leído de `localStorage`).
3. Implementar el bucle principal con `requestAnimationFrame`, que despacha el render/update según `gameState`.
4. Implementar la paleta: input de teclado (flechas/A-D) y mouse, con límites de los bordes del canvas.
5. Implementar la bola: movimiento, rebote en paredes (izquierda/derecha/arriba), rebote en la paleta (ángulo según punto de impacto), y detección de caída por debajo de la paleta (pérdida de vida).
6. Generar la grilla de bloques según el mapeo de colores/resistencia definido en Alcance, y su renderizado con `drawSprite(ctx, 'block_<color>', ...)`.
7. Implementar colisión bola-bloque: decremento de `hitsRemaining`, animación de explosión (`drawFrame`/`EXPLOSION_FRAMES`) y eliminación del bloque al llegar a 0, sumando puntaje.
8. Implementar el spawn de power-ups (probabilidad 20% al destruir un bloque), su caída, recolección por la paleta, y efectos: multibola (clona la bola activa con ángulos distintos) y paleta grande (aumenta `paddle.width` temporalmente vía `activeEffects.bigPaddleUntil`).
9. Implementar el flujo de vidas: al perder la última bola, decrementar `lives`; si `lives === 0` pasar a `GAME_OVER`, si no, reposicionar una bola `attached` sobre la paleta esperando input de lanzamiento.
10. Implementar la transición a `VICTORY` cuando todos los bloques estén destruidos.
11. Implementar pausa (`PLAYING` ↔ `PAUSED`) con tecla dedicada, congelando el bucle de update sin detener el render del overlay de pausa.
12. Implementar HUD dinámico (score, vidas) y pantallas de `GAME_OVER`/`VICTORY` con opción de reiniciar (`START` de nuevo), actualizando `bestScore` en `localStorage` si `score > bestScore`.

## Criterios de aceptación

- [ ] Abrir `index.html` en el navegador muestra la pantalla `START` con el best score (0 si no hay ninguno guardado).
- [ ] Presionar la tecla/click de inicio pasa a `PLAYING` y muestra la grilla de bloques, la paleta y la bola pegada a la paleta.
- [ ] La paleta se mueve con flechas/A-D y con el mouse, sin salir de los límites del canvas.
- [ ] Al lanzar la bola, esta rebota correctamente en paredes, paleta y bloques.
- [ ] Cada bloque golpeado decrementa su resistencia visualmente (o desaparece si era de 1 golpe) y suma puntaje al HUD.
- [ ] Al destruir un bloque hay al menos un 20% de probabilidad observable (en pruebas repetidas) de que caiga un power-up de tipo multibola o paleta grande.
- [ ] Recoger el power-up de paleta grande aumenta el ancho de la paleta temporalmente y luego revierte.
- [ ] Recoger el power-up de multibola añade una bola adicional en juego.
- [ ] Si todas las bolas caen por debajo de la paleta, se pierde una vida y el HUD lo refleja.
- [ ] Al llegar a 0 vidas, el juego pasa a `GAME_OVER` y muestra el puntaje final.
- [ ] Al destruir todos los bloques, el juego pasa a `VICTORY`.
- [ ] Presionar la tecla de pausa detiene el movimiento de bola/paleta/power-ups y lo reanuda al presionarla de nuevo.
- [ ] Si el `score` final supera el `bestScore` guardado, se actualiza en `localStorage` y se refleja en la siguiente pantalla `START`.
- [ ] No hay errores en la consola del navegador durante una partida completa (inicio → victoria o game over).

## Decisiones tomadas y descartadas

- **Un solo nivel fijo** en vez de múltiples niveles: se descarta progresión de niveles para mantener el MVP acotado; queda como posible spec futuro.
- **Resistencia de bloques por color** (1/2/3 golpes según grupo de color) en vez de un solo golpe para todos: se eligió mayor fidelidad al Arkanoid clásico sobre la simplicidad máxima.
- **Sonido explícitamente fuera de alcance**: los archivos de audio existen pero no se conectan en este MVP; se deja para un spec de pulido/audio posterior.
- **Solo 2 power-ups (multibola, paleta grande)** en vez de un set más amplio (ej. bola lenta): se acotó para no expandir demasiado la lógica de estados/efectos en el primer MVP.
- **Persistencia mínima**: solo `bestScore` en `localStorage`, sin versionado de esquema ni otros datos, dado que es el único dato que sobrevive entre sesiones.
- **Canvas de tamaño fijo (480x640)** en vez de responsive: se prioriza velocidad de implementación sobre adaptabilidad, coherente con el enfoque "MVP jugable".
- **Controles de teclado y mouse simultáneos**: mayor esfuerzo que solo uno, pero el usuario lo pidió explícitamente para mejor experiencia de juego.

## Riesgos identificados

- **Colisión bola-bloque con múltiples bolas (multibola) simultáneas**: la lógica de colisión debe iterar sobre el array `balls` sin duplicar impactos en un mismo frame sobre el mismo bloque; si no se maneja bien, un bloque podría perder más de un `hitsRemaining` por frame de forma inconsistente.
- **`localStorage` no disponible o bloqueado** (modo incógnito estricto, políticas del navegador): la lectura/escritura de `bestScore` debe fallar de forma silenciosa (try/catch) sin romper el resto del juego.
- **Ángulo de rebote en la paleta mal calibrado**: si el ángulo calculado según el punto de impacto es demasiado extremo o demasiado plano, la bola puede quedar en bucles horizontales o verticales poco jugables; requiere ajuste manual durante la implementación.
