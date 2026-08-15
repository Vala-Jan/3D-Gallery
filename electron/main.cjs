const { app, BrowserWindow } = require("electron");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = 8080;

// V zabalené appce (.exe) leží spustitelný soubor a vedle něj i tato složka
// resources/app – tam je vestavěný obsah appky (dist/, vytvořené přes `npm run build`).
// Editovatelný obsah (seznam exponátů a modely) je záměrně MIMO resources,
// v jednoduše dostupné složce "exponaty" vedle .exe, aby personál nemusel
// sahat do vnitřních souborů appky.
const isPackaged = app.isPackaged;
const appRoot = isPackaged ? path.join(process.resourcesPath, "app") : path.join(__dirname, "..");
const distDir = path.join(appRoot, "dist");
const exponatyDir = isPackaged
  ? path.join(path.dirname(process.execPath), "exponaty")
  : path.join(__dirname, "..", "exponaty-dev");

fs.mkdirSync(path.join(exponatyDir, "models", "thumbnails"), { recursive: true });

const defaultExhibitsPath = path.join(exponatyDir, "exhibits.json");
if (!fs.existsSync(defaultExhibitsPath)) {
  fs.writeFileSync(defaultExhibitsPath, "[]\n", "utf-8");
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
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

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = req.url.split("?")[0];

    // Diagnostická informace pro appku (a pro ladění) – kam přesně appka
    // sahá pro exhibits.json/modely, a jestli tam skutečně něco najde.
    if (urlPath === "/__status") {
      const exhibitsPath = path.join(exponatyDir, "exhibits.json");
      let exhibitsInfo;
      try {
        const raw = fs.readFileSync(exhibitsPath, "utf-8");
        try {
          const parsed = JSON.parse(raw);
          exhibitsInfo = { readable: true, validJson: true, count: Array.isArray(parsed) ? parsed.length : null };
        } catch (parseErr) {
          exhibitsInfo = { readable: true, validJson: false, parseError: parseErr.message, rawPreview: raw.slice(0, 200) };
        }
      } catch (readErr) {
        exhibitsInfo = { readable: false, error: readErr.message };
      }
      let modelFiles = [];
      try {
        modelFiles = fs.readdirSync(path.join(exponatyDir, "models"));
      } catch {}
      const body = JSON.stringify({ exponatyDir, exhibitsPath, exhibitsInfo, modelFiles }, null, 2);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(body);
    }

    // Editovatelný obsah (exponáty) se servíruje ze složky vedle .exe,
    // zbytek (appka samotná) z vnitřní dist/ složky.
    if (urlPath === "/exhibits.json") {
      return serveFile(res, path.join(exponatyDir, "exhibits.json"));
    }
    if (urlPath.startsWith("/models/")) {
      const filePath = safeJoin(exponatyDir, urlPath);
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
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

let mainWindow;

async function createWindow() {
  await startServer();

  mainWindow = new BrowserWindow({
    kiosk: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
  mainWindow.loadURL(`http://127.0.0.1:${PORT}/`);

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
