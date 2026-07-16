import { app, BrowserWindow, clipboard, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Store from "electron-store";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store({
    defaults: {
        history: []
    }
});



function createWindow(){
    const window = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 700,
        minHeight: 500,

        icon: path.join(__dirname, "assets", "icon.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    window.setMenuBarVisibility(false);
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


ipcMain.handle("history:load", () => {
    return store.get("history");
});

ipcMain.handle("history:save", (_event, history) => {
    if (!Array.isArray(history)){
        throw new TypeError("History must be an array.");
    }

    store.set("history", history);
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