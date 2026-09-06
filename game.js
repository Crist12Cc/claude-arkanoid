const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const BEST_SCORE_KEY = 'arkanoid_best_score';
const MUTED_KEY = 'arkanoid_muted';

function loadSound( path ) {
  try {
    return new Audio( path );
  } catch ( e ) {
    return null;
  }
}

const bounceSound = loadSound( 'assets/sounds/ball-bounce.mp3' );
const breakSound = loadSound( 'assets/sounds/break-sound.mp3' );

const audio = { muted: false };

function playSound( sound ) {
  if ( audio.muted || !sound ) return;
  try {
    const instance = sound.cloneNode();
    instance.play();
  } catch ( e ) {
    // Reproducción bloqueada o no disponible; se ignora silenciosamente.
  }
}

const canvas = document.getElementById( 'game-canvas' );
const ctx = canvas.getContext( '2d' );

const hudScoreEl = document.getElementById( 'hud-score' );
const hudLivesEl = document.getElementById( 'hud-lives' );
const hudBestEl = document.getElementById( 'hud-best' );
const hudMuteEl = document.getElementById( 'hud-mute' );

let gameState = 'START';
let score = 0;
let lives = 3;
let bestScore = 0;

const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 14;
const PADDLE_Y = CANVAS_HEIGHT - 30;
const PADDLE_SPEED = 6;

const paddle = {
  x: ( CANVAS_WIDTH - PADDLE_WIDTH ) / 2,
  y: PADDLE_Y,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  speed: PADDLE_SPEED,
};

const keysPressed = {
  left: false,
  right: false,
};

let mouseX = null;

function clampPaddleX( x ) {
  return Math.max( 0, Math.min( CANVAS_WIDTH - paddle.width, x ) );
}

const POWERUP_DROP_CHANCE = 0.2;
const POWERUP_SIZE = 20;
const POWERUP_SPEED = 2;
const POWERUP_EFFECT_DURATION = 10000; // 10s
const BIG_PADDLE_WIDTH = PADDLE_WIDTH * 1.6;

const POWERUP_STYLES = {
  multiball: { fill: '#3aa1ff', label: 'M' },
  bigpaddle: { fill: '#ffb03a', label: 'B' },
};

const powerUps = [];
const activeEffects = { bigPaddleUntil: null };

function spawnPowerUp( block ) {
  if ( Math.random() >= POWERUP_DROP_CHANCE ) return;
  const type = Math.random() < 0.5 ? 'multiball' : 'bigpaddle';
  powerUps.push( {
    x: block.x + block.width / 2 - POWERUP_SIZE / 2,
    y: block.y + block.height / 2 - POWERUP_SIZE / 2,
    type,
    active: true,
  } );
}

function applyPowerUp( type ) {
  if ( type === 'bigpaddle' ) {
    paddle.width = BIG_PADDLE_WIDTH;
    paddle.x = clampPaddleX( paddle.x );
    activeEffects.bigPaddleUntil = performance.now() + POWERUP_EFFECT_DURATION;
  } else if ( type === 'multiball' ) {
    const reference = balls.find( ( ball ) => !ball.attached ) || balls[ 0 ];
    const speed = Math.hypot( reference.dx, reference.dy ) || BALL_SPEED;
    [ -0.4, 0.4 ].forEach( ( angleOffset ) => {
      balls.push( {
        x: reference.x,
        y: reference.y,
        dx: speed * Math.sin( angleOffset ),
        dy: -Math.abs( speed * Math.cos( angleOffset ) ),
        radius: BALL_RADIUS,
        attached: false,
      } );
    } );
  }
}

function updatePowerUpEffects() {
  if ( activeEffects.bigPaddleUntil !== null && performance.now() >= activeEffects.bigPaddleUntil ) {
    paddle.width = PADDLE_WIDTH;
    paddle.x = clampPaddleX( paddle.x );
    activeEffects.bigPaddleUntil = null;
  }
}

