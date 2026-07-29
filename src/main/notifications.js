/**
 * YOURCARZ Automated Saved Search Alert & Notification Dispatch Engine
 */

const db = require('./db');

class NotificationService {
  /**
   * Evaluates new vehicle listings against active saved buyer search criteria
   */
  evaluateSavedSearchAlerts(newListing) {
    const savedSearches = db.getSavedSearches();
    if (!savedSearches || savedSearches.length === 0) return [];

    const matchedSearches = [];

    savedSearches.forEach(search => {
      if (!search.alertsEnabled) return;

      const queryLower = (search.query || '').toLowerCase().trim();
      const listingTitle = (newListing.title || '').toLowerCase();
      const listingMake = (newListing.make || '').toLowerCase();

      const matchesQuery = !queryLower || listingTitle.includes(queryLower) || listingMake.includes(queryLower);
      const matchesPrice = !search.maxPrice || newListing.priceScraped <= search.maxPrice;

      if (matchesQuery && matchesPrice) {
        matchedSearches.push({
          searchId: search.id,
          searchName: search.name,
          listingId: newListing.id,
          listingTitle: newListing.title,
          priceScraped: newListing.priceScraped,
          matchedAt: new Date().toISOString()
        });
      }
    });

    if (matchedSearches.length > 0) {
      console.log(`[NOTIFICATIONS] Listing '${newListing.title}' matched ${matchedSearches.length} saved buyer search alerts!`);
    }

    return matchedSearches;
  }
}

module.exports = new NotificationService();
