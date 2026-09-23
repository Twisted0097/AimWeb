import * as THREE from "three";
import "./style.css";

/*
===========================================================
                        AIMWEB
              3D FPS AIM TRAINER WEB GAME

                    Created By Twisted0097
===========================================================
*/


/* =========================================================
   HTML ELEMENTS
========================================================= */

const game = document.getElementById("game") as HTMLDivElement;

const scoreElement =
  document.getElementById("score") as HTMLSpanElement;

const hitsElement =
  document.getElementById("hits") as HTMLSpanElement;

const shotsElement =
  document.getElementById("shots") as HTMLSpanElement;

const accuracyElement =
  document.getElementById("accuracy") as HTMLSpanElement;

const timeElement =
  document.getElementById("time") as HTMLSpanElement;

const fpsElement =
  document.getElementById("fps") as HTMLSpanElement;

const startScreen =
  document.getElementById("start-screen") as HTMLDivElement;

const pauseScreen =
  document.getElementById("pause-screen") as HTMLDivElement;

const gameOverScreen =
  document.getElementById("game-over") as HTMLDivElement;

const startButton =
  document.getElementById("start-button") as HTMLButtonElement;

const resumeButton =
  document.getElementById("resume-button") as HTMLButtonElement;

const restartButton =
  document.getElementById("restart-button") as HTMLButtonElement;

const finalScoreElement =
  document.getElementById("final-score") as HTMLSpanElement;

const finalAccuracyElement =
  document.getElementById(
    "final-accuracy",
  ) as HTMLSpanElement;


/* =========================================================
   RENDERER
========================================================= */

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});

renderer.setSize(
  window.innerWidth,
  window.innerHeight,
  false,
);

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio || 1,
    1.5,
  ),
);

renderer.outputColorSpace =
  THREE.SRGBColorSpace;

renderer.shadowMap.enabled = false;

game.appendChild(renderer.domElement);


/* =========================================================
   SCENE
========================================================= */

const scene = new THREE.Scene();

scene.background =
  new THREE.Color(0x080808);


/* =========================================================
   CAMERA
========================================================= */

const camera =
  new THREE.PerspectiveCamera(
    75,
    window.innerWidth /
      window.innerHeight,
    0.05,
    500,
  );

camera.position.set(
  0,
  1.7,
  0,
);

camera.rotation.order =
  "YXZ";

scene.add(camera);


/* =========================================================
   LIGHTING
========================================================= */

const ambientLight =
  new THREE.HemisphereLight(
    0xffffff,
    0x202020,
    2,
  );

scene.add(ambientLight);

const directionalLight =
  new THREE.DirectionalLight(
    0xffffff,
    1.5,
  );

directionalLight.position.set(
  10,
  20,
  10,
);

scene.add(directionalLight);


/* =========================================================
   FLOOR
========================================================= */

const floorGeometry =
  new THREE.PlaneGeometry(
    200,
    200,
  );

const floorMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x171717,
    roughness: 0.9,
    metalness: 0,
  });

const floor =
  new THREE.Mesh(
    floorGeometry,
    floorMaterial,
  );

floor.rotation.x =
  -Math.PI / 2;

floor.position.y = 0;

scene.add(floor);


/* =========================================================
   WALLS
========================================================= */

const wallMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x101010,
    roughness: 1,
  });

const wallGeometry =
  new THREE.BoxGeometry(
    200,
    20,
    1,
  );

const backWall =
  new THREE.Mesh(
    wallGeometry,
    wallMaterial,
  );

backWall.position.set(
  0,
  10,
  -100,
);

scene.add(backWall);


const leftWall =
  new THREE.Mesh(
    wallGeometry,
    wallMaterial,
  );

leftWall.rotation.y =
  Math.PI / 2;

leftWall.position.set(
  -100,
  10,
  0,
);

scene.add(leftWall);


const rightWall =
  new THREE.Mesh(
    wallGeometry,
    wallMaterial,
  );

rightWall.rotation.y =
  Math.PI / 2;

rightWall.position.set(
  100,
  10,
  0,
);

