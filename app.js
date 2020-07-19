let canvas = null;
let ctx = null;
let gameState = {
  playerX: 400,
  playerY: 500,
  isPlayerDead: false,
  isGameStarted: false,
  score: 0,
};
let keyStates = {
  ArrowLeft: false,
  ArrowRight: false,
};
let shootThrottle = 1000;
// Bullet info
let bullets = [];
let enemies = [];
let shields = [];
// Offset in units (not pixels)
// 0 => horizontal movement, positive goes right
// 1 => vertical movement, positive goes down
let enemyOffset = [0, 0];
const enemyOffsetStep = [5, 5];
const enemyStepsX = 30;
let drawFrame = 0;
let physicsFrame = 0;

window.onkeydown = (e) => {
  keyStates[e.key] = true;
  if (e.key === " ") {
    if (gameState.isGameStarted) handleShoot();
    else gameState.isGameStarted = true;
  }
};
window.onkeyup = (e) => {
  keyStates[e.key] = false;
};

window.onload = () => {
  initCanvas();
  initEnemies();
  initShields();

  drawLoop();
  physicsLoop();
};

let lastShoot = 0;
const handleShoot = () => {
  const now = new Date().getTime();
  if (now - lastShoot >= shootThrottle) {
    bullets.push({
      x: gameState.playerX,
      y: gameState.playerY,
      fromPlayer: true,
    });
    lastShoot = now;
  }
};

const handleEnemyShoot = (enemy) => {
  const enemyX = enemy.x + enemyOffset[0] * enemyOffsetStep[0];
  const enemyY = enemy.y + enemyOffset[1] * enemyOffsetStep[1];
  bullets.push({
    x: enemyX,
    y: enemyY,
    fromPlayer: false,
  });
};

const initCanvas = () => {
  canvas = document.getElementById("game");
  ctx = canvas.getContext("2d");
};

const initShields = () => {
  const paddingH = 100;
  const shieldWidth = 50;
  const nShields = 3;
  const distApart = canvas.width / nShields;

  for (let i = 0; i < nShields; i++) {
    shields.push({
      x: paddingH + i * distApart,
      y: 420,
      width: shieldWidth,
      health: 50,
      maxHealth: 50,
    });
  }
};

const initEnemies = () => {
  const nEnemiesX = 11;
  const enemyWidth = 55;
  const enemyHeight = 52;
  const enemyRowWidth = nEnemiesX * enemyWidth;
  const totalTravelX = enemyStepsX * enemyOffsetStep[0];
  const offsetX = (canvas.width - enemyRowWidth - totalTravelX) / 2;
  for (let i = 0; i < nEnemiesX; i++) {
    for (let layer = 1; layer < 5; layer++) {
      enemies.push({
        x: offsetX + i * enemyWidth,
        y: layer * enemyHeight,
        sprite: document.getElementById("img" + layer),
        points: (5 - layer) * 10,
      });
    }
    const layer = 4;
    enemies.push({
      x: offsetX + i * enemyWidth,
      y: (layer + 1) * enemyHeight,
      sprite: document.getElementById("img" + layer),
      points: (5 - layer) * 10,
    });
  }
};

