const { contextBridge, ipcRenderer } = require("electron");



contextBridge.exposeInMainWorld("clipflow", {
    getClipboardText: () => 
        ipcRenderer.invoke("clipboard:get"),
    writeClipboardText: (text) =>
        ipcRenderer.invoke("clipboard:write", text),
    loadHistory: () =>
        ipcRenderer.invoke("history:load"),
    saveHistory: (history) =>
        ipcRenderer.invoke("history:save", history)
});