function updatePowerUps() {
  for ( let i = powerUps.length - 1; i >= 0; i-- ) {
    const powerUp = powerUps[ i ];
    powerUp.y += POWERUP_SPEED;

    const withinPaddleX = powerUp.x + POWERUP_SIZE >= paddle.x && powerUp.x <= paddle.x + paddle.width;
    const withinPaddleY = powerUp.y + POWERUP_SIZE >= paddle.y && powerUp.y <= paddle.y + paddle.height;

    if ( withinPaddleX && withinPaddleY ) {
      applyPowerUp( powerUp.type );
      powerUps.splice( i, 1 );
    } else if ( powerUp.y > CANVAS_HEIGHT ) {
      powerUps.splice( i, 1 );
    }
  }

  updatePowerUpEffects();
}

function drawPowerUps() {
  powerUps.forEach( ( powerUp ) => {
    const style = POWERUP_STYLES[ powerUp.type ];
    ctx.fillStyle = style.fill;
    ctx.fillRect( powerUp.x, powerUp.y, POWERUP_SIZE, POWERUP_SIZE );
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    ctx.fillText( style.label, powerUp.x + POWERUP_SIZE / 2, powerUp.y + POWERUP_SIZE / 2 + 5 );
  } );
}

const BLOCK_COLS = 10;
const BLOCK_ROWS = 7;
const BLOCK_WIDTH = 44;
const BLOCK_HEIGHT = 16;
const BLOCK_GAP = 4;
const BLOCK_MARGIN_X = ( CANVAS_WIDTH - ( BLOCK_COLS * BLOCK_WIDTH + ( BLOCK_COLS - 1 ) * BLOCK_GAP ) ) / 2;
const BLOCK_MARGIN_TOP = 60;

// Fila -> { hits, color }, según el mapeo de resistencia por color del spec.
const BLOCK_ROW_CONFIG = [
  { hits: 3, color: 'red' },
  { hits: 3, color: 'hotpink' },
  { hits: 2, color: 'yellow' },
  { hits: 2, color: 'magenta' },
  { hits: 1, color: 'gray' },
  { hits: 1, color: 'cyan' },
  { hits: 1, color: 'green' },
];

const POINTS_BY_HITS = { 1: 10, 2: 20, 3: 30 };

function createBlocks() {
  const created = [];
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    const { hits, color } = BLOCK_ROW_CONFIG[ row ];
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      created.push( {
        x: BLOCK_MARGIN_X + col * ( BLOCK_WIDTH + BLOCK_GAP ),
        y: BLOCK_MARGIN_TOP + row * ( BLOCK_HEIGHT + BLOCK_GAP ),
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color,
        hitsRemaining: hits,
        points: POINTS_BY_HITS[ hits ],
        destroyed: false,
      } );
    }
  }
  return created;
}

let blocks = createBlocks();

function drawBlocks() {
  blocks.forEach( ( block ) => {
    if ( block.destroyed ) return;
    drawSprite( ctx, `block_${block.color}`, block.x, block.y, block.width, block.height );
  } );
}

const explosions = [];

function spawnExplosion( block ) {
  explosions.push( {
    color: block.color,
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
    startTime: performance.now(),
  } );
}

function updateExplosions() {
  const now = performance.now();
  for ( let i = explosions.length - 1; i >= 0; i-- ) {
    const frames = EXPLOSION_FRAMES[ explosions[ i ].color ];
    const totalDuration = frames.length * EXPLOSION_DURATION;
    if ( now - explosions[ i ].startTime >= totalDuration ) {
      explosions.splice( i, 1 );
    }
  }
}

function drawExplosions() {
  const now = performance.now();
  explosions.forEach( ( explosion ) => {
    const frames = EXPLOSION_FRAMES[ explosion.color ];
    const elapsed = now - explosion.startTime;
    const frameIndex = Math.min( frames.length - 1, Math.floor( elapsed / EXPLOSION_DURATION ) );
    drawFrame( ctx, frames[ frameIndex ], explosion.x, explosion.y, explosion.width, explosion.height );
  } );
}

function hitBlock( block ) {
  block.hitsRemaining -= 1;
  if ( block.hitsRemaining <= 0 ) {
    block.destroyed = true;
    spawnExplosion( block );
    spawnPowerUp( block );
    score += block.points;
    playSound( breakSound );
  }
}

const BALL_RADIUS = 8;
const BALL_SPEED = 5;

