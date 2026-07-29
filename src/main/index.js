const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const db = require('./db');
const scraper = require('./scraper');

let mainWindow = null;

function createWindow() {
  const preloadPath = path.join(__dirname, '../preload/index.js');
  const htmlPath = path.join(__dirname, '../renderer/index.html');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'YOURCARZ - AI Car Marketplace & Listing Aggregator',
    backgroundColor: '#0a0d14',
    show: false, // Explicit window lifecycle: hide until ready-to-show
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(htmlPath);

  // Ready to show event ensures smooth visual appearance without flashing white screen
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle external links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// macOS App Lifecycle Setup
app.whenReady().then(() => {
  setupIpcHandlers();
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

// IPC Handler Registrations
function setupIpcHandlers() {
  ipcMain.handle('db:getListings', () => db.getListings());
  ipcMain.handle('db:addListing', (_, listing) => db.addListing(listing));
  ipcMain.handle('db:updateListing', (_, id, updates) => db.updateListing(id, updates));
  ipcMain.handle('db:deleteListing', (_, id) => db.deleteListing(id));
  ipcMain.handle('db:unlockListing', (_, id) => db.unlockListing(id));

  ipcMain.handle('db:triggerSync', () => db.triggerSync());
  ipcMain.handle('db:getSyncStatus', () => db.getSyncStatus());

  ipcMain.handle('db:getLeads', () => db.getLeads());
  ipcMain.handle('db:updateLeadStatus', (_, leadId, newStatus) => db.updateLeadStatus(leadId, newStatus));

  ipcMain.handle('scraper:parseListing', (_, url) => scraper.parseListing(url));
  ipcMain.handle('scraper:scanRegionDeals', (_, region, maxBudget) => scraper.scanRegionDeals(region, maxBudget));

  ipcMain.handle('db:getSettings', () => db.getSettings());
  ipcMain.handle('db:saveSettings', (_, settings) => db.saveSettings(settings));

  ipcMain.handle('sys:openExternal', (_, url) => shell.openExternal(url));
}
