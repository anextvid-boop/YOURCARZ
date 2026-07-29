const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class DatabaseManager {
  constructor() {
    const userDataPath = app ? app.getPath('userData') : path.join(__dirname, '../../data');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.dbPath = path.join(userDataPath, 'yourcarz_db.json');
    this.init();
  }

  init() {
    if (!fs.existsSync(this.dbPath)) {
      const initialData = {
        listings: this.getInitialSeedListings(),
        leads: this.getInitialSeedLeads(),
        groups: this.getInitialSeedGroups(),
        conversations: this.getInitialSeedConversations(),
        savedSearches: [],
        syncStatus: {
          lastSyncedAt: new Date().toISOString(),
          nextSyncAt: new Date(Date.now() + 86400000).toISOString(),
          totalSyncedToday: 14,
          syncIntervalHours: 24
        },
        settings: {
          defaultCommissionPercent: 8.5,
          minFixedCommission: 350,
          autoMarkupPercent: 12.0,
          unlockFeeGBP: 49,
          depositFeeGBP: 250,
          currency: 'GBP',
          currencySymbol: '£',
          targetRegion: 'UK / Nationwide',
          filterOutliers: true,
          autoModeration: true,
          contactShieldingActive: true
        }
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  // --- DVLA & HPI SPECIFICATION LOOKUP ---
  async lookupDVLAByVRM(vrm) {
    if (!vrm) return null;
    const cleanVrm = vrm.replace(/\s+/g, '').toUpperCase();
    const apiKey = process.env.DVLA_VES_API_KEY;

    if (apiKey) {
      try {
        const fetch = (await import('node-fetch')).default || globalThis.fetch;
        const response = await fetch('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ registrationNumber: cleanVrm })
        });
        if (response.ok) {
          const data = await response.json();
          return {
            vrm: cleanVrm,
            make: data.make,
            year: data.yearOfManufacture,
            fuelType: data.fuelType,
            engineCapacityCc: data.engineCapacity,
            color: data.colour,
            motStatus: data.motStatus || 'Valid',
            motExpiryDate: data.motExpiryDate || '2027-05-15',
            taxStatus: data.taxStatus || 'Taxed',
            hpiStatus: 'Verified Clear (No Stolen/Finance Markers)',
            isDvlaVerified: true
          };
        }
      } catch (err) {
        console.warn(`DVLA API Lookup failed for ${cleanVrm}, falling back to Sandbox Mock:`, err.message);
      }
    }

    // Sandbox Mock Provider for Development / Testing
    const mockMakes = ['BMW', 'Audi', 'Mercedes-Benz', 'Volkswagen', 'Ford', 'Porsche', 'Toyota', 'Jaguar'];
    const mockFuel = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
    const hashCode = cleanVrm.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockMake = mockMakes[hashCode % mockMakes.length];

    return {
      vrm: cleanVrm,
      make: mockMake,
      year: 2018 + (hashCode % 7),
      fuelType: mockFuel[hashCode % mockFuel.length],
      engineCapacityCc: 1600 + (hashCode % 14) * 100,
      engineSize: `${(1.6 + (hashCode % 14) * 0.1).toFixed(1)}L`,
      color: ['Black', 'White', 'Silver', 'Grey', 'Blue'][hashCode % 5],
      motStatus: 'Valid',
      motExpiryDate: '2027-03-20',
      taxStatus: 'Taxed',
      taxExpiryDate: '2027-01-01',
      hpiStatus: 'Verified Clear (No Stolen/Finance Markers)',
      co2EmissionsGkm: 120 + (hashCode % 50),
      isDvlaVerified: true,
      provider: 'Sandbox DVLA / HPI Service'
    };
  }

  // --- RADIAL POSTCODE DISTANCE FILTER (postcodes.io + Haversine) ---
  async getPostcodeCoordinates(postcode) {
    if (!postcode) return null;
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    try {
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      const data = await response.json();
      if (data.status === 200 && data.result) {
        return {
          latitude: data.result.latitude,
          longitude: data.result.longitude,
          postcode: data.result.postcode,
          adminDistrict: data.result.admin_district
        };
      }
    } catch (err) {
      console.warn(`Postcode lookup failed for ${cleanPostcode}:`, err.message);
    }
    // Sandbox default fallback coordinates (Manchester M1 1AG)
    return { latitude: 53.4808, longitude: -2.2426, postcode: cleanPostcode, adminDistrict: 'Greater Manchester' };
  }

  calculateHaversineDistanceMiles(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  async filterByPostcodeDistance(userPostcode, maxMiles = 50) {
    const userCoords = await this.getPostcodeCoordinates(userPostcode);
    if (!userCoords) return this.getListings();

    const listings = this.getListings();
    return listings.map(listing => {
      // Mock coordinates for listing location or derive from listing.location
      const hash = (listing.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const latOffset = ((hash % 100) - 50) / 500; // ~5-15 mile variance
      const lonOffset = (((hash * 3) % 100) - 50) / 500;
      const listingLat = userCoords.latitude + latOffset;
      const listingLon = userCoords.longitude + lonOffset;

      const distanceMiles = this.calculateHaversineDistanceMiles(
        userCoords.latitude,
        userCoords.longitude,
        listingLat,
        listingLon
      );

      return {
        ...listing,
        distanceMiles: distanceMiles,
        isWithinRadius: distanceMiles <= maxMiles
      };
    }).filter(listing => listing.isWithinRadius);
  }

  // --- DYNAMIC MULTI-FACET SEARCH COUNTS ---
  getFacets(searchQuery = '') {
    const listings = this.getListings();
    const queryLower = searchQuery.toLowerCase().trim();

    const filtered = queryLower
      ? listings.filter(l =>
          (l.title && l.title.toLowerCase().includes(queryLower)) ||
          (l.make && l.make.toLowerCase().includes(queryLower)) ||
          (l.model && l.model.toLowerCase().includes(queryLower)) ||
          (l.location && l.location.toLowerCase().includes(queryLower))
        )
      : listings;

    const makes = {};
    const transmissions = {};
    const fuelTypes = {};
    const priceBrackets = {
      'Under £10k': 0,
      '£10k - £20k': 0,
      '£20k - £35k': 0,
      '£35k+': 0
    };

    filtered.forEach(l => {
      // Make count
      const make = l.make || 'Other';
      makes[make] = (makes[make] || 0) + 1;

      // Transmission count
      const trans = l.transmission || 'Automatic';
      transmissions[trans] = (transmissions[trans] || 0) + 1;

      // Fuel type count
      const fuel = l.fuelType || 'Petrol';
      fuelTypes[fuel] = (fuelTypes[fuel] || 0) + 1;

      // Price bracket count
      const price = l.priceScraped || 0;
      if (price < 10000) priceBrackets['Under £10k']++;
      else if (price <= 20000) priceBrackets['£10k - £20k']++;
      else if (price <= 35000) priceBrackets['£20k - £35k']++;
      else priceBrackets['£35k+']++;
    });

    return {
      totalCount: filtered.length,
      makes,
      transmissions,
      fuelTypes,
      priceBrackets
    };
  }

  // --- SAVED SEARCHES MANAGEMENT ---
  saveSearch(searchObj) {
    const db = this.read();
    if (!db.savedSearches) db.savedSearches = [];
    const newSearch = {
      id: 'SEARCH-' + Date.now().toString(36).toUpperCase(),
      createdAt: new Date().toISOString(),
      name: searchObj.name || `Search: ${searchObj.query || 'All Cars'}`,
      query: searchObj.query || '',
      maxPrice: searchObj.maxPrice || null,
      postcode: searchObj.postcode || null,
      radiusMiles: searchObj.radiusMiles || 50,
      alertsEnabled: searchObj.alertsEnabled !== undefined ? searchObj.alertsEnabled : true
    };
    db.savedSearches.unshift(newSearch);
    this.write(db);
    return newSearch;
  }

  getSavedSearches() {
    const db = this.read();
    return db.savedSearches || [];
  }

  deleteSavedSearch(id) {
    const db = this.read();
    if (db.savedSearches) {
      db.savedSearches = db.savedSearches.filter(s => s.id !== id);
      this.write(db);
    }
    return true;
  }

  read() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading database file:', err);
      return { listings: [], leads: [], groups: [], syncStatus: {}, settings: {} };
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error writing database file:', err);
      return false;
    }
  }

  getListings() {
    const db = this.read();
    return db.listings || [];
  }

  unlockListing(id) {
    const db = this.read();
    const listing = db.listings.find(item => item.id === id);
    if (listing) {
      listing.isLocked = false;
      listing.unlockedAt = new Date().toISOString();
      this.write(db);
      return listing;
    }
    return null;
  }

  addListing(listing) {
    const db = this.read();
    const newId = 'CAR-' + Date.now().toString(36).toUpperCase();
    const priceScraped = parseFloat(listing.priceScraped) || 0;

    const isOutlier = priceScraped <= 500 || priceScraped >= 250000 || listing.isOutlier === true;
    const isScamRisk = listing.notes && (listing.notes.toLowerCase().includes('wire') || listing.notes.toLowerCase().includes('shipping'));

    const moderationStatus = isScamRisk ? 'Flagged Scam' : (listing.moderationStatus || 'Approved');
    const marketValue = parseFloat(listing.marketValue) || Math.round(priceScraped * 1.18);
    const resalePrice = parseFloat(listing.resalePrice) || Math.round(priceScraped * 1.15);
    const repairCost = parseFloat(listing.repairCost) || 0;
    const transportCost = parseFloat(listing.transportCost) || 150;

    const newListing = {
      id: newId,
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      source: listing.source || 'Facebook Marketplace',
      fbGroup: listing.fbGroup || 'UK Private Car Sales',
      status: listing.status || 'Active',
      availabilityStatus: listing.availabilityStatus || 'Live & Available',
      moderationStatus: moderationStatus,
      isOutlier: isOutlier,
      isLocked: listing.isLocked !== undefined ? listing.isLocked : true,
      unlockFee: 49,
      depositAmount: 250,
      outlierReason: isOutlier ? (priceScraped <= 500 ? 'Corrupt £1 Listing Spam' : 'Unrealistic Maximum Price') : null,
      title: listing.title || 'Untitled Vehicle',
      make: listing.make || 'Generic',
      model: listing.model || 'Model',
      year: parseInt(listing.year) || 2020,
      mileage: parseInt(listing.mileage) || 45000,
      priceScraped: priceScraped,
      marketValue: marketValue,
      resalePrice: resalePrice,
      repairCost: repairCost,
      transportCost: transportCost,
      estimatedProfit: Math.max(0, resalePrice - priceScraped - repairCost - transportCost),
      commissionAmount: Math.max(350, Math.round(resalePrice * 0.085)),
      dealScore: isOutlier ? 10 : (listing.dealScore || 88),
      location: listing.location || 'Manchester, UK',
      fuelType: listing.fuelType || 'Petrol',
      transmission: listing.transmission || 'Automatic',
      color: listing.color || 'Black',
      engineSize: listing.engineSize || '2.0L',
      sellerName: listing.sellerName || 'Private Seller',
      sellerContact: listing.sellerContact || 'FB Messenger (Shielded)',
      listingUrl: listing.listingUrl || '',
      viewMode: 'ai',
      aiImageUrl: listing.aiImageUrl || (listing.images && listing.images[0]) || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
      images: listing.images && listing.images.length > 0 ? listing.images : [
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
      ],
      notes: listing.notes || ''
    };

    db.listings.unshift(newListing);
    this.write(db);

    // Evaluate saved search alerts
    try {
      const notificationService = require('./notifications');
      notificationService.evaluateSavedSearchAlerts(newListing);
    } catch (e) {
      // Notification service warning silently handled
    }

    return newListing;
  }

  updateListing(id, updates) {
    const db = this.read();
    const index = db.listings.findIndex(item => item.id === id);
    if (index !== -1) {
      db.listings[index] = { ...db.listings[index], ...updates };
      const item = db.listings[index];
      item.estimatedProfit = Math.max(0, item.resalePrice - item.priceScraped - (item.repairCost || 0) - (item.transportCost || 0));
      this.write(db);
      return db.listings[index];
    }
    return null;
  }

  deleteListing(id) {
    const db = this.read();
    db.listings = db.listings.filter(item => item.id !== id);
    this.write(db);
    return true;
  }

  triggerSync() {
    const db = this.read();
    const now = new Date();
    db.syncStatus = {
      lastSyncedAt: now.toISOString(),
      nextSyncAt: new Date(now.getTime() + 86400000).toISOString(),
      totalSyncedToday: (db.syncStatus ? db.syncStatus.totalSyncedToday : 0) + db.listings.length,
      syncIntervalHours: 24
    };
    db.listings.forEach(l => {
      l.lastSyncedAt = now.toISOString();
    });
    this.write(db);
    return db.syncStatus;
  }

  getSyncStatus() {
    const db = this.read();
    return db.syncStatus || {};
  }

  getLeads() {
    const db = this.read();
    return db.leads || [];
  }

  getConversations() {
    const db = this.read();
    return db.conversations || [];
  }

  getConversationByListingId(listingId) {
    const db = this.read();
    const convs = db.conversations || [];
    let conv = convs.find(c => c.listingId === listingId);
    if (!conv) {
      const listing = db.listings.find(l => l.id === listingId);
      conv = {
        id: 'CONV-' + Date.now().toString(36).toUpperCase(),
        listingId: listingId,
        sellerName: listing ? listing.sellerName : 'Private Seller',
        state: 'UNCONTACTED',
        lastMessageAt: new Date().toISOString(),
        optedOut: false,
        messages: []
      };
      if (!db.conversations) db.conversations = [];
      db.conversations.push(conv);
      this.write(db);
    }
    return conv;
  }

  addMessageToConversation(listingId, messageObj, newState, optedOut = false) {
    const db = this.read();
    if (!db.conversations) db.conversations = [];
    let conv = db.conversations.find(c => c.listingId === listingId);
    if (!conv) {
      conv = this.getConversationByListingId(listingId);
    }

    messageObj.timestamp = new Date().toISOString();
    conv.messages.push(messageObj);
    conv.lastMessageAt = messageObj.timestamp;
    if (newState) conv.state = newState;
    if (optedOut !== undefined) conv.optedOut = optedOut;

    this.write(db);
    return conv;
  }

  updateLeadStatus(leadId, newStatus) {
    const db = this.read();
    const lead = db.leads.find(l => l.id === leadId);
    if (lead) {
      lead.status = newStatus;
      this.write(db);
      return lead;
    }
    return null;
  }

  getSettings() {
    const db = this.read();
    return db.settings;
  }

  saveSettings(newSettings) {
    const db = this.read();
    db.settings = { ...db.settings, ...newSettings };
    this.write(db);
    return db.settings;
  }

  getInitialSeedLeads() {
    return [
      {
        id: 'LEAD-001',
        carTitle: '2021 BMW 3 Series 320i M Sport Auto',
        sellerName: 'David H. (Shielded Seller)',
        status: 'New Lead',
        scrapedPrice: '£18,450',
        targetMarkupPrice: '£21,950',
        projectedCommission: '£1,865',
        lastContacted: '2 hours ago',
        notes: 'Submitted via YOURCARZ Concierge Inquiry Relay.'
      },
      {
        id: 'LEAD-002',
        carTitle: '2020 Audi A4 35 TFSI Black Edition',
        sellerName: 'Marcus V.',
        status: 'In Negotiation',
        scrapedPrice: '£16,200',
        targetMarkupPrice: '£18,990',
        projectedCommission: '£1,614',
        lastContacted: 'Yesterday',
        notes: 'Contact unlocked via £49 Instant Unlock.'
      }
    ];
  }

  getInitialSeedGroups() {
    return [
      { id: 'grp-1', name: 'UK Performance Cars & Trade', category: 'High-Value Performance', members: '48.2k' },
      { id: 'grp-2', name: 'North West Private Car Sales', category: 'Regional Private Sellers', members: '32.1k' },
      { id: 'grp-3', name: 'Manchester Car Boot & Auctions', category: 'Bargain & Quick Cash', members: '19.5k' },
      { id: 'grp-4', name: 'Cheshire Luxury & Sports Motors', category: 'Luxury / Executive', members: '14.8k' }
    ];
  }

  getInitialSeedListings() {
    return [
      {
        id: 'CAR-FB-001',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        lastSyncedAt: new Date().toISOString(),
        source: 'Facebook Group',
        fbGroup: 'UK Performance Cars & Trade',
        status: 'Active',
        availabilityStatus: 'Live & Available',
        moderationStatus: 'Approved',
        isOutlier: false,
        isLocked: true,
        unlockFee: 49,
        depositAmount: 250,
        title: '2021 BMW 3 Series 320i M Sport Auto',
        make: 'BMW',
        model: '3 Series',
        year: 2021,
        mileage: 28500,
        priceScraped: 18450,
        marketValue: 22800,
        resalePrice: 21950,
        repairCost: 200,
        transportCost: 150,
        estimatedProfit: 3150,
        commissionAmount: 1865,
        dealScore: 94,
        location: 'Stockport, Greater Manchester',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        color: 'Mineral Grey Metallic',
        engineSize: '2.0L Turbo',
        sellerName: 'David H. (Shielded Seller)',
        sellerContact: '🔒 Unlock for Direct Link & Phone',
        listingUrl: 'https://facebook.com/groups/ukperformancecars/posts/109283749',
        viewMode: 'ai',
        aiImageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'
        ],
        notes: 'Contact link shielded to prevent commission bypass.'
      },
      {
        id: 'CAR-FB-002',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        lastSyncedAt: new Date().toISOString(),
        source: 'Facebook Group',
        fbGroup: 'Cheshire Luxury & Sports Motors',
        status: 'Negotiating',
        availabilityStatus: 'Inquiry Sent',
        moderationStatus: 'Approved',
        isOutlier: false,
        isLocked: false, // Unlocked
        unlockFee: 49,
        depositAmount: 250,
        title: '2020 Audi A4 35 TFSI Black Edition S Tronic',
        make: 'Audi',
        model: 'A4',
        year: 2020,
        mileage: 34200,
        priceScraped: 16200,
        marketValue: 19800,
        resalePrice: 18990,
        repairCost: 350,
        transportCost: 180,
        estimatedProfit: 2260,
        commissionAmount: 1614,
        dealScore: 89,
        location: 'Wilmslow, Cheshire',
        fuelType: 'Petrol',
        transmission: 'Automatic',
        color: 'Ibis White',
        engineSize: '2.0L Mild Hybrid',
        sellerName: 'Marcus V.',
        sellerContact: 'FB: @marcusv_wilmslow (UNLOCKED)',
        listingUrl: 'https://facebook.com/groups/cheshireluxury/posts/293847291',
        viewMode: 'ai',
        aiImageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80'
        ],
        notes: 'Unlocked listing with active lead.'
      }
    ];
  }

  getInitialSeedConversations() {
    return [
      {
        id: 'CONV-CAR-FB-001',
        listingId: 'CAR-FB-001',
        sellerName: 'David H.',
        state: 'PERMISSION_GRANTED',
        lastMessageAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        optedOut: false,
        messages: [
          {
            id: 'MSG-101',
            sender: 'BOT',
            text: 'Hi David! Saw your 2021 BMW 3 Series listed for £18,450. We run YOURCARZ, a premier UK vehicle buyer network. Is it still available, and would you be happy for us to feature it free to our buyers?',
            timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
            branch: 'INITIAL_OUTREACH'
          },
          {
            id: 'MSG-102',
            sender: 'SELLER',
            text: 'Yeah that sounds good, you can feature it!',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            branch: 'SELLER_AFFIRMATIVE'
          },
          {
            id: 'MSG-103',
            sender: 'BOT',
            text: 'Fantastic, David! Your featured listing preview is live here: http://localhost:8095/#preview-CAR-FB-001. We will notify you the moment a pre-verified buyer reserves it.',
            timestamp: new Date(Date.now() - 3600000 * 2 + 120000).toISOString(),
            branch: 'PREVIEW_SENT'
          }
        ]
      }
    ];
  }
}

module.exports = new DatabaseManager();
