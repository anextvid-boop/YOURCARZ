/**
 * YOURCARZ Analytics & Deal Scoring Engine
 * Calculates the Arbitrage Score (0-99) for ingested deals.
 */

class AnalyticsEngine {
  constructor() {
    // Weights for Deal Score Calculation
    this.weights = {
      priceVariance: 0.45,
      mileage: 0.25,
      regionalDemand: 0.15,
      dealerReputation: 0.15 // The "Happy Homes" metric
    };
  }

  /**
   * Calculates the Deal Score (0-99)
   * @param {Object} listing - The vehicle listing data
   * @param {Object} capHpiData - Baseline Trade/Retail values
   * @param {Object} dealerStats - { carsSoldToHappyHomes: Number }
   */
  calculateDealScore(listing, capHpiData, dealerStats) {
    let score = 0;

    // 1. Price Variance (45%)
    const retailPrice = capHpiData.retailPrice || (listing.priceScraped * 1.25);
    const priceDiff = retailPrice - listing.priceScraped;
    const variancePercentage = (priceDiff / retailPrice) * 100;
    
    let priceScore = (variancePercentage / 25) * 100; // Maxes out at 25% below retail
    priceScore = Math.max(0, Math.min(100, priceScore));

    // 2. Mileage (25%)
    const vehicleAge = Math.max(1, new Date().getFullYear() - (listing.year || 2020));
    const expectedMileage = vehicleAge * 10000;
    const actualMileage = listing.mileage || expectedMileage;
    
    let mileageScore = 50; 
    if (actualMileage < expectedMileage) {
      mileageScore = 50 + ((expectedMileage - actualMileage) / expectedMileage) * 50;
    } else {
      mileageScore = 50 - ((actualMileage - expectedMileage) / expectedMileage) * 50;
    }
    mileageScore = Math.max(0, Math.min(100, mileageScore));

    // 3. Regional Demand (15%)
    let demandScore = 75; // Baseline healthy demand
    if (listing.title && listing.title.toLowerCase().includes('hybrid') && listing.location === 'London') {
      demandScore = 95; // High demand for ULEZ
    }

    // 4. Dealer Reputation / "Happy Homes" (15%) - Requested by User
    let reputationScore = 50; // Neutral baseline
    if (dealerStats && dealerStats.carsSoldToHappyHomes) {
      reputationScore = Math.min(100, (dealerStats.carsSoldToHappyHomes / 5) * 100);
    }

    // Final Weighted Calculation
    score = (
      (priceScore * this.weights.priceVariance) +
      (mileageScore * this.weights.mileage) +
      (demandScore * this.weights.regionalDemand) +
      (reputationScore * this.weights.dealerReputation)
    );

    score = Math.floor(Math.max(0, Math.min(99, score)));

    return {
      totalScore: score,
      breakdown: {
        priceScore: Math.round(priceScore),
        mileageScore: Math.round(mileageScore),
        demandScore: Math.round(demandScore),
        happyHomesScore: Math.round(reputationScore)
      },
      isUnicornDeal: score >= 85
    };
  }
}

module.exports = new AnalyticsEngine();
