// sketch.js

let keysPressed = {}
let xv = 0;
let yv = 0;
let xpos = 200;
let ypos = 200;

let bullets = [];
let chasers = [];

let font;
let interval = 2000;
let playerAlive = true;

function preload() {
  // assumes ewq.ttf lives next to index.html & sketch.js
  font = loadFont('ewq.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(font);
  setInterval(spawnChaser, interval);
}

function spawnChaser() {
  chasers.push({
    x: random(width),
    y: random(height),
    speed: 3 + random(4),
    alive: true
  });
}

function draw() {
  background(23);

  if (playerAlive) {
    handleInput();
    movePlayer();
    drawPlayer();
    moveChasers();
    drawChasers();
    updateBullets();
    drawBullets();
    checkPlayerCollision();
  } else {
    fill(200, 0, 0);
    textSize(60);
    textAlign(CENTER, CENTER);
    text("Game Over", width / 2, height / 2 - 50);
  }
}

function handleInput() {
  // Simple WASD thrust
  if (keyIsDown(68)) xv += 1; // D
  if (keyIsDown(65)) xv -= 1; // A
  if (keyIsDown(87)) yv -= 1; // W
  if (keyIsDown(83)) yv += 1; // S
}

function movePlayer() {
  xv *= 0.9; yv *= 0.9;
  xpos += xv; ypos += yv;

  // keep on‐screen
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
  let angle = atan2(mouseY - ypos, mouseX - xpos);
  let speed = 10;
  bullets.push({
    x: xpos, y: ypos,
    vx: cos(angle) * speed,
    vy: sin(angle) * speed,
    r: 5
  });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.vx; b.y += b.vy;

    // remove off‐screen
    if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
      bullets.splice(i, 1);
      continue;
    }

    // hit test
    for (let c of chasers) {
      if (c.alive && dist(b.x, b.y, c.x, c.y) < 15 + b.r) {
        c.alive = false;
        bullets.splice(i, 1);
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
      break;
    }
  }
}

// Optional: resize canvas if the window changes size
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
