import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// exhibits.json se načítá za běhu (ne při sestavení), aby šlo exponáty
// přidávat/upravovat přímo ve složce dist/ bez nutnosti dělat nový build.
let exhibits = [];

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
const infoPanel = document.getElementById("info-panel");
const infoName = document.getElementById("info-name");
const infoMeta = document.getElementById("info-meta");
const infoDescription = document.getElementById("info-description");
const hint = document.getElementById("hint");

const btnBack = document.getElementById("btn-back");
const btnInfo = document.getElementById("btn-info");
const btnReset = document.getElementById("btn-reset");

let renderer, scene, camera, controls, currentModel;
let idleTimer = null;
let hintTimer = null;
let defaultCameraPos = new THREE.Vector3();
let defaultTarget = new THREE.Vector3();

// V Electron (.exe) verzi appka běží přes lokální server, který umí
// prozradit, kde přesně na disku hledá exponaty/exhibits.json a co v té
// složce skutečně našel – užitečné pro ladění, proč se nic nezobrazuje.
// Webová (ne-Electron) verze nemá /__status endpoint, fetch tam prostě selže a nic se nepřidá.
async function appendDiagnostics(container) {
  try {
    const res = await fetch("__status");
    if (!res.ok) return;
    const status = await res.json();
    const debug = document.createElement("pre");
    debug.className = "empty-message";
    debug.style.textAlign = "left";
    debug.style.fontSize = "12px";
    debug.style.whiteSpace = "pre-wrap";
    debug.style.opacity = "0.7";
    debug.textContent = "Diagnostika:\n" + JSON.stringify(status, null, 2);
    container.appendChild(debug);
  } catch {
    // Webová verze bez /__status – v pořádku, nic se nezobrazí.
  }
}

async function buildGallery() {
  galleryGrid.innerHTML = "";

  if (!exhibits.length) {
    const empty = document.createElement("div");
    empty.className = "empty-message";
    empty.textContent =
      "Zatím zde nejsou žádné exponáty. Přidejte je podle návodu v README.md.";
    galleryGrid.appendChild(empty);
    await appendDiagnostics(galleryGrid);
    return;
  }

  for (const exhibit of exhibits) {
    const card = document.createElement("div");
    card.className = "exhibit-card";

    const thumb = document.createElement("div");
    thumb.className = "thumb";
    if (exhibit.thumbnail) {
      const img = document.createElement("img");
      img.src = exhibit.thumbnail;
      img.alt = exhibit.name;
      thumb.appendChild(img);
    } else {
      thumb.textContent = "🗿";
    }

    const body = document.createElement("div");
    body.className = "card-body";
    const title = document.createElement("h3");
    title.textContent = exhibit.name;
    const period = document.createElement("p");
    period.textContent = exhibit.period || "";
    body.appendChild(title);
    body.appendChild(period);

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

  infoName.textContent = exhibit.name;
  infoDescription.textContent = exhibit.description || "";
  infoMeta.innerHTML = "";
  const metaFields = [
    ["Autor / původ", exhibit.author],
    ["Období", exhibit.period],
    ["Materiál", exhibit.material],
  ];
  for (const [label, value] of metaFields) {
    if (!value) continue;
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    infoMeta.appendChild(dt);
    infoMeta.appendChild(dd);
  }
  infoPanel.classList.add("hidden");

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
      frameModel(currentModel, exhibit.cameraDistance);
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
      loadingText.textContent =
        "Model se nepodařilo načíst. Zkontrolujte soubor v exhibits.json.";
    }
  );
}

function frameModel(model, preferredDistance) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  model.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const distance = preferredDistance || maxDim * 2.2;

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
btnInfo.addEventListener("click", () => {
  infoPanel.classList.toggle("hidden");
  registerActivity();
});
btnReset.addEventListener("click", resetView);

loadExhibits();

async function loadExhibits() {
  galleryGrid.innerHTML = '<div class="empty-message">Načítání seznamu exponátů…</div>';
  try {
    const res = await fetch(`exhibits.json?v=${Date.now()}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    exhibits = await res.json();
  } catch (err) {
    console.error("Nepodařilo se načíst exhibits.json:", err);
    galleryGrid.innerHTML =
      '<div class="empty-message">Nepodařilo se načíst seznam exponátů (exhibits.json). ' +
      "Zkontrolujte, že soubor existuje a je to platný JSON, a že galerii spouštíte přes " +
      "spustit-galerii.bat / 3D Galerie.exe, ne dvojklikem na index.html.</div>";
    await appendDiagnostics(galleryGrid);
    return;
  }
  buildGallery();
}
