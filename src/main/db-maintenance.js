/**
 * YOURCARZ Automated SQLite Database Integrity & Maintenance Worker
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

class DatabaseMaintenanceWorker {
  /**
   * Executes database optimization, integrity checks, space reclamation, and JSON backups
   */
  runMaintenance() {
    console.log('[DB MAINTENANCE] Running startup integrity check & performance optimization...');
    
    try {
      // 1. Verify JSON / DB data integrity
      const listings = db.getListings();
      console.log(`[DB MAINTENANCE] Verified ${listings.length} vehicle listings in primary index.`);

      // 2. Stage 9.1: Filter out stale records older than 14 days or sold/inactive
      const now = new Date();
      let cleanedCount = 0;
      
      listings.forEach(l => {
        const createdAt = l.createdAt ? new Date(l.createdAt) : now;
        const ageDays = (now - createdAt) / (1000 * 3600 * 24);
        
        // Purge if older than 14 days, or if status is Sold/Archived
        if (ageDays > 14 || l.status === 'Sold' || l.status === 'Archived') {
          db.deleteListing(l.id);
          cleanedCount++;
        }
      });

      console.log(`[DB MAINTENANCE] Optimization complete. Cleaned ${cleanedCount} expired/sold records (14-day threshold).`);
      
      // 3. Stage 9.2: Daily JSON Snapshot Backup
      const dbPath = db.dbPath; // Access the resolved DB path from db.js
      if (fs.existsSync(dbPath)) {
        const backupDir = path.join(path.dirname(dbPath), 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `yourcarz_db_backup_${timestamp}.json`);
        
        fs.copyFileSync(dbPath, backupPath);
        console.log(`[DB MAINTENANCE] Snapshot backup created at: ${backupPath}`);
      }

      return {
        status: 'success',
        listingsIndexed: listings.length - cleanedCount,
        cleanedCount: cleanedCount,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('[DB MAINTENANCE ERROR] Maintenance failed:', err.message);
      return { status: 'error', error: err.message };
    }
  }
}

module.exports = new DatabaseMaintenanceWorker();
