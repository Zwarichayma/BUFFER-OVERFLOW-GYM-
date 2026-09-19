import './style.css'

const rainDrops = Array.from({ length: 28 }, (_, index) => `<span class="drop d${index + 1}"></span>`).join('')
const cableSegments = Array.from({ length: 7 }, (_, index) => `<span class="cable c${index + 1}"></span>`).join('')

const app = document.querySelector<HTMLDivElement>('#app')

if (app) {
  app.innerHTML = `
    <div class="scene" aria-label="Buffer Overflow Gym cyberpunk gym illustration">
      <div class="wall-glow"></div>
      <div class="ceiling-cables">${cableSegments}</div>

      <div class="hud">
        <div class="hud-box"><span>score</span><strong id="score">0</strong></div>
        <div class="hud-box"><span>speed</span><strong id="speed">1.0x</strong></div>
        <div class="hud-box"><span>streak</span><strong id="streak">0</strong></div>
      </div>

      <div class="neon-sign">
        <span class="word word-top">BUFFER</span>
        <span class="word word-mid">OVERFLOW</span>
        <span class="word word-bot">GYM</span>
        <span class="tagline">GET SWOL / AVOID LAG</span>
      </div>

      <div class="window">
        <div class="rain">${rainDrops}</div>
      </div>

      <div class="floor"></div>

      <div class="track-area">
        <div class="lane lane-left"></div>
        <div class="lane lane-center"></div>
        <div class="lane lane-right"></div>

        <div id="player" class="player" aria-label="Player character">
          <div class="player-head"></div>
          <div class="player-body"></div>
          <div class="player-arm arm-left"></div>
          <div class="player-arm arm-right"></div>
          <div class="player-leg leg-left"></div>
          <div class="player-leg leg-right"></div>
        </div>

        <div id="obstacles" class="obstacles"></div>
      </div>

      <div class="gym-station treadmill-station">
        <div class="console">
          <span>DATA/SPEED</span>
          <div class="graph">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div class="treadmill">
          <div class="belt"></div>
          <div class="rail left"></div>
          <div class="rail right"></div>
          <div class="screen"></div>
        </div>
      </div>

      <div class="weight-rack rack-left">
        <span class="rack-label">STRENGTH // CODE POWER</span>
        <div class="rack-row row-top"></div>
        <div class="rack-row row-mid"></div>
        <div class="rack-row row-bot"></div>
      </div>

      <div class="bench-station">
        <div class="bench"></div>
        <div class="plate plate-a"></div>
        <div class="plate plate-b"></div>
        <div class="plate plate-c"></div>
      </div>

      <div class="plant plant-left">
        <div class="pot"></div>
        <span class="leaf l1"></span>
        <span class="leaf l2"></span>
        <span class="leaf l3"></span>
      </div>

      <div class="plant plant-right">
        <div class="pot"></div>
        <span class="leaf l1"></span>
        <span class="leaf l2"></span>
        <span class="leaf l3"></span>
      </div>

      <div id="startOverlay" class="overlay visible">
        <div class="overlay-box">
          <h1>BUFFER OVERFLOW</h1>
          <p>Press <strong>SPACE</strong> to start</p>
          <small>Move with <strong>A / D</strong> or <strong>← / →</strong></small>
        </div>
      </div>

      <div id="gameOver" class="overlay hidden">
        <div class="overlay-box game-over-box">
          <h2>SESSION OVER</h2>
          <p>Final score: <strong id="finalScore">0</strong></p>
          <p>Press <strong>SPACE</strong> or <strong>R</strong> to retry</p>
        </div>
      </div>
    </div>
  `
}

type Obstacle = {
  lane: number
  y: number
  el: HTMLDivElement
}

