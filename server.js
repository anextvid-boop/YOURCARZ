const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./src/main/db');
const scraper = require('./src/main/scraper');
const messagingEngine = require('./src/main/messaging');

const PORT = 8095;
const RENDERER_DIR = path.join(__dirname, 'src/renderer');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;

  // CORS Headers for dev preview
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- REST API ENDPOINTS ---
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    // Server-Sent Events (SSE) Real-Time Event Bus Endpoint
    if (pathname === '/api/events/live' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);

      // Keep-alive ping interval
      const pingInterval = setInterval(() => {
        res.write(`event: ping\ndata: ${JSON.stringify({ ping: true })}\n\n`);
      }, 15000);

      req.on('close', () => {
        clearInterval(pingInterval);
      });
      return;
    }

    // 🚀 NEW: Live FB Scraping "One-Click Ingestion" Endpoint
    if (pathname === '/api/ingest-url' && req.method === 'POST') {
      // CORS headers for bookmarklet support
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        try {
          const { url } = JSON.parse(body || '{}');
          if (!url) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Missing url parameter' }));
          }

          console.log(`[SERVER] Received Live Ingestion Request for: ${url}`);
          
          // Trigger the local Electron Scraper
          const fbScraper = require('./src/main/fb-scraper');
          const fbEngine = require('./src/fb_ingestion_engine');
          
          const rawPost = await fbScraper.scrapeUrl(url);
          const processedListing = fbEngine.processRawPost(rawPost);
          
          // Save to DB
          db.addListing(processedListing);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Listing scraped and ingested!', data: processedListing }));
        } catch (err) {
          console.error('[SERVER] Ingestion error:', err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
    
    // Handle OPTIONS request for CORS bookmarklet
    if (pathname === '/api/ingest-url' && req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.writeHead(204);
      res.end();
      return;
    }

    // DVLA / HPI Vehicle Lookup API Endpoint
    if (pathname === '/api/lookup/vrm' && req.method === 'GET') {
      const vrm = parsedUrl.searchParams.get('vrm');
      if (!vrm) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing VRM parameter' }));
        return;
      }
      const dvlaData = await db.lookupDVLAByVRM(vrm);
      res.writeHead(200);
      res.end(JSON.stringify(dvlaData));
      return;
    }

    // Dynamic Multi-Facet Search Counts Endpoint
    if (pathname === '/api/search/facets' && req.method === 'GET') {
      const query = parsedUrl.searchParams.get('query') || '';
      const facets = db.getFacets(query);
      res.writeHead(200);
      res.end(JSON.stringify(facets));
      return;
    }

    // Postcode Radial Distance Filter Endpoint
    if (pathname === '/api/postcode/distance' && req.method === 'GET') {
      const postcode = parsedUrl.searchParams.get('postcode') || 'M1 1AG';
      const radius = parseInt(parsedUrl.searchParams.get('radius')) || 50;
      const filteredListings = await db.filterByPostcodeDistance(postcode, radius);
      res.writeHead(200);
      res.end(JSON.stringify({ postcode, radiusMiles: radius, totalMatches: filteredListings.length, listings: filteredListings }));
      return;
    }

    // Stripe Connect Payment Checkout Endpoint (£49 Unlock & £250 Escrow Hold)
    if (pathname === '/api/payments/create-checkout-session' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        const { listingId, type } = JSON.parse(body);
        const listing = db.getListings().find(l => l.id === listingId);
        if (!listing) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Listing not found' }));
          return;
        }

        const amountGBP = type === 'escrow_deposit' ? 250 : 49;
        const sessionPayload = {
          id: 'cs_test_' + Date.now().toString(36),
          listingId: listingId,
          amountGBP: amountGBP,
          type: type || 'contact_unlock',
          currency: 'gbp',
          clientSecret: 'pi_test_secret_' + Math.random().toString(36).substring(2),
          status: 'requires_payment_method',
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_YOURCARZ_SANDBOX_KEY'
        };

        res.writeHead(200);
        res.end(JSON.stringify(sessionPayload));
      });
      return;
    }

    // Stripe Webhook Callback Handler
    if (pathname === '/api/payments/webhook' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        const event = JSON.parse(body || '{}');
        console.log(`[STRIPE WEBHOOK] Received event: ${event.type || 'payment_intent.succeeded'}`);
        if (event.data && event.data.listingId) {
          db.unlockListing(event.data.listingId);
        }
        res.writeHead(200);
        res.end(JSON.stringify({ received: true }));
      });
      return;
    }

    // AI Voice System Intent Parsing Proxy Endpoint
    if (pathname === '/api/voice/parse-intent' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        const { transcript } = JSON.parse(body || '{}');
        const text = (transcript || '').toLowerCase();
        let intent = { type: 'GENERAL', query: transcript, speech: `Searching YOURCARZ for "${transcript}".` };

        if (text.includes('bmw') || text.includes('audi') || text.includes('mercedes') || text.includes('under') || text.includes('price')) {
          intent = { type: 'FILTER_SEARCH', query: transcript, speech: `Filtering listings for ${transcript}.` };
        } else if (text.includes('first car') || text.includes('luxury') || text.includes('everyday')) {
          intent = { type: 'NAVIGATE_CATEGORY', category: text.includes('first car') ? 'FIRST_CAR' : 'LUXURY', speech: `Switching vehicle view.` };
        }

        res.writeHead(200);
        res.end(JSON.stringify(intent));
      });
      return;
    }

    // AI Voice System TTS Proxy Endpoint
    if (pathname === '/api/voice/tts-stream' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        const { text } = JSON.parse(body || '{}');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', text: text, engine: 'ElevenLabs-UK-Automotive' }));
      });
      return;
    }

    if (pathname === '/api/saved-searches' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        const searchObj = JSON.parse(body);
        const saved = db.saveSearch(searchObj);
        res.writeHead(200);
        res.end(JSON.stringify(saved));
      });
      return;
    }

    if (pathname === '/api/listings' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(db.getListings()));
      return;
    }

    if (pathname === '/api/listings/add' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        const listing = JSON.parse(body);
        const saved = db.addListing(listing);
        res.writeHead(200);
        res.end(JSON.stringify(saved));
      });
      return;
    }

    if (pathname === '/api/listings/unlock' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        const { id } = JSON.parse(body);
        const unlocked = db.unlockListing(id);
        res.writeHead(200);
        res.end(JSON.stringify(unlocked));
      });
      return;
    }

    if (pathname === '/api/sync' && req.method === 'POST') {
      const syncStatus = db.triggerSync();
      res.writeHead(200);
      res.end(JSON.stringify(syncStatus));
      return;
    }

    if (pathname === '/api/fb-ingestion/run' && req.method === 'POST') {
      const fbEngine = require('./src/fb_ingestion_engine');
      const sampleRaw = {
        source_type: 'Facebook Group Post',
        group_name: 'UK M Sport & AMG Sales',
        seller_name: 'Auto Sourcing Bot',
        post_text: '2020 BMW 330d M Sport 35k miles £17.5k ONO full history MOT 2027 in Manchester',
        media_urls: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80']
      };
      const processed = fbEngine.processRawPost(sampleRaw);
      db.addListing(processed);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, processedListing: processed, time: new Date().toISOString() }));
      return;
    }

    if (pathname === '/api/fb-ingestion/status' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'IDLE_HEALTHY',
        activeWorkers: 3,
        stealthEngine: 'Playwright-UK-Residential-Proxy',
        proxyPoolStatus: 'ONLINE_HEALTHY',
        totalScrapedToday: 142,
        fraudBlockedToday: 9,
        lastBatchTime: new Date().toISOString()
      }));
      return;
    }

    if (pathname === '/api/leads' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(db.getLeads()));
      return;
    }

    if (pathname === '/api/settings' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(db.getSettings()));
      return;
    }

    if (pathname === '/api/conversations' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(db.getConversations()));
      return;
    }

    if (pathname === '/api/messaging/send' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        const { listingId, branch } = JSON.parse(body);
        const listing = db.getListings().find(l => l.id === listingId);
        if (!listing) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Listing not found' }));
          return;
        }

        const outreachText = messagingEngine.createInitialOutreachMessage(listing);
        const conv = db.addMessageToConversation(listingId, {
          id: 'MSG-' + Date.now().toString(36).toUpperCase(),
          sender: 'BOT',
          text: outreachText,
          branch: branch || 'INITIAL_OUTREACH'
        }, 'OUTREACH_SENT');

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, conversation: conv, messageSent: outreachText }));
      });
      return;
    }

    if (pathname === '/api/messaging/reply' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        const { listingId, sellerMessage } = JSON.parse(body);
        const listing = db.getListings().find(l => l.id === listingId);
        if (!listing) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Listing not found' }));
          return;
        }

        // 1. Save seller message
        db.addMessageToConversation(listingId, {
          id: 'MSG-' + Date.now().toString(36).toUpperCase(),
          sender: 'SELLER',
          text: sellerMessage,
          branch: 'INBOUND_REPLY'
        });

        // 2. Generate bot automated response & classify intent
        const botEval = messagingEngine.generateResponse(listing, sellerMessage);

        // 3. Save bot response
        const updatedConv = db.addMessageToConversation(listingId, {
          id: 'MSG-' + Date.now().toString(36).toUpperCase(),
          sender: 'BOT',
          text: botEval.replyText,
          branch: botEval.intent
        }, botEval.newState, botEval.newState === 'OPTED_OUT');

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          intentDetected: botEval.intent,
          newState: botEval.newState,
          botReply: botEval.replyText,
          conversation: updatedConv
        }));
      });
      return;
    }

    if (pathname === '/api/messaging/webhook' && (req.method === 'POST' || req.method === 'GET')) {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'Meta Messenger Webhook Active', mode: 'subscribe' }));
      return;
    }
  }

  // --- STATIC FILE SERVER ---
  if (pathname === '/') pathname = '/index.html';

  // Handle doc viewing route
  if (pathname.startsWith('/docs/')) {
    const docPath = path.join(__dirname, pathname);
    if (fs.existsSync(docPath)) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(fs.readFileSync(docPath, 'utf-8'));
      return;
    }
  }

  // Handle assets and branding directories relative to project root
  let filePath;
  if (pathname.startsWith('/assets/') || pathname.startsWith('/YOURCARZ Branding/')) {
    filePath = path.join(__dirname, decodeURIComponent(pathname));
  } else {
    filePath = path.join(RENDERER_DIR, decodeURIComponent(pathname));
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 YOURCARZ Live Web Platform is running at: http://localhost:${PORT}\n`);
});
