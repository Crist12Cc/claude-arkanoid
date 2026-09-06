const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const BEST_SCORE_KEY = 'arkanoid_best_score';

const canvas = document.getElementById( 'game-canvas' );
const ctx = canvas.getContext( '2d' );

const hudScoreEl = document.getElementById( 'hud-score' );
const hudLivesEl = document.getElementById( 'hud-lives' );
const hudBestEl = document.getElementById( 'hud-best' );

let gameState = 'START';
let score = 0;
let lives = 3;
let bestScore = 0;

function loadBestScore() {
  try {
    const raw = localStorage.getItem( BEST_SCORE_KEY );
    const parsed = Number( raw );
    return Number.isFinite( parsed ) ? parsed : 0;
  } catch ( e ) {
    return 0;
  }
}

function saveBestScore( value ) {
  try {
    localStorage.setItem( BEST_SCORE_KEY, String( value ) );
  } catch ( e ) {
    // localStorage no disponible; se ignora silenciosamente.
  }
}

function updateHud() {
  hudScoreEl.textContent = `Score: ${score}`;
  hudLivesEl.textContent = `Vidas: ${lives}`;
  hudBestEl.textContent = `Best: ${bestScore}`;
}

function drawStartScreen() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );

  ctx.fillStyle = '#eee';
  ctx.textAlign = 'center';

  ctx.font = 'bold 32px monospace';
  ctx.fillText( 'ARKANOID', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60 );

  ctx.font = '16px monospace';
  ctx.fillText( `Best score: ${bestScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20 );
  ctx.fillText( 'Presiona una tecla o haz click para empezar', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20 );
}

function drawPlayingPlaceholder() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );
}

function drawPausedOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );
  ctx.fillStyle = '#eee';
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px monospace';
  ctx.fillText( 'PAUSA', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 );
}

function drawGameOverScreen() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );
  ctx.fillStyle = '#eee';
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px monospace';
  ctx.fillText( 'GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20 );
  ctx.font = '16px monospace';
  ctx.fillText( `Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20 );
}

function drawVictoryScreen() {
  ctx.fillStyle = '#000';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );
  ctx.fillStyle = '#eee';
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px monospace';
  ctx.fillText( 'VICTORIA', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20 );
  ctx.font = '16px monospace';
  ctx.fillText( `Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20 );
}

function update( dt ) {
  if ( gameState === 'PLAYING' ) {
    // La lógica de paleta/bola/bloques se agrega en pasos siguientes.
  }
}

function render() {
  switch ( gameState ) {
    case 'START':
      drawStartScreen();
      break;
    case 'PLAYING':
      drawPlayingPlaceholder();
      break;
    case 'PAUSED':
      drawPlayingPlaceholder();
      drawPausedOverlay();
      break;
    case 'GAME_OVER':
      drawGameOverScreen();
      break;
    case 'VICTORY':
      drawVictoryScreen();
      break;
  }
  updateHud();
}

let lastTimestamp = 0;

function loop( timestamp ) {
  const dt = lastTimestamp ? timestamp - lastTimestamp : 0;
  lastTimestamp = timestamp;

  update( dt );
  render();

  requestAnimationFrame( loop );
}

function init() {
  bestScore = loadBestScore();
  score = 0;
  lives = 3;
  gameState = 'START';
  requestAnimationFrame( loop );
}

loadSpritesheet( init );
