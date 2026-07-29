/**
 * YOURCARZ Digital Signature Canvas & E-Contract Engine
 */

class ESignatureManager {
  constructor() {
    this.isDrawing = false;
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Initializes the HTML5 E-Signature Pad Canvas
   */
  initCanvas(canvasElementId) {
    this.canvas = document.getElementById(canvasElementId);
    if (!this.canvas) return false;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.strokeStyle = '#0f172a'; // Slate-900
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';

    // Mouse & Touch Event Listeners
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

    this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e.touches[0]));
    this.canvas.addEventListener('touchmove', (e) => this.draw(e.touches[0]));
    this.canvas.addEventListener('touchend', () => this.stopDrawing());

    return true;
  }

  startDrawing(e) {
    if (!this.canvas) return;
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  draw(e) {
    if (!this.isDrawing || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    this.ctx.stroke();
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clearCanvas() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Generates a timestamped legal Bill of Sale digital contract payload
   */
  generateBillOfSaleContract(listingData, buyerData) {
    const timestamp = new Date().toISOString();
    const contractId = 'BOS-' + Date.now().toString(36).toUpperCase();
    const signatureDataUrl = this.canvas ? this.canvas.toDataURL('image/png') : null;

    return {
      contractId: contractId,
      createdAt: timestamp,
      vehicleDetails: {
        title: listingData.title || 'Vehicle',
        make: listingData.make,
        model: listingData.model,
        year: listingData.year,
        vrm: listingData.vrm || 'PENDING_VERIFICATION',
        mileage: listingData.mileage,
        agreedPriceGBP: listingData.priceScraped || listingData.resalePrice
      },
      parties: {
        sellerName: listingData.sellerName || 'Private Seller',
        buyerName: buyerData.fullName || 'Private Buyer',
        buyerEmail: buyerData.email || 'buyer@yourcarz.co.uk'
      },
      escrowTerms: {
        depositHeldGBP: 250,
        holdingPeriodHours: 72,
        safeHarborDisclaimer: 'YOURCARZ acts solely as a technological deal aggregator and escrow facilitator under the UK Consumer Rights Act 2015. Vehicle sale is concluded directly between private buyer and seller.'
      },
      signature: {
        digitalSignatureBase64: signatureDataUrl,
        ipAddress: buyerData.ipAddress || '127.0.0.1',
        signedAt: timestamp
      }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ESignatureManager;
}
