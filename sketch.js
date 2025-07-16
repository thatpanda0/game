let keysPressed = {};
let xv = 0;
let yv = 0;
let xpos, ypos;

let bullets = [];
let chasers = [];
let chaserBullets = [];

let font;
let interval = 2000;
let score = 0;

let gameState = 'title'; // 'title', 'playing', 'gameover'
let paused = false;

let MIN_SPAWN_DIST;
let spawnIntervalId;

let firing = false;
let lastShotTime = 0;
const SHOT_INTERVAL = 400; //ms between held bullets

function preload() {
  font = loadFont('ewq.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(font);
  resetGame();
}

function resetGame() {
  MIN_SPAWN_DIST = min(900, sqrt(width*width + height*height) * 0.5);
  if (spawnIntervalId) clearInterval(spawnIntervalId);
  spawnIntervalId = setInterval(spawnChaser, interval);
  xpos = width / 2;
  ypos = height / 2;
  xv = yv = 0;
  bullets = [];
  chasers = [];
  chaserBullets = [];
  score = 0;
  playerAlive = true;
}

function spawnChaser() {
  let x, y;
  let tries = 0;
  do {
    x = random(width);
    y = random(height);
    if (++tries > 30) {
      // fallback: choose a random edge position
      if (random() < 0.5) {
        x = random() < 0.5 ? 0 : width;
        y = random(height);
      } else {
        x = random(width);
        y = random() < 0.5 ? 0 : height;
      }
      break;
    }
  } while (dist(x, y, xpos, ypos) < MIN_SPAWN_DIST);

    chasers.push({
    x, y,
    speed: 7 + random(8),
    alive: true,
    nextShot: millis() + random(500, 2000)   // fire in 0.5–2s
  });
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
      updateChaserShooting();
      updateChaserBullets();
      updateBullets();
      checkPlayerCollision();
      
      if (firing && millis() - lastShotTime > SHOT_INTERVAL) {
        shootBullet();
        lastShotTime = millis();
      }

    }
    drawPlayer();
    drawChasers();
    drawChaserBullets();
    drawBullets();
    drawScore();

    if (paused) {
      fill(255, 255, 0, 200);
      textSize(64);
      textAlign(CENTER);
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
  const acc = 2;// Math.max(windowWidth, windowHeight) / 1000;
  if (keyIsDown(68)) xv += acc;
  if (keyIsDown(65)) xv -= acc;
  if (keyIsDown(87)) yv -= acc;
  if (keyIsDown(83)) yv += acc;
}

function keyPressed() {
  if (gameState !== 'playing' || key !== 'p') return;

  paused = !paused;

  if (paused) {
    clearInterval(spawnIntervalId);
  } else {

    spawnIntervalId = setInterval(spawnChaser, interval);
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

function drawChaserBullets() {
  fill(255, 150, 0);
  noStroke();
  for (let b of chaserBullets) {
    circle(b.x, b.y, b.r*2);
  }
}


function shootBullet() {
  let angle = atan2(mouseY - ypos, mouseX - xpos);
  let speed = 10;
  bullets.push({
    x: xpos,
    y: ypos,
    vx: cos(angle) * speed,
    vy: sin(angle) * speed,
    r: 5
  });
}

function mousePressed() {
  if (gameState === 'title') {
    let bw = 200, bh = 60;
    let bx = width / 2 - bw / 2, by = height / 2;
    if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
      gameState = 'playing';
      resetGame();
    }
  } else if (gameState === 'gameover') {
    let bw = 220, bh = 60;
    let bx = width / 2 - bw / 2, by = height / 2 + 20;
    if (mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh) {
      gameState = 'playing';
      resetGame();
    }
  } else if (gameState === 'playing' && !paused) {
    firing = true;
    lastShotTime = millis() - SHOT_INTERVAL; // Fire immediately
  }
}

function mouseReleased() {
  firing = false;
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



function updateChaserShooting() {
  const SPREAD = radians(10);
  const BULLET_S = 16; // speed and random angle
  for (let c of chasers) {
    if (!c.alive) continue;
    if (millis() >= c.nextShot) {
      // schedule next shot
      c.nextShot = millis() + random(400, 1000);
      // aim at player + random spread
      let baseAng = atan2(ypos - c.y, xpos - c.x);
      let ang     = baseAng + random(-SPREAD, SPREAD);
      chaserBullets.push({
        x:   c.x,
        y:   c.y,
        vx:  cos(ang) * BULLET_S,
        vy:  sin(ang) * BULLET_S,
        r:   5
      });
    }
  }
}

function updateChaserBullets() {
  // loop backwards so we can splice safely
  for (let i = chaserBullets.length - 1; i >= 0; i--) {
    let b = chaserBullets[i];
    b.x += b.vx;
    b.y += b.vy;

    // off screen?
    if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
      chaserBullets.splice(i, 1);
      continue;
    }

    // hit player?
    if (dist(b.x, b.y, xpos, ypos) < b.r + 15) {
      playerAlive = false;
      return;
    }

    // collide with player bullets?
    for (let j = bullets.length - 1; j >= 0; j--) {
      let pb = bullets[j];
      if (dist(b.x, b.y, pb.x, pb.y) < b.r + pb.r) {
        // destroy both
        chaserBullets.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }
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
