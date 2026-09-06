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

function init() {
  bestScore = loadBestScore();
  score = 0;
  lives = 3;
  gameState = 'START';
  updateHud();
  drawStartScreen();
}

loadSpritesheet( init );
