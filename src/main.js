import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Seznam exponátů appka nikde needuje – při každém načtení galerie se
// zeptá lokálního serveru (electron/main.cjs), jaké .glb soubory právě
// leží ve složce "modely" vedle .exe. Přidání exponátu je tak jen
// zkopírování souboru, žádný JSON k úpravě.
let exhibits = [];
let modelyFolder = null;

// Po kolika ms nečinnosti v prohlížeči se galerie sama vrátí na přehled
// (aby byla připravená pro dalšího návštěvníka). Nastavte na 0 pro vypnutí.
const IDLE_RESET_MS = 120_000;

const galleryScreen = document.getElementById("gallery-screen");
const viewerScreen = document.getElementById("viewer-screen");
const galleryGrid = document.getElementById("gallery-grid");
const canvas = document.getElementById("viewer-canvas");
const loadingOverlay = document.getElementById("loading-overlay");
const loadingText = document.getElementById("loading-text");
const loadingProgress = document.getElementById("loading-progress");
const viewerTitle = document.getElementById("viewer-title");
const hint = document.getElementById("hint");

const btnBack = document.getElementById("btn-back");
const btnReset = document.getElementById("btn-reset");

let renderer, scene, camera, controls, currentModel;
let idleTimer = null;
let hintTimer = null;
let defaultCameraPos = new THREE.Vector3();
let defaultTarget = new THREE.Vector3();

function buildGallery() {
  galleryGrid.innerHTML = "";

  if (!exhibits.length) {
    const empty = document.createElement("div");
    empty.className = "empty-message";
    empty.textContent = "Zatím zde nejsou žádné exponáty.";
    galleryGrid.appendChild(empty);

    if (modelyFolder) {
      const hintMsg = document.createElement("div");
      hintMsg.className = "empty-message";
      hintMsg.style.fontSize = "14px";
      hintMsg.style.opacity = "0.7";
      hintMsg.style.whiteSpace = "pre-wrap";
      hintMsg.textContent = "Vložte soubory .glb do složky:\n" + modelyFolder;
      galleryGrid.appendChild(hintMsg);
    }
    return;
  }

  for (const exhibit of exhibits) {
    const card = document.createElement("div");
    card.className = "exhibit-card";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    thumb.textContent = "🗿";

    const body = document.createElement("div");
    body.className = "card-body";
    const title = document.createElement("h3");
    title.textContent = exhibit.name;
    body.appendChild(title);

    card.appendChild(thumb);
    card.appendChild(body);
    card.addEventListener("click", () => openExhibit(exhibit));
    galleryGrid.appendChild(card);
  }
}

function initViewerOnce() {
  if (renderer) return;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0f13);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.05,
    100
  );

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.3;
  controls.maxDistance = 20;
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };
  controls.addEventListener("start", registerActivity);

  window.addEventListener("resize", onResize);
  canvas.addEventListener("pointerdown", registerActivity);

  animate();
}

function onResize() {
  if (!renderer) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  if (!renderer || viewerScreen.classList.contains("hidden")) return;
  controls.update();
  renderer.render(scene, camera);
}

function clearModel() {
  if (currentModel) {
    scene.remove(currentModel);
    currentModel.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const materials = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        for (const mat of materials) {
          for (const key in mat) {
            if (mat[key] && mat[key].isTexture) mat[key].dispose();
          }
          mat.dispose();
        }
      }
    });
    currentModel = null;
  }
}

const loader = new GLTFLoader();

function openExhibit(exhibit) {
  galleryScreen.classList.add("hidden");
  viewerScreen.classList.remove("hidden");
  initViewerOnce();
  onResize();
  clearModel();

  viewerTitle.textContent = exhibit.name;

  loadingOverlay.classList.remove("hidden");
  loadingProgress.style.width = "0%";
  loadingText.textContent = "Načítání modelu…";

  hint.classList.remove("faded");
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hint.classList.add("faded"), 6000);

  loader.load(
    exhibit.model,
    (gltf) => {
      currentModel = gltf.scene;
      frameModel(currentModel);
      scene.add(currentModel);
      loadingOverlay.classList.add("hidden");
      registerActivity();
    },
    (xhr) => {
      if (xhr.total) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        loadingProgress.style.width = pct + "%";
      }
    },
    (error) => {
      console.error("Chyba při načítání modelu:", error);
      loadingText.textContent = "Model se nepodařilo načíst.";
    }
  );
}

function frameModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  model.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const distance = maxDim * 2.2;

  camera.position.set(distance * 0.6, distance * 0.45, distance * 0.8);
  camera.near = maxDim / 100;
  camera.far = maxDim * 100;
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  controls.update();

  defaultCameraPos.copy(camera.position);
  defaultTarget.copy(controls.target);
}

function resetView() {
  camera.position.copy(defaultCameraPos);
  controls.target.copy(defaultTarget);
  controls.update();
  registerActivity();
}

function closeViewer() {
  clearModel();
  viewerScreen.classList.add("hidden");
  galleryScreen.classList.remove("hidden");
  clearTimeout(idleTimer);
}

function registerActivity() {
  if (IDLE_RESET_MS <= 0) return;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(closeViewer, IDLE_RESET_MS);
}

btnBack.addEventListener("click", closeViewer);
btnReset.addEventListener("click", resetView);

loadExhibits();

async function loadExhibits() {
  galleryGrid.innerHTML = '<div class="empty-message">Načítání seznamu exponátů…</div>';
  try {
    const res = await fetch(`api/exhibits?v=${Date.now()}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    exhibits = data.exhibits || [];
    modelyFolder = data.folder || null;
  } catch (err) {
    console.error("Nepodařilo se načíst seznam exponátů:", err);
    exhibits = [];
    modelyFolder = null;
  }
  buildGallery();
}
