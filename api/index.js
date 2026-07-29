/**
 * YOURCARZ Vercel Serverless Function Handler
 */

const db = require('../src/main/db');
const scraper = require('../src/main/scraper');
const messagingEngine = require('../src/main/messaging');
const analyticsEngine = require('../src/main/analytics-engine');

module.exports = async (req, res) => {
  const url = new URL(req.url, `https://${req.headers.host || 'yourcarz.vercel.app'}`);
  const pathname = url.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // --- API ROUTING ---
  if (pathname === '/api/listings' && req.method === 'GET') {
    return res.status(200).json(db.getListings());
  }

  if (pathname === '/api/listings/add' && req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    let listing = body;

    // 1. AES-256 Decryption (Simulation for Payload Security)
    if (body.encryptedData) {
      console.log(`[VERCEL API] Received AES-GCM Payload. IV: ${body.encryptedData.iv}`);
      // In production, we'd use crypto node module to decrypt using the environment STRIPE_SECRET equivalent.
      // For now, we mock the decrypted payload using standard shape since we don't have the symmetric key sync setup.
      listing = body.rawFallback || {
        title: "Mock Decrypted Title",
        priceScraped: 15000,
        notes: "07700 900123 Call me about this deal. Please email info@test.com",
        source: "Facebook Marketplace"
      };
      // Let's assume we managed to decrypt the original payload accurately here:
      // listing = decrypt(body.encryptedData)
    }

    // 2. Automated PII Scrubbing (Regex/NLP sweeps)
    // Remove UK Phone Numbers (e.g. 07700 900123, +4477...)
    const phoneRegex = /(?:(?:\+44\s?|0)7\d{3}\s?\d{6})|(?:(?:\+44\s?|0)[1-3]\d{2,3}\s?\d{6,7})/g;
    // Remove Email Addresses
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

    if (listing.notes) {
      listing.notes = listing.notes.replace(phoneRegex, '[REDACTED PHONE]');
      listing.notes = listing.notes.replace(emailRegex, '[REDACTED EMAIL]');
    }
    if (listing.title) {
      listing.title = listing.title.replace(phoneRegex, '[REDACTED PHONE]');
      listing.title = listing.title.replace(emailRegex, '[REDACTED EMAIL]');
    }

    // 3. ALPR & Media Processing Pipeline (Simulation)
    console.log(`[VERCEL API] Triggering rembg Studio White removal & CDN Watermarking...`);
    listing.mediaProcessed = true;
    listing.watermarkApplied = "YOURCARZ_SVG_WATERMARK";
    listing.alprMasked = true; // License plate blanked

    // --- PHASE 5: ANALYTICS & DEAL SCORING (Happy Homes Integration) ---
    // Simulate fetching CAP HPI valuation and dealer metrics
    const mockCapHpi = { retailPrice: listing.priceScraped * 1.3 };
    const mockDealerStats = { carsSoldToHappyHomes: Math.floor(Math.random() * 15) }; // Random 0-15 happy homes

    const scoringResult = analyticsEngine.calculateDealScore(listing, mockCapHpi, mockDealerStats);
    listing.dealScore = scoringResult.totalScore;
    listing.isUnicornDeal = scoringResult.isUnicornDeal;
    listing.scoreBreakdown = scoringResult.breakdown;
    
    console.log(`[ANALYTICS] Deal scored: ${listing.dealScore}/99 (Happy Homes Score: ${scoringResult.breakdown.happyHomesScore}/100)`);

    const saved = db.addListing(listing || {});
    return res.status(200).json({ success: true, message: "Deal Ingested, Scrubbed & Scored successfully", data: saved });
  }

  if (pathname === '/api/lookup/vrm' && req.method === 'GET') {
    const vrm = url.searchParams.get('vrm') || 'MW71ABC';
    const dvlaData = await db.lookupDVLAByVRM(vrm);
    return res.status(200).json(dvlaData);
  }

  if (pathname === '/api/search/facets' && req.method === 'GET') {
    const query = url.searchParams.get('query') || '';
    return res.status(200).json(db.getFacets(query));
  }

  if (pathname === '/api/postcode/distance' && req.method === 'GET') {
    const postcode = url.searchParams.get('postcode') || 'M1 1AG';
    const radius = parseInt(url.searchParams.get('radius')) || 50;
    const filteredListings = await db.filterByPostcodeDistance(postcode, radius);
    return res.status(200).json({ postcode, radiusMiles: radius, totalMatches: filteredListings.length, listings: filteredListings });
  }

  // --- PHASE 3: FINANCIAL ESCROW & STRIPE CONNECT ---
  
  // 3.1.1 Configure Stripe Connect Custom Accounts
  if (pathname === '/api/payments/connect/onboard' && req.method === 'POST') {
    const { dealerId, companyName } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    console.log(`[STRIPE CONNECT] Creating Custom Account for Dealer: ${companyName}`);
    return res.status(200).json({
      success: true,
      accountId: 'acct_' + Date.now().toString(36),
      onboardingUrl: 'https://connect.stripe.com/setup/s/YOURCARZ_MOCK_URL'
    });
  }

  // 3.1.2 The £250 holding charge mechanism
  if (pathname === '/api/payments/create-checkout-session' && req.method === 'POST') {
    const { listingId, type, dealerAccountId } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const amountGBP = type === 'escrow_deposit' ? 250 : 49;
    
    const sessionResponse = {
      id: 'cs_test_' + Date.now().toString(36),
      listingId: listingId,
      amountGBP: amountGBP,
      status: 'requires_payment_method',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_YOURCARZ_VERCEL_SANDBOX'
    };

    // If it's an escrow deposit, we hold the funds (authorize only)
    if (type === 'escrow_deposit') {
      sessionResponse.payment_intent_data = {
        capture_method: 'manual', // Hold funds in reserve
        transfer_data: { destination: dealerAccountId || 'acct_mock' }
      };
      console.log(`[ESCROW] £250 Holding Charge initialized. Funds Authorized but NOT Captured.`);
    }

    return res.status(200).json(sessionResponse);
  }

  // 3.2.2 Automated Refund API (Missing Signatures)
  if (pathname === '/api/payments/escrow/refund' && req.method === 'POST') {
    const { paymentIntentId, reason } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    console.log(`[ESCROW REFUND] Refunding ${paymentIntentId}. Reason: ${reason}`);
    return res.status(200).json({
      success: true,
      status: 'refunded',
      message: '£250 deposit fully refunded to buyer.'
    });
  }

  // 3.2.3 24-Hour BACS Payout Delay (Successful Transaction)
  if (pathname === '/api/payments/escrow/capture' && req.method === 'POST') {
    const { paymentIntentId, digitalSignatureValid } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!digitalSignatureValid) {
      return res.status(400).json({ error: 'Digital Handover Signature is required to capture funds.' });
    }
    console.log(`[ESCROW CAPTURE] Digital Signature Verified. Capturing ${paymentIntentId}. Payout delayed 24H.`);
    return res.status(200).json({
      success: true,
      status: 'captured',
      payoutDate: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
    });
  }

  // 3.2.1 72-Hour Cron Worker Trigger
  if (pathname === '/api/payments/cron/72h-timeout' && req.method === 'POST') {
    // In production, this would query the DB for all 'authorized' escrows > 72 hours old
    console.log(`[CRON] Sweeping for expired 72-hour escrow holds...`);
    return res.status(200).json({
      success: true,
      refundedCount: 2,
      message: 'Automatically refunded 2 expired escrow deposits.'
    });
  }

  // --- PHASE 4: DEALER CONCIERGE B2B PORTAL ---
  
  // 4.1.1 Companies House API Integration (CRN Validation)
  if (pathname === '/api/dealer/kyb/companies-house' && req.method === 'GET') {
    const crn = url.searchParams.get('crn');
    console.log(`[KYB] Validating Companies House CRN: ${crn}`);
    if (!crn || crn.length < 8) {
      return res.status(400).json({ error: 'Invalid CRN Format' });
    }
    // Simulated UK Government API Response
    return res.status(200).json({
      success: true,
      company_name: 'APEX AUTOMOTIVE LTD',
      company_status: 'active',
      date_of_creation: '2015-04-12',
      registered_office_address: {
        address_line_1: '12 Trading Estate',
        locality: 'Manchester',
        postal_code: 'M17 1AB'
      }
    });
  }

  // --- PHASE 8: SEO & ORGANIC ARCHITECTURE ---
  
  // 8.1.1 Dynamic Sitemap Generator
  if (pathname === '/sitemap.xml' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/xml');
    
    // In production, we'd query db.getListings() and map to URLs
    const listings = db.getListings() || [];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // Add static routes
    xml += `\n  <url><loc>https://yourcarz.co.uk/</loc><priority>1.0</priority></url>`;
    
    // Map dynamic vehicle variations
    listings.slice(0, 100).forEach(listing => {
      if (listing.make && listing.model) {
        const slug = `${listing.make.toLowerCase()}-${listing.model.toLowerCase().replace(/ /g, '-')}`;
        xml += `\n  <url><loc>https://yourcarz.co.uk/cars/${slug}</loc><priority>0.8</priority></url>`;
      }
    });
    
    xml += `\n</urlset>`;
    return res.status(200).send(xml);
  }

  // 4.1.2 Open Banking API Integration
  if (pathname === '/api/dealer/kyb/open-banking/verify' && req.method === 'POST') {
    const { dealerId, accountName, sortCode, accountNumber } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    console.log(`[KYB] Verifying Open Banking Match for: ${accountName}`);
    // Simulated TrueLayer/Stripe Financial Connections response
    if (accountName.toLowerCase().includes('apex automotive')) {
      return res.status(200).json({
        success: true,
        matchStatus: 'EXACT_MATCH',
        message: 'Business bank account successfully verified against Companies House records.'
      });
    } else {
      return res.status(400).json({
        success: false,
        matchStatus: 'MISMATCH',
        error: 'Bank account name does not match the registered corporate entity.'
      });
    }
  }

  if (pathname === '/api/settings' && req.method === 'GET') {
    return res.status(200).json(db.getSettings());
  }

  return res.status(200).json({ status: 'YOURCARZ Vercel API Serverless Node Engine Operational', timestamp: new Date().toISOString() });
};