scene.add(rightWall);


/* =========================================================
   TARGET SYSTEM
========================================================= */

interface Target {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  radius: number;
}

const targets: Target[] = [];

const targetGeometry =
  new THREE.SphereGeometry(
    0.65,
    24,
    16,
  );

const targetMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.55,
    metalness: 0.1,
});


function createTarget(): void {
  const mesh =
    new THREE.Mesh(
      targetGeometry,
      targetMaterial,
    );

  const horizontalAngle =
    Math.random() *
    Math.PI *
    2;

  const horizontalDistance =
    4 +
    Math.random() * 18;

  const distance =
    10 +
    Math.random() * 25;

  const x =
    Math.cos(horizontalAngle) *
    horizontalDistance;

  const z =
    -distance -
    Math.random() * 10;

  const y =
    1.3 +
    Math.random() * 8;

  mesh.position.set(
    x,
    y,
    z,
  );

  const scale =
    0.75 +
    Math.random() * 0.5;

  mesh.scale.setScalar(scale);

  scene.add(mesh);

  targets.push({
    mesh,

    velocity:
      new THREE.Vector3(
        (Math.random() - 0.5) *
          0.35,

        (Math.random() - 0.5) *
          0.25,

        0,
      ),

    radius:
      0.65 * scale,
  });
}


function removeTarget(
  index: number,
): void {
  if (
    index < 0 ||
    index >= targets.length
  ) {
    return;
  }

  scene.remove(
    targets[index].mesh,
  );

  targets.splice(
    index,
    1,
  );
}


function clearTargets(): void {
  for (
    const target of targets
  ) {
    scene.remove(
      target.mesh,
    );
  }

  targets.length = 0;
}


const MAX_TARGETS = 8;


function maintainTargets(): void {
  while (
    targets.length <
    MAX_TARGETS
  ) {
    createTarget();
  }
}


/* =========================================================
   GAME STATE
========================================================= */

let gameStarted = false;

let gamePaused = false;

let gameFinished = false;

let score = 0;

let hits = 0;

let shots = 0;

const GAME_DURATION = 60;

let remainingTime =
  GAME_DURATION;


/* =========================================================
   CAMERA / MOUSE
========================================================= */

let yaw = 0;

let pitch = 0;

const mouseSensitivity =
  0.0022;


function handleMouseMove(
  event: MouseEvent,
): void {
  if (
    !gameStarted ||
    gamePaused ||
    gameFinished
  ) {
    return;
  }

  /*
   * movementX / movementY come from
   * Pointer Lock.
   */
  yaw -=
    event.movementX *
    mouseSensitivity;

  pitch -=
    event.movementY *
    mouseSensitivity;

  const maxPitch =
    Math.PI / 2 -
    0.05;

  pitch =
    THREE.MathUtils.clamp(
      pitch,
      -maxPitch,
      maxPitch,
    );
}


document.addEventListener(
  "mousemove",
  handleMouseMove,
);


function updateCamera(): void {
  camera.rotation.order =
    "YXZ";

  camera.rotation.y =
    yaw;

  camera.rotation.x =
    pitch;
}


/* =========================================================
   POINTER LOCK
========================================================= */

/*
 * Ask the browser to lock the mouse.
 *
 * This MUST be called from a user action
 * such as clicking Start or Resume.
 */
async function lockMouse(): Promise<void> {
  if (
    document.pointerLockElement ===
    renderer.domElement
  ) {
    return;
  }

  try {
    await renderer.domElement.requestPointerLock();
  } catch {
    /*
     * Some browsers can reject Pointer Lock.
     * The game itself will continue running.
     */
  }
}


/*
 * Release Pointer Lock only when the
 * actual game is over.
 */
function unlockMouse(): void {
  if (
    document.pointerLockElement !==
    null
  ) {
    document.exitPointerLock();
  }
}


/* =========================================================
   SHOOTING
========================================================= */

const raycaster =
  new THREE.Raycaster();

const centerScreen =
  new THREE.Vector2(
    0,
    0,
  );


