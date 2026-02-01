const { app, BrowserWindow } = require("electron");

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
    webPreferences: {
      contextIsolation: true
    }
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