const physicsLoop = () => {
  physicsFrame++;
  setTimeout(physicsLoop, 1000 / 60);

  if (gameState.isPlayerDead || !gameState.isGameStarted) return;

  // Handle key down
  if (keyStates.ArrowLeft) {
    gameState.playerX -= 5;
  }
  if (keyStates.ArrowRight) {
    gameState.playerX += 5;
  }

  // Prevent player going off screen
  if (gameState.playerX > canvas.width) gameState.playerX = canvas.width;
  else if (gameState.playerX < 0) gameState.playerX = 0;

  // Collision checks
  enemies.forEach((enemy, iE) => {
    // Check for bullet-enemy collision
    bullets.forEach((bullet, iB) => {
      if (!bullet.fromPlayer) return;
      // Collision check
      if (!checkPointEnemyCollision(bullet.x, bullet.y, enemy)) return;
      // Destroy bullet
      bullets[iB].y = -1;
      // Destroy enemy
      enemies[iE].y = -9999;
      // Add score
      gameState.score += enemies[iE].points;
    });

    // Check for player-enemy collision
    if (checkPointEnemyCollision(gameState.playerX, gameState.playerY, enemy)) {
      // Player is dead
      gameState.isPlayerDead = true;
    }
  });

  // Check bullet-shield collision
  shields.forEach((shield, iS) => {
    bullets.forEach((bullet, iB) => {
      if (
        bullet.x > shield.x &&
        bullet.x < shield.x + shield.width &&
        bullet.y > shield.maxHealth - shield.health + shield.y &&
        bullet.y < shield.maxHealth + shield.y
      ) {
        shields[iS].health -= 5;
        bullets[iB].y = -1;
      }
    });
  });

  // Check bullet-player collision
  bullets
    .filter((bullet) => !bullet.fromPlayer)
    .forEach((bullet) => {
      if (!checkPointPlayerCollision(bullet.x, bullet.y)) return;
      gameState.isPlayerDead = true;
    });

  // Clean up enemies
  enemies = enemies.filter((enemy) => enemy.y >= 0);

  // Ran out of enemies
  if (enemies.length === 0) {
    initEnemies();
  }

  // Update bullet positions and remove off-screen ones
  bullets = bullets
    .map((bullet) => ({
      ...bullet,
      y: bullet.y + (bullet.fromPlayer ? -5 : 5),
    }))
    .filter((bullet) => bullet.y > 0);

  // Update enemy positions
  if (physicsFrame % 30 === 0) {
    if (enemyOffset[1] % 2 === 0) enemyOffset[0]++;
    else enemyOffset[0]--;
    if (enemyOffset[0] >= enemyStepsX || enemyOffset[0] <= 0) enemyOffset[1]++;
  }

  // Enemy shoot
  if (physicsFrame % 60 === 0) {
    handleEnemyShoot(enemies[Math.floor(Math.random() * enemies.length)]);
    handleEnemyShoot(enemies[Math.floor(Math.random() * enemies.length)]);
  }
};

const checkPointEnemyCollision = (pointX, pointY, enemy) => {
  const enemyX = enemy.x + enemyOffset[0] * enemyOffsetStep[0];
  const enemyY = enemy.y + enemyOffset[1] * enemyOffsetStep[1];
  return (
    pointX > enemyX &&
    pointY > enemyY &&
    pointX < enemyX + enemy.sprite.width &&
    pointY < enemyY + enemy.sprite.height
  );
};

const checkPointPlayerCollision = (pointX, pointY) => {
  const imgPlayer = document.getElementById("imgPlayer");
  return (
    pointX > gameState.playerX - imgPlayer.width / 2 &&
    pointX < gameState.playerX + imgPlayer.width / 2 &&
    pointY > gameState.playerY &&
    pointY < gameState.playerY + imgPlayer.height
  );
};

const drawLoop = () => {
  drawFrame++;
  requestAnimationFrame(drawLoop);

  // Clear screen
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw player
  const imgPlayer = document.getElementById("imgPlayer");
  ctx.drawImage(
    imgPlayer,
    gameState.playerX - imgPlayer.width / 2,
    gameState.playerY
  );

  // Draw enemies
  enemies.forEach((enemy) => {
    ctx.drawImage(
      enemy.sprite,
      enemy.x + enemyOffset[0] * enemyOffsetStep[0],
      enemy.y + enemyOffset[1] * enemyOffsetStep[1]
    );
  });

  // Draw shields
  ctx.fillStyle = "#FFF";
  shields.forEach((shield) => {
    ctx.fillRect(
      shield.x,
      shield.maxHealth - shield.health + shield.y,
      shield.width,
      shield.health
    );
  });

  // Draw bullets
  ctx.fillStyle = "#0D0";
  bullets.forEach((bullet) => ctx.fillRect(bullet.x, bullet.y, 5, 5));

  // Draw score
  drawScoreText();

  // Game over screen
  if (gameState.isPlayerDead) {
    if (physicsFrame % 120 > 60)
      drawCenterText("Game Over", "Refresh to restart");
    else drawCenterText("Game Over", `Your score: ${gameState.score}`);
  } else if (!gameState.isGameStarted) {
    drawCenterText("HOLOVADERS", "Press [space] to start");
  }
};

const drawScoreText = () => {
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = "#0D0";
  ctx.fillText("SCORE", 10, 25);
  ctx.fillText(gameState.score, 10, 45);
};

const drawCenterText = (bigText, smallText) => {
  ctx.font = "48px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, canvas.height / 2 - 42, canvas.width, 75);
  ctx.fillStyle = "#000";
  ctx.fillText(bigText, canvas.width / 2, canvas.height / 2);
  ctx.font = "24px monospace";
  ctx.fillText(smallText, canvas.width / 2, canvas.height / 2 + 24);
};
