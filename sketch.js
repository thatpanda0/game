let keysPressed = {};
let xv = 0;
let yv = 0;
let xpos, ypos;

let bullets = [];
let chasers = [];

let font;
let interval = 2000;
let score = 0;

let gameState = 'title'; // 'title', 'playing', 'gameover'
let paused = false;

const CHASER_SPEED = 7 + random(6);
const MIN_SPAWN_DIST = 900;

function preload() {
  font = loadFont('ewq.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(font);
  resetGame();
}

function resetGame() {
  xpos = width / 2;
  ypos = height / 2;
  xv = yv = 0;
  bullets = [];
  chasers = [];
  score = 0;
  playerAlive = true;
  clearInterval(this._spawnInterval);
  this._spawnInterval = setInterval(spawnChaser, interval);
}

function spawnChaser() {
  // ensure spawn at least MIN_SPAWN_DIST away
  let x, y;
  do {
    x = random(width);
    y = random(height);
  } while (dist(x, y, xpos, ypos) < MIN_SPAWN_DIST);

  chasers.push({ x, y, speed: CHASER_SPEED, alive: true });
}

function draw() {
  background(23);
  fill(255);
  textAlign(CENTER, CENTER);

  if (gameState === 'title') {
    titleScreen();
  }
  else if (gameState === 'playing') {
    if (!paused) {
      handleInput();
      movePlayer();
      moveChasers();
      updateBullets();
      checkPlayerCollision();
    }
    drawPlayer();
    drawChasers();
    drawBullets();
    drawScore();

    if (paused) {
      fill(255, 255, 0, 200);
      textSize(64);
      text('PAUSED', width/2, height/2);
    }

    if (!playerAlive) {
      gameState = 'gameover';
    }
  }
  else if (gameState === 'gameover') {
    gameOverScreen();
  }
}

function titleScreen() {
  fill(200);
  textSize(72);
  text('undefined', width/2, height/2 - 100);

  // play button
  let bw = 200, bh = 60;
  let bx = width/2 - bw/2, by = height/2;
  fill(100, 200, 100);
  rect(bx, by, bw, bh, 25);
  fill(0);
  textSize(24);
  text('play', width/2, by + 3*bh/8);
}

function gameOverScreen() {
  fill(200, 0, 0);
  textAlign(CENTER);
  textSize(60);
  text("Game Over", width / 2, height / 2 - 80);
  drawScore(true);

  // restart button
  let bw = 220, bh = 60;
  let bx = width/2 - bw/2, by = height/2 + 20;
  fill(100, 200, 100);
  rect(bx, by, bw, bh, 25);
  fill(0);
  textAlign(CENTER);
  text('restart', width/2, by + bh/4);
}

function drawScore(onGameOver=false) {
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  if (!onGameOver) {
    text(score, 20, 20);
  } else {
    textAlign(CENTER);
    text(`Score: ${score}`, width/2, height/2 - 20);
  }
}

function handleInput() {
  const acc = Math.max(windowWidth, windowHeight) / 1000;
  if (keyIsDown(68)) xv += acc;
  if (keyIsDown(65)) xv -= acc;
  if (keyIsDown(87)) yv -= acc;
  if (keyIsDown(83)) yv += acc;
}

function keyPressed() {
  if (gameState === 'playing' && key === 'p') {
    paused = !paused;
  }
}

function movePlayer() {
  xv *= 0.9; yv *= 0.9;
  xpos += xv; ypos += yv;
  xpos = constrain(xpos, 15, width  - 15);
  ypos = constrain(ypos, 15, height - 15);
}

function drawPlayer() {
  fill(125, 140, 200);
  noStroke();
  circle(xpos, ypos, 30);
}

function moveChasers() {
  for (let c of chasers) {
    if (!c.alive) continue;
    let dx = xpos - c.x, dy = ypos - c.y;
    let d = sqrt(dx*dx + dy*dy);
    if (d > 0) {
      c.x += (dx/d)*c.speed;
      c.y += (dy/d)*c.speed;
    }
  }
}

function drawChasers() {
  for (let c of chasers) {
    if (!c.alive) continue;
    fill(255, 100, 100);
    noStroke();
    circle(c.x, c.y, 30);
  }
}

function mousePressed() {
  if (gameState === 'title') {
    // check play button
    let bw = 200, bh = 60;
    let bx = width/2 - bw/2, by = height/2;
    if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
      gameState = 'playing';
      resetGame();
    }
  }
  else if (gameState === 'gameover') {
    // check restart button
    let bw = 220, bh = 60;
    let bx = width/2 - bw/2, by = height/2 + 20;
    if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
      gameState = 'playing';
      resetGame();
    }
  }
  else if (gameState === 'playing' && !paused) {
    // shoot bullet
    let angle = atan2(mouseY - ypos, mouseX - xpos);
    let speed = 10;
    bullets.push({
      x: xpos, y: ypos,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      r: 5
    });
  }
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.vx; b.y += b.vy;

    if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
      bullets.splice(i, 1);
      continue;
    }

    for (let c of chasers) {
      if (c.alive && dist(b.x, b.y, c.x, c.y) < 15 + b.r) {
        c.alive = false;
        bullets.splice(i, 1);
        score++;
        break;
      }
    }
  }
}

function drawBullets() {
  fill(255);
  noStroke();
  for (let b of bullets) {
    circle(b.x, b.y, b.r * 2);
  }
}

function checkPlayerCollision() {
  for (let c of chasers) {
    if (c.alive && dist(xpos, ypos, c.x, c.y) < 30) {
      playerAlive = false;
      clearInterval(this._spawnInterval);
      break;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
