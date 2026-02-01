const { app, BrowserWindow, Tray, Menu } = require("electron");
const path = require("path");
let tray = null;

function createWindow() {
  const win = new BrowserWindow({
    title: "Pastel Song Player",
    width: 214,
    height: 310,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false, 
    transparent: true,
    background: "#00000000",
    icon: path.join(__dirname, "assets", "SoulSync.ico"),
    webPreferences: {
      contextIsolation: true
    }
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();

  const iconPath = path.join(__dirname, "assets", "SoulSync.ico");
  tray = new Tray(iconPath);
  const menuTemplate = [
    {
      label: "Quit",
      click: () => {
        app.quit();
      }
    }
  ];
  const trayMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(trayMenu);
  tray.setToolTip("SoulSync");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
