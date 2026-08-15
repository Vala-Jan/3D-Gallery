const { app, BrowserWindow, dialog } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// V zabalené appce (.exe) leží spustitelný soubor a vedle něj i tato složka
// resources/app – tam je vestavěný obsah appky (dist/, vytvořené přes `npm run build`).
// Exponáty (.glb soubory) se berou ze složky "modely" vedle .exe – appka ji
// při každém zobrazení galerie znovu prohledá, žádný seznam/JSON se nikde
// neudržuje. Přidání exponátu = zkopírovat .glb soubor do téhle složky.
const isPackaged = app.isPackaged;
const appRoot = isPackaged ? path.join(process.resourcesPath, "app") : path.join(__dirname, "..");
const distDir = path.join(appRoot, "dist");
const modelyDir = isPackaged
  ? path.join(path.dirname(process.execPath), "modely")
  : path.join(__dirname, "..", "modely-dev");

const modelyDirExisted = fs.existsSync(modelyDir);
fs.mkdirSync(modelyDir, { recursive: true });

if (!modelyDirExisted) {
  // První spuštění – nasejeme pár ukázkových modelů, ať je hned vidět, že appka funguje.
  const demoSrcDir = path.join(__dirname, "demo-models");
  try {
    for (const file of fs.readdirSync(demoSrcDir)) {
      fs.copyFileSync(path.join(demoSrcDir, file), path.join(modelyDir, file));
    }
  } catch {
    // Demo modely nejsou k dispozici (např. při vývoji) – nevadí, složka zůstane prázdná.
  }
}

const MODEL_EXTENSIONS = new Set([".glb", ".gltf"]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const full = path.normalize(path.join(root, decoded));
  if (!full.startsWith(path.normalize(root))) return null;
  return full;
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

// Prohledá složku "modely" a z názvů souborů (bez přípony) sestaví seznam
// exponátů – žádné ruční popisky, žádný JSON k rozbití.
function listExhibits() {
  let entries = [];
  try {
    entries = fs
      .readdirSync(modelyDir, { withFileTypes: true })
      .filter((e) => e.isFile() && MODEL_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, "cs"));
  } catch {
    entries = [];
  }
  return entries.map((filename) => ({
    id: filename,
    name: path.parse(filename).name,
    model: "modely/" + encodeURIComponent(filename),
  }));
}

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = req.url.split("?")[0];

    if (urlPath === "/api/exhibits") {
      const body = JSON.stringify({ folder: modelyDir, exhibits: listExhibits() });
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(body);
    }

    if (urlPath.startsWith("/modely/")) {
      const filePath = safeJoin(modelyDir, urlPath.slice("/modely".length));
      if (!filePath) {
        res.writeHead(403);
        return res.end("Forbidden");
      }
      return serveFile(res, filePath);
    }

    const requestPath = urlPath === "/" ? "/index.html" : urlPath;
    const filePath = safeJoin(distDir, requestPath);
    if (!filePath) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    serveFile(res, filePath);
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    // Port 0 = necháme operační systém vybrat volný port, ať appka nikdy
    // nekoliduje s ničím jiným, co by případně běželo na pevném portu.
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

let mainWindow;

async function createWindow() {
  let server;
  try {
    server = await startServer();
  } catch (err) {
    dialog.showErrorBox(
      "3D Galerie – chyba serveru",
      "Nepodařilo se spustit vestavěný lokální server:\n\n" + err.message
    );
    app.quit();
    return;
  }
  const port = server.address().port;

  mainWindow = new BrowserWindow({
    kiosk: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
  mainWindow.loadURL(`http://127.0.0.1:${port}/`);

  // Ctrl+Shift+Q ukončí kiosek (pro personál).
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === "q") {
      app.quit();
    }
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});
