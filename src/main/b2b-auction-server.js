/**
 * YOURCARZ B2B Dealer Portal - Live Reverse Auction Server
 * 
 * Implements Stage 4.2:
 * 4.2.1: Node.js WebSocket server for real-time bid broadcasting.
 * 4.2.2: 60-second Sniper Protection logic.
 * 4.2.3: Dynamic Proxy Bidding calculator.
 */

const crypto = require('crypto');

class B2BAuctionServer {
  constructor() {
    this.auctions = new Map(); // Store live auction state
    this.clients = new Set();
    
    // Initialize mock auction
    this.auctions.set('AUC-84729', {
      id: 'AUC-84729',
      vehicle: 'BMW 320d M Sport',
      reservePrice: 16000,
      currentHighestBid: 16200,
      highestBidderId: 'dealer_123',
      proxyBids: new Map(), // dealerId -> maxAmount
      endTimeMs: Date.now() + (14 * 60000) // 14 mins from now
    });
  }

  // 4.2.1 Node.js WebSocket Server (Mock implementation for integration)
  start(server) {
    console.log(`[B2B AUCTION SERVER] Live Auction WebSocket Engine Initialized.`);
    // In production, this binds to the 'upgrade' event of the HTTP server.
  }

  simulateConnection(mockWsClient) {
    this.clients.add(mockWsClient);
    mockWsClient.send(JSON.stringify({ event: 'SYNC_AUCTIONS', data: Array.from(this.auctions.values()) }));
  }

  handleMessage(payload) {
    if (payload.action === 'PLACE_BID') {
      return this.processBid(payload.auctionId, payload.dealerId, payload.amount);
    }
    if (payload.action === 'SET_PROXY_BID') {
      return this.setProxyBid(payload.auctionId, payload.dealerId, payload.maxAmount);
    }
  }

  // 4.2.3 Dynamic Proxy Bidding Calculator
  setProxyBid(auctionId, dealerId, maxAmount) {
    const auction = this.auctions.get(auctionId);
    if (!auction) return;
    
    auction.proxyBids.set(dealerId, maxAmount);
    console.log(`[PROXY BID] Dealer ${dealerId} set max bid of £${maxAmount} on ${auctionId}`);
    
    // Immediately calculate if this proxy outbids the current highest
    this.evaluateProxyBids(auction);
  }

  evaluateProxyBids(auction) {
    // If a proxy bid exists that is higher than currentHighestBid, auto-bid.
    // Minimum increment logic
    let minIncrement = 50;
    if (auction.currentHighestBid > 5000) minIncrement = 100;
    if (auction.currentHighestBid > 20000) minIncrement = 250;

    let targetBid = auction.currentHighestBid + minIncrement;

    auction.proxyBids.forEach((maxAmount, dealerId) => {
      if (maxAmount >= targetBid && dealerId !== auction.highestBidderId) {
        console.log(`[PROXY BID TRIGGER] Auto-bidding £${targetBid} for Dealer ${dealerId}`);
        this.processBid(auction.id, dealerId, targetBid, true);
      }
    });
  }

  // 4.2.2 60-Second Sniper Protection Logic
  processBid(auctionId, dealerId, amount, isProxy = false) {
    const auction = this.auctions.get(auctionId);
    if (!auction) return { error: 'Auction not found' };

    if (amount <= auction.currentHighestBid) {
      return { error: 'Bid must be higher than current highest bid' };
    }

    if (Date.now() > auction.endTimeMs) {
      return { error: 'Auction has ended' };
    }

    auction.currentHighestBid = amount;
    auction.highestBidderId = dealerId;

    // 4.2.2 Sniper Protection: If bid is placed in final 60 seconds, extend by 2 minutes
    const timeRemaining = auction.endTimeMs - Date.now();
    let extended = false;
    if (timeRemaining < 60000) {
      auction.endTimeMs += 120000; // Extend by 120 seconds (2 mins)
      extended = true;
      console.log(`[SNIPER PROTECTION] Auction ${auctionId} extended by 2 minutes!`);
    }

    this.broadcast({ 
      event: 'NEW_HIGHEST_BID', 
      data: { 
        auctionId, 
        newHighestBid: amount,
        isReserveMet: amount >= auction.reservePrice,
        timeRemainingMs: auction.endTimeMs - Date.now(),
        extended
      } 
    });

    if (!isProxy) {
      this.evaluateProxyBids(auction); // Check if we need to counter-bid immediately
    }

    return { success: true };
  }

  broadcast(messageObj) {
    const msg = JSON.stringify(messageObj);
    this.clients.forEach((client) => {
      if (client.readyState === 1) client.send(msg); // 1 = WebSocket.OPEN
    });
  }
}

module.exports = new B2BAuctionServer();
