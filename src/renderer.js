import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("clipflow", {
    getClipboardText: () => ipcRenderer.invoke("clipboard:get")
});