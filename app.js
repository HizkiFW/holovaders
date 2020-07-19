let canvas = null;
let gameData = {
  playerX: 400,
  playerY: 500,
};
let keyStates = {
  ArrowLeft: false,
  ArrowRight: false,
};
let bullets = [];
let enemies = [];
// Offset in units (not pixels)
// 0 => horizontal movement, positive goes right
// 1 => vertical movement, positive goes down
let enemyOffset = [0, 0];
const enemyOffsetStep = [10, 5];
const enemyStepsX = 5;
let drawFrame = 0;
let physicsFrame = 0;

window.onkeydown = (e) => {
  keyStates[e.key] = true;
  if (e.key === " ") handleShoot();
};
window.onkeyup = (e) => {
  keyStates[e.key] = false;
};

const handleShoot = () => {
  bullets.push([gameData.playerX, gameData.playerY]);
};

window.onload = () => {
  canvas = document.getElementById("game");
  initEnemies();
  drawLoop();
  physicsLoop();
};

const initEnemies = () => {
  const nEnemiesX = 11;
  const enemySize = 64;
  const enemyRowWidth = nEnemiesX * enemySize;
  const totalTravelX = enemyStepsX * enemyOffsetStep[0];
  const offsetX = (canvas.width - enemyRowWidth - totalTravelX) / 2;
  for (let i = 0; i < nEnemiesX; i++) {
    for (let layer = 1; layer < 5; layer++) {
      enemies.push({
        x: offsetX + i * enemySize,
        y: layer * enemySize,
        sprite: document.getElementById("img" + layer),
      });
    }
  }
};

const physicsLoop = () => {
  physicsFrame++;
  setTimeout(physicsLoop, 1000 / 60);

  // Handle key down
  if (keyStates.ArrowLeft) {
    gameData.playerX -= 5;
  }
  if (keyStates.ArrowRight) {
    gameData.playerX += 5;
  }

  // Prevent player going off screen
  if (gameData.playerX > canvas.width) gameData.playerX = canvas.width;
  else if (gameData.playerX < 0) gameData.playerX = 0;

  // Update bullet positions and remove off-screen ones
  bullets = bullets
    .map((bullet) => [bullet[0], bullet[1] - 5])
    .filter((bullet) => bullet[1] > 0);

  // Update enemy positions
  if (physicsFrame % 30 === 0) {
    if (enemyOffset[1] % 2 === 0) enemyOffset[0]++;
    else enemyOffset[0]--;
    if (enemyOffset[0] >= enemyStepsX || enemyOffset[0] <= 0) enemyOffset[1]++;
  }
};

const drawLoop = () => {
  drawFrame++;
  requestAnimationFrame(drawLoop);

  const ctx = canvas.getContext("2d");

  const imgPlayer = document.getElementById("imgPlayer");

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw player
  ctx.drawImage(
    imgPlayer,
    gameData.playerX - imgPlayer.width / 2,
    gameData.playerY
  );

  // Draw bullets
  ctx.fillStyle = "#0D0";
  bullets.forEach((bullet) => ctx.fillRect(bullet[0], bullet[1], 5, 5));

  // Draw enemies
  enemies.forEach((enemy) => {
    ctx.drawImage(
      enemy.sprite,
      enemy.x + enemyOffset[0] * enemyOffsetStep[0],
      enemy.y + enemyOffset[1] * enemyOffsetStep[1]
    );
  });
};
