const {app, BrowserWindow, ipcMain, globalShortcut} = require('electron')
const Store = require('electron-store');
const gotTheLock = app.requestSingleInstanceLock();
const store = new Store({defaults: {'hotkeyMute': "Ctrl+M"}});

//Init Electron App
let mainWindow;

if (!gotTheLock) {
  app.quit();
} else {

  function createWindow() {
    mainWindow = new BrowserWindow({
      resizable: true,
      fullscreenable: false,
      width: 500,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      },
      title: "RocketLink " + app.getVersion(),
      icon: __dirname + "/../icon.ico"
    });
    

    globalShortcut.register('Ctrl+Shift+I', () => {
      mainWindow.webContents.openDevTools();
    });

    //Makes this hotkey easier to config
    globalShortcut.register(store.get('hotkeyMute').toString(), () => {
      mainWindow.webContents.executeJavaScript(`import('./index.js').then(m => m.toggleMute());`);
    });

    mainWindow.loadFile('app/index.html');
    mainWindow.setMenu(null);
  }

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })

}