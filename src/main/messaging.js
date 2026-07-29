const db = require('./db');

class MessagingEngine {
  constructor() {
    this.operatingHours = { start: 9, end: 20 };
  }

  // --- INTENT CLASSIFIER ---
  classifyIntent(text) {
    if (!text || typeof text !== 'string') return 'UNKNOWN';

    const lower = text.toLowerCase().trim();

    // 1. Rejection / Opt-Out
    if (/^(no|nah|not interested|stop|don't|dont|remove|scam|go away|leave me alone)/.test(lower) || lower === 'no') {
      return 'REJECTION';
    }

    // 2. Affirmative / Permission Granted
    if (/(yes|yeah|yep|sure|ok|okay|fine|go ahead|sounds good|cool|that's fine|thats fine|please do|no problem)/.test(lower)) {
      return 'AFFIRMATIVE';
    }

    // 3. Fee / Cost Objection
    if (/(cost|charge|fee|price|commission|how much|free|percent|%)/.test(lower)) {
      return 'FAQ_FEES';
    }

    // 4. Trust / Scam Objection
    if (/(who are you|legit|scam|trust|company|website|link|who is|where are you)/.test(lower)) {
      return 'FAQ_TRUST';
    }

    // 5. Control / Possession Objection
    if (/(keep|drive|possession|give|take|hand over|hold)/.test(lower)) {
      return 'FAQ_CONTROL';
    }

    // 6. Haggle / Price Negotiation
    if (/(firm|offer|lowest|best price|movement|haggle|room|discount|cash)/.test(lower)) {
      return 'HAGGLE_INQUIRY';
    }

    // 7. Data Provision (Mileage, MOT, Service History)
    if (/\d{4,6}|\d+\s*(k|miles)|full|partial|mot|v5|v5c|scuff|clean/.test(lower)) {
      return 'SPEC_PROVIDED';
    }

    return 'GENERAL_INQUIRY';
  }

  // --- AUTOMATED RESPONSE GENERATOR ---
  generateResponse(listing, sellerMessage) {
    const intent = this.classifyIntent(sellerMessage);
    const sellerFirstName = (listing.sellerName || 'there').split(' ')[0];
    const previewUrl = `http://localhost:8095/#preview-${listing.id}`;

    switch (intent) {
      case 'AFFIRMATIVE':
        return {
          intent,
          newState: 'PERMISSION_GRANTED',
          replyText: `Fantastic, ${sellerFirstName}! Your featured listing preview is live here: ${previewUrl}. We will notify you the moment a pre-verified buyer reserves it.`,
          followUpAction: 'CHECK_MISSING_SPECS'
        };

      case 'FAQ_FEES':
        return {
          intent,
          newState: 'FAQ_ACTIVE',
          replyText: `Listing is 100% FREE for you as a seller! We only charge our buyer a small concierge fee on final completion. You receive 100% of your asking price (£${listing.priceScraped || 0}). Would you be happy for us to feature it?`,
          followUpAction: 'AWAIT_PERMISSION'
        };

      case 'FAQ_TRUST':
        return {
          intent,
          newState: 'FAQ_ACTIVE',
          replyText: `We operate YOURCARZ (http://localhost:8095), a premier UK vehicle escrow & buyer network. We shield your contact details and hold a £250 deposit in Stripe Escrow before any test drive. Would you like us to show it to our buyers?`,
          followUpAction: 'AWAIT_PERMISSION'
        };

      case 'FAQ_CONTROL':
        return {
          intent,
          newState: 'FAQ_ACTIVE',
          replyText: `You keep 100% control and possession of your car! You continue driving it normally until you accept a buyer offer and receive cleared funds. Shall we activate your free listing?`,
          followUpAction: 'AWAIT_PERMISSION'
        };

      case 'HAGGLE_INQUIRY':
        return {
          intent,
          newState: 'HAGGLE_ACTIVE',
          replyText: `Our buyer has funds ready in Stripe Escrow. Are you firm on £${listing.priceScraped || 0}, or is there a little room for movement for a fast, hassle-free transaction this week?`,
          followUpAction: 'AWAIT_HAGGLE_RESPONSE'
        };

      case 'REJECTION':
        return {
          intent,
          newState: 'OPTED_OUT',
          replyText: `No problem at all, ${sellerFirstName}! Thanks for letting us know. Good luck with the sale!`,
          followUpAction: 'FLAG_OPTED_OUT'
        };

      case 'SPEC_PROVIDED':
        return {
          intent,
          newState: 'EXTRACTING_SPECS',
          replyText: `Thanks for confirming those details, ${sellerFirstName}! That's updated on your vehicle profile: ${previewUrl}.`,
          followUpAction: 'UPDATE_LISTING_SPECS'
        };

      default:
        return {
          intent,
          newState: 'GENERAL_INQUIRY',
          replyText: `Thanks for your message, ${sellerFirstName}! Our vehicle concierge team is reviewing this. You can view your listing preview anytime at: ${previewUrl}`,
          followUpAction: 'HUMAN_REVIEW'
        };
    }
  }

  // --- INITIAL OUTREACH CREATOR ---
  createInitialOutreachMessage(listing) {
    const sellerFirstName = (listing.sellerName || 'there').split(' ')[0];
    return `Hi ${sellerFirstName}! Saw your ${listing.year} ${listing.make} ${listing.model} listed for £${listing.priceScraped}. We run YOURCARZ, a premier UK vehicle buyer network. We have pre-verified buyers looking for models like yours. Is it still available, and would you be happy for us to feature it free to our buyers?`;
  }
}

module.exports = new MessagingEngine();
