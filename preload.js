const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getState: () => ipcRenderer.invoke('get-state'),
  onState: (callback) => ipcRenderer.on('state', (_event, state) => callback(state)),
  toggleActive: () => ipcRenderer.send('toggle-active'),
  collapse: () => ipcRenderer.send('collapse'),
  expand: () => ipcRenderer.send('expand'),
  quit: () => ipcRenderer.send('quit'),
});