function shoot(): void {
  if (
    !gameStarted ||
    gamePaused ||
    gameFinished
  ) {
    return;
  }

  shots++;

  raycaster.setFromCamera(
    centerScreen,
    camera,
  );

  const targetMeshes =
    targets.map(
      (target) =>
        target.mesh,
    );

  const intersections =
    raycaster.intersectObjects(
      targetMeshes,
      false,
    );

  if (
    intersections.length === 0
  ) {
    updateHUD();

    return;
  }

  const hitMesh =
    intersections[0].object;

  const targetIndex =
    targets.findIndex(
      (target) =>
        target.mesh ===
        hitMesh,
    );

  if (
    targetIndex === -1
  ) {
    return;
  }

  hits++;

  const distance =
    camera.position.distanceTo(
      hitMesh.position,
    );

  const distanceBonus =
    Math.max(
      0,
      Math.floor(
        40 - distance,
      ),
    );

  score +=
    100 +
    distanceBonus;

  removeTarget(
    targetIndex,
  );

  createTarget();

  updateHUD();
}


/*
 * Shoot with left mouse button.
 */
document.addEventListener(
  "mousedown",
  (event) => {
    if (
      event.button !== 0
    ) {
      return;
    }

    if (
      gameStarted &&
      !gamePaused &&
      !gameFinished
    ) {
      shoot();
    }
  },
);


/* =========================================================
   START GAME
========================================================= */

async function startGame(): Promise<void> {
  gameStarted = true;

  gamePaused = false;

  gameFinished = false;

  score = 0;

  hits = 0;

  shots = 0;

  remainingTime =
    GAME_DURATION;

  yaw = 0;

  pitch = 0;

  camera.position.set(
    0,
    1.7,
    0,
  );

  clearTargets();

  maintainTargets();

  startScreen.classList.add(
    "hidden",
  );

  pauseScreen.classList.add(
    "hidden",
  );

  gameOverScreen.classList.add(
    "hidden",
  );

  updateCamera();

  updateHUD();

  /*
   * Pointer Lock is requested because
   * Start was clicked by the user.
   */
  await lockMouse();
}


/* =========================================================
   PAUSE
========================================================= */

function pauseGame(): void {
  if (
    !gameStarted ||
    gameFinished
  ) {
    return;
  }

  gamePaused = true;

  pauseScreen.classList.remove(
    "hidden",
  );

  /*
   * DO NOT call exitPointerLock()
   * here.
   *
   * Pressing ESC itself already causes
   * browsers to release Pointer Lock.
   *
   * The CSS cursor remains hidden while
   * the pause menu is displayed.
   */
}


/* =========================================================
   RESUME
========================================================= */

async function resumeGame(): Promise<void> {
  if (
    !gameStarted ||
    gameFinished
  ) {
    return;
  }

  /*
   * Hide the menu first.
   */
  pauseScreen.classList.add(
    "hidden",
  );

  gamePaused = false;

  /*
   * The user has clicked the Resume
   * button, so this is a valid user
   * gesture for requesting Pointer Lock.
   */
  await lockMouse();
}


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key !==
      "Escape"
    ) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * Do not try to call preventDefault()
     * and do not try to immediately
     * request Pointer Lock here.
     *
     * Browsers intentionally allow ESC
     * to exit Pointer Lock.
     */
    if (
      gameStarted &&
      !gameFinished
    ) {
      if (!gamePaused) {
        pauseGame();
      }
    }
  },
);


/* =========================================================
   POINTER LOCK CHANGE
========================================================= */

document.addEventListener(
  "pointerlockchange",
  () => {
    const locked =
      document.pointerLockElement ===
      renderer.domElement;

    /*
     * When ESC is pressed, the browser
     * changes pointer lock to false.
     *
     * If we're playing, show the pause
     * screen.
     */
    if (
      gameStarted &&
      !gameFinished &&
      !gamePaused &&
      !locked
    ) {
      pauseGame();
    }
  },
);


/* =========================================================
   TIMER
========================================================= */

let lastGameTime =
  performance.now();


