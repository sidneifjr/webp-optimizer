const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getState: () => ipcRenderer.invoke('get-state'),
  onState: (callback) => ipcRenderer.on('state', (_event, state) => callback(state)),

  getHistory: () => ipcRenderer.invoke('get-history'),
  onHistory: (callback) => ipcRenderer.on('history', (_event, items) => callback(items)),
  clearHistory: () => ipcRenderer.send('clear-history'),

  toggleActive: () => ipcRenderer.send('toggle-active'),
  collapse: () => ipcRenderer.send('collapse'),
  expand: () => ipcRenderer.send('expand'),
  quit: () => ipcRenderer.send('quit'),
});
