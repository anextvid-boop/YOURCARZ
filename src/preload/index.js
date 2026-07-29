const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Database & Inventory API
  getListings: () => ipcRenderer.invoke('db:getListings'),
  addListing: (listing) => ipcRenderer.invoke('db:addListing', listing),
  updateListing: (id, updates) => ipcRenderer.invoke('db:updateListing', id, updates),
  deleteListing: (id) => ipcRenderer.invoke('db:deleteListing', id),
  unlockListing: (id) => ipcRenderer.invoke('db:unlockListing', id),
  
  // 24-Hr Sync API
  triggerSync: () => ipcRenderer.invoke('db:triggerSync'),
  getSyncStatus: () => ipcRenderer.invoke('db:getSyncStatus'),

  // Leads & CRM API
  getLeads: () => ipcRenderer.invoke('db:getLeads'),
  updateLeadStatus: (leadId, newStatus) => ipcRenderer.invoke('db:updateLeadStatus', leadId, newStatus),

  // Scraper API
  parseListing: (url) => ipcRenderer.invoke('scraper:parseListing', url),
  scanRegionDeals: (region, maxBudget) => ipcRenderer.invoke('scraper:scanRegionDeals', region, maxBudget),

  // System & Settings API
  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  saveSettings: (settings) => ipcRenderer.invoke('db:saveSettings', settings),
  openExternal: (url) => ipcRenderer.invoke('sys:openExternal', url)
});