function createAttachedBall() {
  return {
    x: paddle.x + paddle.width / 2,
    y: paddle.y - BALL_RADIUS,
    dx: 0,
    dy: 0,
    radius: BALL_RADIUS,
    attached: true,
  };
}

const balls = [ createAttachedBall() ];

function launchAttachedBalls() {
  balls.forEach( ( ball ) => {
    if ( ball.attached ) {
      ball.attached = false;
      ball.dx = 0;
      ball.dy = -BALL_SPEED;
    }
  } );
}

function togglePause() {
  if ( gameState === 'PLAYING' ) {
    gameState = 'PAUSED';
  } else if ( gameState === 'PAUSED' ) {
    gameState = 'PLAYING';
  }
}

function resetGame() {
  blocks = createBlocks();
  balls.length = 0;
  balls.push( createAttachedBall() );
  explosions.length = 0;
  powerUps.length = 0;
  activeEffects.bigPaddleUntil = null;
  paddle.width = PADDLE_WIDTH;
  paddle.x = clampPaddleX( ( CANVAS_WIDTH - PADDLE_WIDTH ) / 2 );
  score = 0;
  lives = 3;
  gameState = 'START';
}

function handleKeyDown( e ) {
  if ( gameState === 'GAME_OVER' || gameState === 'VICTORY' ) {
    resetGame();
    return;
  }

  if ( ( gameState === 'PLAYING' || gameState === 'PAUSED' ) && ( e.key === 'p' || e.key === 'P' || e.key === 'Escape' ) ) {
    togglePause();
    return;
  }
  if ( e.key === 'ArrowLeft' || e.key === 'ArrowRight' ) e.preventDefault();

  if ( e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ) keysPressed.left = true;
  if ( e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ) keysPressed.right = true;

  if ( gameState === 'START' ) {
    gameState = 'PLAYING';
  } else if ( gameState === 'PLAYING' ) {
    launchAttachedBalls();
  }
}

function handleKeyUp( e ) {
  if ( e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ) keysPressed.left = false;
  if ( e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ) keysPressed.right = false;
}

function handleMouseMove( e ) {
  const rect = canvas.getBoundingClientRect();
  mouseX = ( e.clientX - rect.left ) * ( CANVAS_WIDTH / rect.width );
}

function handleCanvasClick() {
  if ( gameState === 'GAME_OVER' || gameState === 'VICTORY' ) {
    resetGame();
    return;
  }

  if ( gameState === 'START' ) {
    gameState = 'PLAYING';
  } else if ( gameState === 'PLAYING' ) {
    launchAttachedBalls();
  }
}

window.addEventListener( 'keydown', handleKeyDown );
window.addEventListener( 'keyup', handleKeyUp );
canvas.addEventListener( 'mousemove', handleMouseMove );
canvas.addEventListener( 'click', handleCanvasClick );

function updatePaddle() {
  const usingKeyboard = keysPressed.left || keysPressed.right;
  if ( usingKeyboard ) {
    mouseX = null;
  }

  if ( keysPressed.left ) {
    paddle.x = clampPaddleX( paddle.x - paddle.speed );
  }
  if ( keysPressed.right ) {
    paddle.x = clampPaddleX( paddle.x + paddle.speed );
  }
  if ( !usingKeyboard && mouseX !== null ) {
    paddle.x = clampPaddleX( mouseX - paddle.width / 2 );
  }
}

function bounceBallOffPaddle( ball ) {
  const hitPos = ( ball.x - paddle.x ) / paddle.width; // 0 (izquierda) .. 1 (derecha)
  const clampedHitPos = Math.max( 0, Math.min( 1, hitPos ) );
  const angle = ( clampedHitPos - 0.5 ) * ( Math.PI / 3 ) * 2; // -60° .. 60° desde vertical
  const speed = Math.hypot( ball.dx, ball.dy ) || BALL_SPEED;

  ball.dx = speed * Math.sin( angle );
  ball.dy = -Math.abs( speed * Math.cos( angle ) );
  ball.y = paddle.y - ball.radius;

  playSound( bounceSound );
}

