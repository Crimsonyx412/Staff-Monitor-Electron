const { contextBridge, ipcRenderer } = require('electron')
const activeWindow = require('active-win')

const electronHandler = {
  activeWindow: activeWindow,
  ipcRenderer: {
    send(channel, ...args) {
      ipcRenderer.send(channel, ...args)
    },
    on(channel, func) {
      const subscription = (...args) => func(...args)
      ipcRenderer.on(channel, subscription)
      return () => {
        ipcRenderer.removeListener(channel, subscription)
      }
    },
    off(channel, func) {
      const subscription = (...args) => func(...args)
      ipcRenderer.off(channel, subscription)
    },
    once(channel, func) {
      ipcRenderer.once(channel, func)
    },
  },
}

contextBridge.exposeInMainWorld('electron', electronHandler)
