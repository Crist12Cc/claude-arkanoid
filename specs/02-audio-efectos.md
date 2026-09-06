# 02 — Audio de efectos (rebote y rotura de bloques)

**Estado:** Implementado
**Depende de:** SPEC 01
**Fecha:** 2026-09-06
**Objetivo:** Añadir sonido de rebote y de rotura de bloques al juego, con un control simple de mute persistido entre sesiones.

## Alcance

**Incluido:**

- Reproducir `assets/sounds/ball-bounce.mp3` en todo rebote de la bola (paredes, paleta y bloques).
- Reproducir `assets/sounds/break-sound.mp3` cuando un bloque es destruido (al llegar `hitsRemaining` a 0).
- Ambos sonidos pueden solaparse: cada evento dispara su propia reproducción independiente (soporta multibola sin cortar sonidos previos).
- Botón/tecla de mute que silencia todo el audio del juego (rebote y rotura). Estado (`muted: true/false`) persistido en `localStorage`.
- Indicador visual simple del estado de mute en el HUD (ej. ícono de altavoz que cambia según el estado).

**Fuera de alcance (no incluido en este spec):**

- Sonidos para transiciones de `GAME_OVER` o `VICTORY`.
- Música de fondo.
- Control de volumen granular (slider); solo mute on/off.
- Sonidos distintos para power-ups (recolección, aparición).
- Precarga avanzada o gestión de errores de red para los archivos de audio más allá de un fallo silencioso.

## Modelo de datos

- **`audio.muted`**: boolean, estado de mute. Persistido en `localStorage` bajo la clave `arkanoid_muted`. Si la clave no existe o no es `"true"`/`"false"` válido, se asume `false`.
- **`audio.bounceSound`** y **`audio.breakSound`**: referencias a los elementos `Audio` (o buffers) cargados desde los archivos existentes en `assets/sounds/`. Viven en el mismo `game.js`, no requieren estructura adicional.

No se introduce persistencia de esquema versionado: `arkanoid_muted` es un valor plano booleano, igual de simple que `arkanoid_best_score` del spec 01.

## Plan de implementación

1. En `game.js`, cargar `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3` como objetos `Audio` reutilizables al iniciar el juego (junto a `loadSpritesheet()`).
2. Implementar una función de reproducción que clone/reinicie la instancia de audio en cada llamada (para permitir solapamiento) y respete `audio.muted` (no reproducir si está en `true`).
3. Leer `arkanoid_muted` de `localStorage` al iniciar el juego para inicializar `audio.muted`.
4. Conectar la reproducción de `ball-bounce.mp3` en los tres puntos de colisión ya existentes: rebote en paredes, rebote en paleta, rebote en bloque (antes o al mismo tiempo que se decrementa `hitsRemaining`).
5. Conectar la reproducción de `break-sound.mp3` en el punto donde un bloque pasa a `destroyed` (hitsRemaining llega a 0).
6. Añadir botón/ícono de mute en el HUD (`index.html`/CSS) y su manejador: alterna `audio.muted`, actualiza el ícono, y escribe el nuevo valor en `arkanoid_muted` en `localStorage`.
7. Envolver la carga/reproducción de audio en try/catch para que un fallo (audio bloqueado por el navegador, archivo no disponible) no rompa el resto del juego.

## Criterios de aceptación

- [ ] Al rebotar la bola contra una pared, la paleta o un bloque, se escucha `ball-bounce.mp3`.
- [ ] Al destruir un bloque, se escucha `break-sound.mp3` además del sonido de rebote correspondiente al impacto.
- [ ] Con multibola activo, los sonidos de rebote/rotura de distintas bolas pueden sonar solapados sin cortarse entre sí.
- [ ] El botón/tecla de mute silencia inmediatamente ambos sonidos.
- [ ] El estado de mute persiste al recargar la página (`localStorage`).
- [ ] Si `localStorage` no está disponible o los archivos de audio fallan al cargar, el juego sigue siendo jugable sin errores no capturados en consola.

## Decisiones tomadas y descartadas

- **Solo rebote y rotura de bloques** en vez de cubrir también game over/victoria: se acota el spec a los dos sonidos que ya existen como assets, dejando el resto para un spec de pulido posterior.
- **Mismo sonido de rebote para paredes, paleta y bloques**: se prioriza simplicidad sobre variedad sonora.
- **Solapamiento permitido de sonidos** en vez de limitar a una instancia: necesario para que multibola no pierda feedback auditivo cuando varias bolas colisionan casi al mismo tiempo.
- **Mute simple (on/off) en vez de control de volumen**: menor esfuerzo de UI y suficiente para la necesidad actual del usuario.
- **Persistencia mínima de mute** en `localStorage` sin versionado, igual que `bestScore` del spec 01, por consistencia.

## Riesgos identificados

- **Autoplay policies del navegador**: algunos navegadores bloquean la reproducción de audio hasta que hay una interacción del usuario; el primer sonido podría no sonar si se dispara antes de cualquier click/tecla. Debe manejarse con try/catch silencioso.
- **Saturación de audio con multibola**: permitir solapamiento ilimitado de instancias de audio podría degradar el rendimiento si hay muchas bolas simultáneas; a vigilar durante la implementación.
