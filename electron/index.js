const { app, BrowserWindow } = require('electron');
const path = require('path');
require('electron-reload')(__dirname);

let win;
function createWindow() {
	win = new BrowserWindow({
		width: 1366,
		height: 768,
		webPreferences: {
			preload: path.resolve(app.getAppPath(), 'preload.js'),
			devTools: true,
			nodeIntegration: false,
			contextIsolation: true,
		},
	});
	win.loadFile('index.html');
}

app.whenReady().then(() => {
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