function checkBallBlockCollision( ball ) {
  for ( const block of blocks ) {
    if ( block.destroyed ) continue;

    const closestX = Math.max( block.x, Math.min( ball.x, block.x + block.width ) );
    const closestY = Math.max( block.y, Math.min( ball.y, block.y + block.height ) );
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;

    if ( ( dx * dx + dy * dy ) > ball.radius * ball.radius ) continue;

    const overlapX = ball.radius - Math.abs( dx );
    const overlapY = ball.radius - Math.abs( dy );

    if ( overlapX < overlapY ) {
      ball.dx = dx < 0 ? -Math.abs( ball.dx ) : Math.abs( ball.dx );
    } else {
      ball.dy = dy < 0 ? -Math.abs( ball.dy ) : Math.abs( ball.dy );
    }

    playSound( bounceSound );
    hitBlock( block );
    break;
  }
}

function loseLife() {
  lives -= 1;
  balls.length = 0;

  if ( lives <= 0 ) {
    gameState = 'GAME_OVER';
    if ( score > bestScore ) {
      bestScore = score;
      saveBestScore( bestScore );
    }
    return;
  }

  balls.push( createAttachedBall() );
}

function updateBalls() {
  balls.forEach( ( ball ) => {
    if ( ball.attached ) {
      ball.x = paddle.x + paddle.width / 2;
      ball.y = paddle.y - ball.radius;
      return;
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    if ( ball.x - ball.radius <= 0 ) {
      ball.x = ball.radius;
      ball.dx = Math.abs( ball.dx );
      playSound( bounceSound );
    } else if ( ball.x + ball.radius >= CANVAS_WIDTH ) {
      ball.x = CANVAS_WIDTH - ball.radius;
      ball.dx = -Math.abs( ball.dx );
      playSound( bounceSound );
    }

    if ( ball.y - ball.radius <= 0 ) {
      ball.y = ball.radius;
      ball.dy = Math.abs( ball.dy );
      playSound( bounceSound );
    }

    const withinPaddleX = ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width;
const withinPaddleY = ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height;
    if ( ball.dy > 0 && withinPaddleX && withinPaddleY ) {
      bounceBallOffPaddle( ball );
    }

    checkBallBlockCollision( ball );
  } );

  const allFallen = balls.every( ( ball ) => !ball.attached && ball.y - ball.radius > CANVAS_HEIGHT );
  if ( allFallen ) {
    loseLife();
  }
}

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

function loadMuted() {
  try {
    return localStorage.getItem( MUTED_KEY ) === 'true';
  } catch ( e ) {
    return false;
  }
}

function saveMuted( value ) {
  try {
    localStorage.setItem( MUTED_KEY, String( value ) );
  } catch ( e ) {
    // localStorage no disponible; se ignora silenciosamente.
  }
}

function updateHud() {
  hudScoreEl.textContent = `Score: ${score}`;
  hudLivesEl.textContent = `Vidas: ${lives}`;
  hudBestEl.textContent = `Best: ${bestScore}`;
}

function updateMuteButton() {
  hudMuteEl.textContent = audio.muted ? '🔇' : '🔊';
}

function toggleMute() {
  audio.muted = !audio.muted;
  updateMuteButton();
  saveMuted( audio.muted );
}

hudMuteEl.addEventListener( 'click', toggleMute );

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
  drawBlocks();
  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height );
  balls.forEach( ( ball ) => {
    drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );
  } );
  drawExplosions();
  drawPowerUps();
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
  ctx.fillText( 'Presiona una tecla o haz click para reiniciar', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50 );
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
  ctx.fillText( 'Presiona una tecla o haz click para reiniciar', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50 );
}

function checkVictory() {
  const allDestroyed = blocks.every( ( block ) => block.destroyed );
  if ( allDestroyed ) {
    gameState = 'VICTORY';
    if ( score > bestScore ) {
      bestScore = score;
      saveBestScore( bestScore );
    }
  }
}

function update( dt ) {
  if ( gameState === 'PLAYING' ) {
    updatePaddle();
    updateBalls();
    updateExplosions();
    updatePowerUps();

    if ( gameState === 'PLAYING' ) {
      checkVictory();
    }
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
  audio.muted = loadMuted();
  updateMuteButton();
  score = 0;
  lives = 3;
  gameState = 'START';
  requestAnimationFrame( loop );
}

loadSpritesheet( init );