function updateGameTimer(
  deltaSeconds: number,
): void {
  if (
    !gameStarted ||
    gamePaused ||
    gameFinished
  ) {
    return;
  }

  remainingTime -=
    deltaSeconds;

  if (
    remainingTime <= 0
  ) {
    remainingTime = 0;

    finishGame();
  }

  timeElement.textContent =
    remainingTime.toFixed(1);
}


/* =========================================================
   GAME OVER
========================================================= */

function finishGame(): void {
  gameFinished = true;

  gamePaused = false;

  unlockMouse();

  const accuracy =
    shots > 0
      ? (hits / shots) * 100
      : 0;

  finalScoreElement.textContent =
    score.toString();

  finalAccuracyElement.textContent =
    `${accuracy.toFixed(1)}%`;

  gameOverScreen.classList.remove(
    "hidden",
  );
}


/* =========================================================
   HUD
========================================================= */

function updateHUD(): void {
  scoreElement.textContent =
    score.toString();

  hitsElement.textContent =
    hits.toString();

  shotsElement.textContent =
    shots.toString();

  const accuracy =
    shots > 0
      ? (hits / shots) * 100
      : 100;

  accuracyElement.textContent =
    `${accuracy.toFixed(1)}%`;

  timeElement.textContent =
    remainingTime.toFixed(1);
}


/* =========================================================
   FPS COUNTER
========================================================= */

let fpsFrames = 0;

let fpsTimer = 0;


function updateFPS(
  deltaSeconds: number,
): void {
  fpsFrames++;

  fpsTimer +=
    deltaSeconds;

  if (
    fpsTimer >= 0.5
  ) {
    const fps =
      fpsFrames /
      fpsTimer;

    fpsElement.textContent =
      Math.round(
        fps,
      ).toString();

    fpsFrames = 0;

    fpsTimer = 0;
  }
}


/* =========================================================
   TARGET MOVEMENT
========================================================= */

function updateTargets(
  deltaSeconds: number,
): void {
  /*
   * Limit the maximum simulation
   * delta to prevent large jumps.
   */
  const dt =
    Math.min(
      deltaSeconds,
      0.033,
    );

  for (
    const target of targets
  ) {
    target.mesh.position.addScaledVector(
      target.velocity,
      dt,
    );

    if (
      target.mesh.position.x >
        25 ||
      target.mesh.position.x <
        -25
    ) {
      target.velocity.x *=
        -1;
    }

    if (
      target.mesh.position.y >
        12 ||
      target.mesh.position.y <
        1.2
    ) {
      target.velocity.y *=
        -1;
    }
  }
}


/* =========================================================
   MAIN RENDER LOOP
========================================================= */

function animate(
  currentTime: number,
): void {
  requestAnimationFrame(
    animate,
  );

  const deltaSeconds =
    Math.min(
      (currentTime -
        lastGameTime) /
        1000,
      0.033,
    );

  lastGameTime =
    currentTime;

  updateCamera();

  updateGameTimer(
    deltaSeconds,
  );

  updateTargets(
    deltaSeconds,
  );

  updateFPS(
    deltaSeconds,
  );

  renderer.render(
    scene,
    camera,
  );
}


/* =========================================================
   RESIZE
========================================================= */

function handleResize(): void {
  const width =
    window.innerWidth;

  const height =
    window.innerHeight;

  camera.aspect =
    width / height;

  camera.updateProjectionMatrix();

  renderer.setSize(
    width,
    height,
    false,
  );

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio ||
        1,
      1.5,
    ),
  );
}


window.addEventListener(
  "resize",
  handleResize,
);


/* =========================================================
   BUTTONS
========================================================= */

startButton.addEventListener(
  "click",
  () => {
    void startGame();
  },
);


resumeButton.addEventListener(
  "click",
  () => {
    void resumeGame();
  },
);


restartButton.addEventListener(
  "click",
  () => {
    void startGame();
  },
);


/* =========================================================
   INITIALIZATION
========================================================= */

updateHUD();

maintainTargets();

animate(
  performance.now(),
);