const scoreEl = document.getElementById('score') as HTMLSpanElement
const speedEl = document.getElementById('speed') as HTMLSpanElement
const streakEl = document.getElementById('streak') as HTMLSpanElement
const finalScoreEl = document.getElementById('finalScore') as HTMLSpanElement
const playerEl = document.getElementById('player') as HTMLDivElement
const obstaclesEl = document.getElementById('obstacles') as HTMLDivElement
const startOverlay = document.getElementById('startOverlay') as HTMLDivElement
const gameOverOverlay = document.getElementById('gameOver') as HTMLDivElement

let gameRunning = false
let score = 0
let streak = 0
let bestScore = 0
let lastTime = 0
let spawnTimer = 0
let playerLane = 1
let speedMultiplier = 1
const obstacles: Obstacle[] = []

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function updateHud() {
  scoreEl.textContent = Math.floor(score).toString()
  speedEl.textContent = `${speedMultiplier.toFixed(1)}x`
  streakEl.textContent = streak.toString()
}

function setPlayerLane(nextLane: number) {
  playerLane = clamp(nextLane, 0, 2)
  const laneOffset = (playerLane - 1) * 18
  playerEl.style.left = `${50 + laneOffset}%`
}

function clearObstacles() {
  obstacles.forEach((obstacle) => obstacle.el.remove())
  obstacles.length = 0
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * 3)
  const element = document.createElement('div')
  element.className = 'obstacle'
  element.style.left = `${50 + (lane - 1) * 18}%`
  element.style.top = '-8%'

  const obstacle: Obstacle = {
    lane,
    y: -8,
    el: element,
  }

  obstaclesEl.appendChild(element)
  obstacles.push(obstacle)
}

function startGame() {
  gameRunning = true
  score = 0
  streak = 0
  speedMultiplier = 1
  spawnTimer = 0.7
  lastTime = 0
  playerLane = 1
  setPlayerLane(playerLane)
  clearObstacles()
  startOverlay.classList.remove('visible')
  startOverlay.classList.add('hidden')
  gameOverOverlay.classList.remove('visible')
  gameOverOverlay.classList.add('hidden')
  updateHud()
}

function endGame() {
  gameRunning = false
  bestScore = Math.max(bestScore, Math.floor(score))
  finalScoreEl.textContent = Math.floor(score).toString()
  gameOverOverlay.classList.remove('hidden')
  gameOverOverlay.classList.add('visible')
}

function stepGame(delta: number) {
  if (!gameRunning) return

  score += delta * 28
  speedMultiplier = 1 + score / 250
  streak = Math.max(streak, Math.floor(score / 40))
  updateHud()

  spawnTimer -= delta
  if (spawnTimer <= 0) {
    spawnObstacle()
    spawnTimer = Math.max(0.45, 1.15 - score / 200)
  }

  for (let index = obstacles.length - 1; index >= 0; index -= 1) {
    const obstacle = obstacles[index]
    obstacle.y += delta * (120 + score * 0.7)
    obstacle.el.style.top = `${obstacle.y}%`

    if (obstacle.y > 74 && obstacle.lane === playerLane) {
      endGame()
      return
    }

    if (obstacle.y > 100) {
      obstacle.el.remove()
      obstacles.splice(index, 1)
      score += 18
      streak += 1
      updateHud()
    }
  }
}

function loop(timestamp: number) {
  if (!lastTime) lastTime = timestamp
  const delta = (timestamp - lastTime) / 1000
  lastTime = timestamp

  if (gameRunning) {
    stepGame(delta)
  }

  requestAnimationFrame(loop)
}

document.addEventListener('keydown', (event) => {
  const key = event.code

  if (key === 'ArrowLeft' || key === 'KeyA') {
    event.preventDefault()
    setPlayerLane(playerLane - 1)
  }

  if (key === 'ArrowRight' || key === 'KeyD') {
    event.preventDefault()
    setPlayerLane(playerLane + 1)
  }

  if ((key === 'Space' || key === 'KeyR') && !gameRunning) {
    event.preventDefault()
    startGame()
  }
})

setPlayerLane(playerLane)
updateHud()
requestAnimationFrame(loop)
