# 03 — Múltiples niveles

**Estado:** Draft
**Depende de:** SPEC 01
**Fecha:** 2026-09-06
**Objetivo:** Añadir dos niveles adicionales (total 3) con distintas grillas de bloques, avanzando automáticamente entre ellos y mostrando `VICTORY` solo al completar el último.

## Alcance

**Incluido:**

- Dos niveles nuevos (nivel 2 y nivel 3), además del nivel 1 ya existente del spec 01. Total: 3 niveles.
- Cada nivel define su propia grilla 7x10 de bloques (colores/resistencia/patrón), hardcodeada en `game.js` como parte de un array `LEVELS`.
- Al destruir todos los bloques de un nivel que no es el último, se avanza automáticamente al siguiente nivel: se regenera la grilla de bloques del nuevo nivel, y `score`, `lives` y `bestScore` se mantienen sin reiniciar.
- `VICTORY` ocurre únicamente al destruir todos los bloques del último nivel (nivel 3).
- Indicador "Nivel X" visible en el HUD, junto a score y vidas.
- Cada partida nueva (desde `START`) siempre comienza en el nivel 1; no hay persistencia de progreso de nivel entre sesiones.

**Fuera de alcance (no incluido en este spec):**

- Persistir el nivel alcanzado en `localStorage` o permitir continuar desde un nivel intermedio.
- Pantalla intermedia de "nivel completado" (transición directa, sin nuevo estado de UI).
- Dificultad progresiva por velocidad de bola o tamaño de paleta (los niveles solo varían en el patrón/color de bloques, no en física).
- Selección de nivel por el usuario (menú de niveles).
- Más de 3 niveles totales.

## Modelo de datos

- **`LEVELS`**: array de definiciones de nivel, uno por índice (0 = nivel 1, 1 = nivel 2, 2 = nivel 3). Cada elemento describe la grilla 7x10 de bloques del nivel: una matriz de 7 filas x 10 columnas donde cada celda es `null` (sin bloque) o un color válido (`red`, `hotpink`, `yellow`, `magenta`, `gray`, `cyan`, `green`), con la resistencia derivada del color igual que en el spec 01 (3/2/1 golpes según grupo).
- **`currentLevel`**: number, índice (0-based) del nivel actual dentro de `LEVELS`. Se reinicia a `0` en cada `START`.
- **`blocks`**: (ya existente en spec 01) se regenera a partir de `LEVELS[currentLevel]` cada vez que se inicia un nivel, en vez de generarse una sola vez con la grilla fija del MVP.

No se agrega persistencia nueva: `currentLevel` vive solo en memoria durante la partida.

## Plan de implementación

1. Extraer la grilla fija del nivel 1 (definida en el spec 01) a la posición `0` de un nuevo array `LEVELS` en `game.js`, sin cambiar su distribución actual.
2. Diseñar y añadir las definiciones de los niveles 2 y 3 en `LEVELS[1]` y `LEVELS[2]`, cada una con un patrón de colores/huecos distinto a la grilla original.
3. Añadir estado `currentLevel` (inicializado en `0`) y refactorizar la generación de `blocks` para que lea de `LEVELS[currentLevel]` en vez de una grilla hardcodeada única.
4. Al iniciar una partida (`START` → `PLAYING`), asegurar que `currentLevel` se reinicia a `0` antes de generar `blocks`.
5. Modificar la condición de victoria: cuando `blocks` queda vacío/todo destruido, si `currentLevel < LEVELS.length - 1`, incrementar `currentLevel`, regenerar `blocks` con la nueva grilla y reposicionar bola(s)/power-ups activos (limpiar power-ups en pantalla); si es el último nivel, pasar a `VICTORY`.
6. Añadir "Nivel X" al HUD (HTML/CSS), mostrando `currentLevel + 1`, actualizado en cada transición de nivel.

## Criterios de aceptación

- [ ] Al iniciar una partida nueva, el juego comienza en el nivel 1 con la grilla original del spec 01, y el HUD muestra "Nivel 1".
- [ ] Al destruir todos los bloques del nivel 1, el juego avanza automáticamente al nivel 2 con una grilla de bloques distinta, sin pasar por `VICTORY` ni reiniciar score/vidas.
- [ ] El HUD actualiza a "Nivel 2" al hacer la transición.
- [ ] Al destruir todos los bloques del nivel 2, el juego avanza al nivel 3 de la misma forma.
- [ ] Al destruir todos los bloques del nivel 3 (último), el juego pasa a `VICTORY`.
- [ ] Los power-ups que estaban cayendo en pantalla al completar un nivel no persisten al nivel siguiente (se limpian en la transición).
- [ ] Iniciar una nueva partida tras `GAME_OVER` o `VICTORY` siempre vuelve a comenzar en el nivel 1.
- [ ] No hay errores en la consola del navegador durante una partida completa que recorra los 3 niveles hasta `VICTORY`.

## Decisiones tomadas y descartadas

- **3 niveles totales (1 existente + 2 nuevos)** en vez de un número mayor: se acota el esfuerzo de diseño de grillas y mantiene el spec enfocado, dejando abierta la posibilidad de más niveles en un spec futuro.
- **Grillas hardcodeadas en un array `LEVELS` dentro de `game.js`** en vez de archivos JSON separados: mantiene el enfoque "zero dependencias" y evita carga asíncrona adicional, consistente con cómo se maneja todo lo demás en el spec 01.
- **Transición automática entre niveles sin pantalla intermedia**: se prioriza fluidez de juego sobre un estado de UI adicional; el jugador nota el cambio por el HUD y la nueva grilla.
- **Solo el patrón de bloques varía entre niveles** (no velocidad de bola ni tamaño de paleta): se acota el alcance a la variación de contenido, dejando dificultad progresiva por física como posible spec futuro.
- **Sin persistencia de progreso de nivel**: cada partida nueva empieza en el nivel 1, consistente con que solo `bestScore` sobrevive entre sesiones (spec 01).

## Riesgos identificados

- **Regeneración de `blocks` al cambiar de nivel**: si no se limpian correctamente power-ups y estados de colisión pendientes del nivel anterior, podrían aparecer bloques o power-ups "fantasma" del nivel previo.
- **Diseño de grillas de niveles 2 y 3**: patrones mal balanceados (demasiado densos o con huecos que atrapan la bola) pueden hacer el nivel injugable o tedioso; requiere ajuste manual durante la implementación.
