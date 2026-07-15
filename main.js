import { app, BrowserWindow, clipboard, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow(){
    const window = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 700,
        minHeight: 500,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    window.loadFile(path.join(__dirname, "src", "index.html"));
}

ipcMain.handle("clipboard:get", () => {
    return clipboard.readText();
});

ipcMain.handle("clipboard:write", (_event, text) => {
    if(typeof text !== "string"){
        throw new TypeError("Clipboard must be a string.");
    }

    clipboard.writeText(text);
});

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});