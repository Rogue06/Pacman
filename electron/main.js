const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const Store = require("electron-store");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

// Configuration persistante
const store = new Store();

let mainWindow;

function createWindow() {
  // Créer la fenêtre principale
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    resizable: false,
    fullscreenable: false,
    icon: path.join(__dirname, "../assets/icons/png/icon.png"),
  });

  // Charger l'application
  if (isDev) {
    mainWindow.loadURL("http://localhost:9001");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Gestion des mises à jour automatiques
  autoUpdater.checkForUpdatesAndNotify();
}

// Créer la fenêtre quand Electron est prêt
app.whenReady().then(createWindow);

// Quitter quand toutes les fenêtres sont fermées
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Gestion des mises à jour
autoUpdater.on("update-available", () => {
  mainWindow.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
  mainWindow.webContents.send("update_downloaded");
});

// IPC pour les scores et configurations
ipcMain.on("save-highscore", (event, score) => {
  store.set("highscore", score);
});

ipcMain.on("load-highscore", (event) => {
  event.reply("highscore-loaded", store.get("highscore", 0));
});

ipcMain.on("save-settings", (event, settings) => {
  store.set("settings", settings);
});

ipcMain.on("load-settings", (event) => {
  event.reply("settings-loaded", store.get("settings", {}));
});

// Gestion des erreurs
process.on("uncaughtException", (error) => {
  console.error("Erreur non gérée:", error);
});

// Fonctions de développement
if (isDev) {
  app.on("ready", () => {
    const {
      default: installExtension,
      REDUX_DEVTOOLS,
    } = require("electron-devtools-installer");

    installExtension(REDUX_DEVTOOLS)
      .then((name) => console.log(`Extension ajoutée: ${name}`))
      .catch((err) =>
        console.log("Erreur lors de l'installation des extensions:", err)
      );
  });
}
