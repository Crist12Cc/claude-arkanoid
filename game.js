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

function handleKeyDown( e ) {
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
  if ( mouseX !== null ) {
    paddle.x = clampPaddleX( mouseX - paddle.width / 2 );
  }
  if ( keysPressed.left ) {
    paddle.x = clampPaddleX( paddle.x - paddle.speed );
  }
  if ( keysPressed.right ) {
    paddle.x = clampPaddleX( paddle.x + paddle.speed );
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
}

function loseLife() {
  lives -= 1;
  balls.length = 0;
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
    } else if ( ball.x + ball.radius >= CANVAS_WIDTH ) {
      ball.x = CANVAS_WIDTH - ball.radius;
      ball.dx = -Math.abs( ball.dx );
    }

    if ( ball.y - ball.radius <= 0 ) {
      ball.y = ball.radius;
      ball.dy = Math.abs( ball.dy );
    }

    const withinPaddleX = ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width;
    const withinPaddleY = ball.y + ball.radius >= paddle.y && ball.y + ball.radius <= paddle.y + paddle.height;
    if ( ball.dy > 0 && withinPaddleX && withinPaddleY ) {
      bounceBallOffPaddle( ball );
    }
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
  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height );
  balls.forEach( ( ball ) => {
    drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );
  } );
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
    updatePaddle();
    updateBalls();
    // La lógica de bloques se agrega en pasos siguientes.
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
