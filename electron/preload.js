
const fs = require('fs');
const path = require('path');
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  gameData: {
    getSystemBodies() {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'gamedata', 'bodies.json')).toString());
    },
  },
  filesAPI: {
    sendEmails(content) {
      ipcRenderer.send('save-delete', content);
    },
  },
});

console.log('preload loaded');
