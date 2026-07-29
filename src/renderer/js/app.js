/**
 * YOURCARZ - Customer-Facing Application Logic (Local Studio Vehicles Photography Suite)
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Web Browser Fallback API Bridge when running on web server
  if (!window.api) {
    window.api = {
      getListings: async () => {
        try { return await (await fetch('/api/listings')).json(); } catch(e) { return []; }
      },
      addListing: async (listing) => {
        try { return await (await fetch('/api/listings/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(listing) })).json(); } catch(e) { return listing; }
      },
      unlockListing: async (id) => {
        try { return await (await fetch('/api/listings/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })).json(); } catch(e) { return { isLocked: false }; }
      },
      openExternal: (url) => window.open(url, '_blank')
    };
  }

  // --- 40 LOCAL REAL STUDIO VEHICLE ASSETS (10 PER CATEGORY) ---
  function generateLocalStudioCarDataset() {
    const catalog = [
      // 🚗 YOUR First Car (10 Clean Local Hatchbacks Studio Assets)
      { cat: 'FIRST_CAR', make: 'Ford', model: 'Fiesta ST-Line 1.0 EcoBoost', year: 2021, price: 9800, mileage: 22400, img: 'assets/vehicles/first_car/01_ford_fiesta.jpg', loc: 'Stockport, Manchester' },
      { cat: 'FIRST_CAR', make: 'Volkswagen', model: 'Polo Match 1.0 TSI', year: 2020, price: 10500, mileage: 24100, img: 'assets/vehicles/first_car/02_vw_polo.jpg', loc: 'Wilmslow, Cheshire' },
      { cat: 'FIRST_CAR', make: 'BMW', model: '1 Series 118i M Sport', year: 2021, price: 12200, mileage: 19800, img: 'assets/vehicles/first_car/03_bmw_1series.jpg', loc: 'Kensington, London' },
      { cat: 'FIRST_CAR', make: 'Audi', model: 'A3 Sportback 30 TFSI', year: 2020, price: 11900, mileage: 26500, img: 'assets/vehicles/first_car/04_audi_a3.jpg', loc: 'Harrogate, Leeds' },
      { cat: 'FIRST_CAR', make: 'Mercedes-Benz', model: 'A-Class A180 AMG Line', year: 2019, price: 12400, mileage: 31000, img: 'assets/vehicles/first_car/05_mercedes_aclass.jpg', loc: 'Edgbaston, Birmingham' },
      { cat: 'FIRST_CAR', make: 'SEAT', model: 'Ibiza 1.0 TSI FR', year: 2020, price: 8900, mileage: 27800, img: 'assets/vehicles/first_car/06_seat_ibiza.jpg', loc: 'Clifton, Bristol' },
      { cat: 'FIRST_CAR', make: 'MINI', model: 'Hatch Cooper 1.5 Sport', year: 2021, price: 11400, mileage: 18400, img: 'assets/vehicles/first_car/07_mini_cooper.jpg', loc: 'West End, Glasgow' },
      { cat: 'FIRST_CAR', make: 'Fiat', model: '500 1.2 Lounge', year: 2019, price: 6800, mileage: 34000, img: 'assets/vehicles/first_car/08_fiat_500.jpg', loc: 'Central Edinburgh' },
      { cat: 'FIRST_CAR', make: 'Vauxhall', model: 'Corsa 1.2 Turbo SRi', year: 2020, price: 8200, mileage: 29500, img: 'assets/vehicles/first_car/09_vauxhall_corsa.jpg', loc: 'Altrincham, Greater Manchester' },
      { cat: 'FIRST_CAR', make: 'Renault', model: 'Clio 1.0 TCe RS Line', year: 2021, price: 9400, mileage: 21000, img: 'assets/vehicles/first_car/10_renault_clio.jpg', loc: 'Solihull, West Midlands' },

      // 🚙 YOUR Everyday Car (10 Family & SUV Local Studio Assets)
      { cat: 'EVERYDAY', make: 'BMW', model: '3 Series 320i M Sport Auto', year: 2021, price: 18450, mileage: 28500, img: 'assets/vehicles/everyday/01_bmw_3series.jpg', loc: 'Stockport, Manchester' },
      { cat: 'EVERYDAY', make: 'Audi', model: 'A4 35 TFSI S Line S Tronic', year: 2020, price: 16200, mileage: 34200, img: 'assets/vehicles/everyday/02_audi_a4.jpg', loc: 'Wilmslow, Cheshire' },
      { cat: 'EVERYDAY', make: 'Volkswagen', model: 'Golf 1.5 TSI R-Line', year: 2021, price: 15800, mileage: 21500, img: 'assets/vehicles/everyday/03_vw_golf.jpg', loc: 'Kensington, London' },
      { cat: 'EVERYDAY', make: 'Mercedes-Benz', model: 'C-Class C220d AMG Line', year: 2020, price: 17900, mileage: 31800, img: 'assets/vehicles/everyday/04_mercedes_cclass.jpg', loc: 'Edgbaston, Birmingham' },
      { cat: 'EVERYDAY', make: 'Volkswagen', model: 'Tiguan 2.0 TDI R-Line', year: 2021, price: 19500, mileage: 25400, img: 'assets/vehicles/everyday/05_vw_tiguan.jpg', loc: 'Harrogate, Leeds' },
      { cat: 'EVERYDAY', make: 'Nissan', model: 'Qashqai 1.3 DIG-T N-Connecta', year: 2020, price: 13900, mileage: 29000, img: 'assets/vehicles/everyday/06_nissan_qashqai.jpg', loc: 'West End, Glasgow' },
      { cat: 'EVERYDAY', make: 'Ford', model: 'Focus 1.5 EcoBoost ST-Line X', year: 2021, price: 14800, mileage: 19500, img: 'assets/vehicles/everyday/07_ford_focus.jpg', loc: 'Clifton, Bristol' },
      { cat: 'EVERYDAY', make: 'Volvo', model: 'XC60 2.0 D4 R-Design', year: 2020, price: 21800, mileage: 36000, img: 'assets/vehicles/everyday/08_volvo_xc60.jpg', loc: 'Central Edinburgh' },
      { cat: 'EVERYDAY', make: 'Kia', model: 'Sportage 1.6 T-GDi GT-Line', year: 2021, price: 16400, mileage: 22000, img: 'assets/vehicles/everyday/09_kia_sportage.jpg', loc: 'Sale, Greater Manchester' },
      { cat: 'EVERYDAY', make: 'Hyundai', model: 'Tucson 1.6 T-GDi N Line', year: 2021, price: 17200, mileage: 20500, img: 'assets/vehicles/everyday/10_hyundai_tucson.jpg', loc: 'Solihull, West Midlands' },

      // 💎 YOUR Luxury Car (10 Executive Local Studio Assets)
      { cat: 'LUXURY', make: 'Porsche', model: 'Macan GTS 2.9 V6 Twin-Turbo', year: 2021, price: 44500, mileage: 19800, img: 'assets/vehicles/luxury/01_porsche_macan.jpg', loc: 'Wilmslow, Cheshire' },
      { cat: 'LUXURY', make: 'Land Rover', model: 'Range Rover Evoque R-Dynamic HSE', year: 2021, price: 28900, mileage: 24000, img: 'assets/vehicles/luxury/02_range_rover_evoque.jpg', loc: 'Kensington, London' },
      { cat: 'LUXURY', make: 'BMW', model: '5 Series 520d M Sport', year: 2021, price: 27500, mileage: 26000, img: 'assets/vehicles/luxury/03_bmw_5series.jpg', loc: 'Stockport, Manchester' },
      { cat: 'LUXURY', make: 'Audi', model: 'A6 Avant 40 TDI S Line', year: 2020, price: 26800, mileage: 31000, img: 'assets/vehicles/luxury/04_audi_a6.jpg', loc: 'Harrogate, Leeds' },
      { cat: 'LUXURY', make: 'Mercedes-Benz', model: 'E-Class E220d AMG Line Premium', year: 2021, price: 29500, mileage: 22000, img: 'assets/vehicles/luxury/05_mercedes_eclass.jpg', loc: 'Edgbaston, Birmingham' },
      { cat: 'LUXURY', make: 'Land Rover', model: 'Range Rover Sport 3.0 SDV6 HSE', year: 2020, price: 42000, mileage: 35000, img: 'assets/vehicles/luxury/06_range_rover_sport.jpg', loc: 'Clifton, Bristol' },
      { cat: 'LUXURY', make: 'Porsche', model: 'Taycan 4S Electric AWD', year: 2021, price: 58900, mileage: 16500, img: 'assets/vehicles/luxury/07_porsche_taycan.jpg', loc: 'Knutsford, Cheshire' },
      { cat: 'LUXURY', make: 'Jaguar', model: 'F-Pace 2.0 D200 R-Dynamic', year: 2021, price: 31200, mileage: 21000, img: 'assets/vehicles/luxury/08_jaguar_fpace.jpg', loc: 'West End, Glasgow' },
      { cat: 'LUXURY', make: 'Audi', model: 'Q7 50 TDI S Line Quattro', year: 2020, price: 39800, mileage: 34000, img: 'assets/vehicles/luxury/09_audi_q7.jpg', loc: 'Central Edinburgh' },
      { cat: 'LUXURY', make: 'BMW', model: 'X5 xDrive30d M Sport', year: 2021, price: 43500, mileage: 25000, img: 'assets/vehicles/luxury/10_bmw_x5.jpg', loc: 'Hale, Greater Manchester' },

      // 🏎️ YOUR Sports Car (10 Performance Local Studio Assets)
      { cat: 'SPORTS', make: 'Volkswagen', model: 'Golf GTI 2.0 TSI Performance', year: 2021, price: 21500, mileage: 19800, img: 'assets/vehicles/sports/01_golf_gti.jpg', loc: 'Stockport, Manchester' },
      { cat: 'SPORTS', make: 'BMW', model: 'M3 3.0 BiTurbo Competition', year: 2021, price: 54900, mileage: 14500, img: 'assets/vehicles/sports/02_bmw_m3.jpg', loc: 'Wilmslow, Cheshire' },
      { cat: 'SPORTS', make: 'BMW', model: 'M4 Coupe 3.0 Competition', year: 2021, price: 52800, mileage: 16200, img: 'assets/vehicles/sports/03_bmw_m4.jpg', loc: 'Kensington, London' },
      { cat: 'SPORTS', make: 'Mercedes-Benz', model: 'C63 AMG 4.0 V8 BiTurbo S', year: 2020, price: 46500, mileage: 23000, img: 'assets/vehicles/sports/04_mercedes_c63.jpg', loc: 'Edgbaston, Birmingham' },
      { cat: 'SPORTS', make: 'Porsche', model: '911 Carrera 3.0T PDK (992)', year: 2021, price: 74900, mileage: 12000, img: 'assets/vehicles/sports/05_porsche_911.jpg', loc: 'Knutsford, Cheshire' },
      { cat: 'SPORTS', make: 'Ford', model: 'Mustang 5.0 V8 GT Fastback', year: 2020, price: 31800, mileage: 18500, img: 'assets/vehicles/sports/06_ford_mustang.jpg', loc: 'Harrogate, Leeds' },
      { cat: 'SPORTS', make: 'Audi', model: 'RS6 Avant 4.0 V8 TFSI Quattro', year: 2021, price: 68500, mileage: 17500, img: 'assets/vehicles/sports/07_audi_rs6.jpg', loc: 'West End, Glasgow' },
      { cat: 'SPORTS', make: 'Audi', model: 'R8 V10 5.2 FSI Quattro', year: 2019, price: 76000, mileage: 19000, img: 'assets/vehicles/sports/08_audi_r8.jpg', loc: 'Central Edinburgh' },
      { cat: 'SPORTS', make: 'Porsche', model: '718 Cayman 2.0 T PDK', year: 2021, price: 41500, mileage: 15400, img: 'assets/vehicles/sports/09_porsche_718.jpg', loc: 'Clifton, Bristol' },
      { cat: 'SPORTS', make: 'BMW', model: 'M2 3.0 BiTurbo Competition', year: 2020, price: 36800, mileage: 21000, img: 'assets/vehicles/sports/10_bmw_m2.jpg', loc: 'Bramhall, Greater Manchester' }
    ];

    return catalog.map((item, idx) => ({
      id: `CAR-${String(idx + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      title: `${item.year} ${item.make} ${item.model}`,
      make: item.make,
      model: item.model,
      year: item.year,
      mileage: item.mileage,
      priceScraped: item.price,
      resalePrice: item.price + 1250, // £1,250 Brokerage Markup
      location: item.loc,
      fuelType: item.model.includes('Electric') ? 'Electric' : (item.model.includes('d') ? 'Diesel' : 'Petrol'),
      transmission: 'Automatic',
      moderationStatus: 'Approved',
      isOutlier: false,
      viewMode: 'ai',
      category: item.cat,
      images: [item.img, 'assets/vehicles/everyday/01_bmw_3series.jpg']
    }));
  }

  // Application State
  const state = {
    listings: [],
    activeCategory: 'ALL',
    activeTab: 'showroom',
    searchQuery: '',
    voiceQueryText: '',
    filterMake: 'ALL',
    sortBy: 'priceLow',
    selectedCarForAction: null
  };

  // DOM Elements
  const elements = {
    btnFloatingBrandBadge: document.getElementById('btnFloatingBrandBadge'),
    floatingCategoryMenu: document.getElementById('floatingCategoryMenu'),
    menuPills: document.querySelectorAll('.menu-pill'),
    
    globalSearchInput: document.getElementById('globalSearchInput'),
    filterMakeSelect: document.getElementById('filterMakeSelect'),
    filterSortSelect: document.getElementById('filterSortSelect'),
    showroomGridContainer: document.getElementById('showroomGridContainer'),
    categorySectionTitle: document.getElementById('categorySectionTitle'),

    // Voice Elements (Dock Removed)
    voiceModal: document.getElementById('voiceModal'),
    voiceQueryBanner: document.getElementById('voiceQueryBanner'),
    voiceQueryText: document.getElementById('voiceQueryText'),
    btnClearVoiceQuery: document.getElementById('btnClearVoiceQuery'),

    // Full-Screen Model Folder Modal
    modelFolderModal: document.getElementById('modelFolderModal'),
    folderModelTitle: document.getElementById('folderModelTitle'),
    folderModelSubtitle: document.getElementById('folderModelSubtitle'),
    modalModelSearch: document.getElementById('modalModelSearch'),
    modelVariationsContainer: document.getElementById('modelVariationsContainer')
  };

  // --- INITIAL DATA LOAD ---
  async function loadInitialData() {
    try {
      state.listings = generateLocalStudioCarDataset();
      
      // Assign Top 10 rankings per category
      const counts = {};
      state.listings.forEach(item => {
        counts[item.category] = (counts[item.category] || 0) + 1;
        item.rank = counts[item.category];
      });

      updateCategoryTheme('ALL');
      renderShowroom();
    } catch (err) {
      console.error('Failed to load vehicle catalog:', err);
    }
  }

  // Update Body Theme Data Attribute for Dynamic Category Colors
  function updateCategoryTheme(cat) {
    document.body.setAttribute('data-category-theme', cat || 'ALL');
  }

  // --- RENDER CUSTOMER SHOWROOM ---
  function renderShowroom() {
    if (!elements.showroomGridContainer) return;

    let filtered = state.listings.filter(item => !item.isOutlier && item.moderationStatus !== 'Flagged Scam');

    // Customer Category Filtering with Signature "YOUR..." Branding
    if (state.activeCategory === 'FIRST_CAR') {
      filtered = filtered.filter(item => item.category === 'FIRST_CAR');
      if (elements.categorySectionTitle) elements.categorySectionTitle.textContent = `YOUR First Car (Top 10 Curated Studio Hatchbacks < £12.5k)`;
    } else if (state.activeCategory === 'EVERYDAY') {
      filtered = filtered.filter(item => item.category === 'EVERYDAY');
      if (elements.categorySectionTitle) elements.categorySectionTitle.textContent = `YOUR Everyday Car (Top 10 Curated Studio Family & SUV Models)`;
    } else if (state.activeCategory === 'LUXURY') {
      filtered = filtered.filter(item => item.category === 'LUXURY');
      if (elements.categorySectionTitle) elements.categorySectionTitle.textContent = `YOUR Luxury Car (Top 10 Executive & Luxury Studio Models £25k+)`;
    } else if (state.activeCategory === 'SPORTS') {
      filtered = filtered.filter(item => item.category === 'SPORTS');
      if (elements.categorySectionTitle) elements.categorySectionTitle.textContent = `YOUR Sports Car (Top 10 Performance Studio Models)`;
    } else {
      if (elements.categorySectionTitle) elements.categorySectionTitle.textContent = `All Featured Vehicles (40 Studio White Models Total)`;
    }

    // Voice Query Filter
    if (state.voiceQueryText.trim()) {
      const vq = state.voiceQueryText.toLowerCase();
      if (elements.voiceQueryBanner) elements.voiceQueryBanner.style.display = 'flex';
      if (elements.voiceQueryText) elements.voiceQueryText.textContent = `"${state.voiceQueryText}"`;

      filtered = filtered.filter(item => {
        const fullStr = `${item.title} ${item.make} ${item.model} ${item.fuelType} ${item.transmission} ${item.location}`.toLowerCase();
        const words = vq.split(' ').filter(w => w.length > 2);
        return words.some(w => fullStr.includes(w)) || (vq.includes('under') && item.resalePrice <= 20000);
      });
    } else {
      if (elements.voiceQueryBanner) elements.voiceQueryBanner.style.display = 'none';
    }

    // Search Query Filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.make.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }

    // Make Filter
    if (state.filterMake !== 'ALL') {
      filtered = filtered.filter(item => item.make.toUpperCase() === state.filterMake.toUpperCase());
    }

    // Sorting
    filtered.sort((a, b) => {
      if (state.sortBy === 'priceLow') return (a.resalePrice || 0) - (b.resalePrice || 0);
      if (state.sortBy === 'priceHigh') return (b.resalePrice || 0) - (a.resalePrice || 0);
      if (state.sortBy === 'yearNew') return (b.year || 0) - (a.year || 0);
      if (state.sortBy === 'mileageLow') return (a.mileage || 0) - (b.mileage || 0);
      return 0;
    });

    // Add entrance animation class
    elements.showroomGridContainer.classList.remove('animate-switch');
    void elements.showroomGridContainer.offsetWidth; // Trigger reflow
    elements.showroomGridContainer.classList.add('animate-switch');

    if (filtered.length === 0) {
      elements.showroomGridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted);">
          <i data-lucide="car-front" style="width: 48px; height: 48px; margin-bottom: 12px; stroke: var(--text-dim);"></i>
          <h3>No Vehicles Match Your Criteria</h3>
          <p>Try clearing your filters or selecting another category.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    elements.showroomGridContainer.innerHTML = filtered.map(item => {
      const currentImage = item.images && item.images[0] ? item.images[0] : 'assets/vehicles/everyday/01_bmw_3series.jpg';
      const cashPrice = item.resalePrice || 18000;
      const monthlyEst = Math.round((cashPrice * 0.9 * 0.018));

      // Phase 8.2.1 Schema Markup: Inject JSON-LD
      const jsonLd = {
        "@context": "https://schema.org/",
        "@type": "Vehicle",
        "name": item.title,
        "brand": { "@type": "Brand", "name": item.make },
        "model": item.model,
        "productionDate": item.year,
        "mileageFromOdometer": { "@type": "QuantitativeValue", "value": item.mileage, "unitCode": "SMI" },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "GBP",
          "price": cashPrice,
          "itemCondition": "https://schema.org/UsedCondition"
        }
      };

      // Determine Category Styling
      let catColor = '#94A3B8';
      let catName = 'Vehicle';
      if (item.category === 'FIRST_CAR') { catColor = '#38BDF8'; catName = 'First Car'; }
      if (item.category === 'EVERYDAY') { catColor = '#00E676'; catName = 'Everyday'; }
      if (item.category === 'LUXURY') { catColor = '#A855F7'; catName = 'Luxury'; }
      if (item.category === 'SPORTS') { catColor = '#FF2D55'; catName = 'Sports'; }

      // Top 10 Rank Badge
      const rankBadge = item.rank <= 10 
        ? `<div style="position: absolute; top: 12px; left: 12px; background: ${catColor}; color: #020617; font-weight: 900; font-size: 14px; padding: 4px 10px; border-radius: 8px; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">#${item.rank} <span style="font-size: 10px; opacity: 0.8; margin-left: 2px;">${catName}</span></div>`
        : '';

      return `
        <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
        <div class="car-card scroll-hidden" data-id="${item.id}" style="border-top: 3px solid ${catColor};">
          <div class="card-media">
            ${rankBadge}
            <img src="${currentImage}" alt="${item.title}" onerror="this.src='assets/vehicles/everyday/01_bmw_3series.jpg'">
            
            <button class="photo-toggle-btn" onclick="window.togglePhotoMode('${item.id}')">
              ${item.viewMode === 'original' ? '📷 REAL FB PHOTO' : '✨ STUDIO WHITE'}
            </button>

            <span class="badge-studio-verified">✨ STUDIO VERIFIED</span>
          </div>

          <div class="card-body">
            <h3 class="card-title">${item.title}</h3>
            
            <div class="specs-pills">
              <span class="pill">${item.year}</span>
              <span class="pill">${(item.mileage || 0).toLocaleString()} mi</span>
              <span class="pill">${item.fuelType || 'Petrol'}</span>
              <span class="pill">${item.transmission || 'Automatic'}</span>
            </div>

            <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 4px;">
              <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i>
              <span>${item.location || 'Manchester, UK'}</span>
            </div>

            <div class="pricing-row">
              <div>
                <div class="scraped-price">RRP: £${Math.round(cashPrice * 1.08).toLocaleString('en-GB')}</div>
                <div class="resale-price">£${cashPrice.toLocaleString('en-GB')}</div>
              </div>

              <div class="finance-badge">
                from £${monthlyEst}/mo PCP
              </div>
            </div>

            <div style="margin-top: 12px;">
              <button class="btn btn-primary btn-full" onclick="window.openModelFolder('${item.make}', '${item.model}')" style="font-size: 12px; padding: 10px;">
                <i data-lucide="folder-open" style="width: 14px; height: 14px;"></i> Open Full-Screen Model Folder
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
    initScrollReveal();
  }

  // --- SCROLL REVEAL ANIMATIONS ---
  function initScrollReveal() {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-hidden').forEach(el => {
      observer.observe(el);
    });
  }

  // --- FLOATING BRAND MENU BADGE HANDLER ---
  if (elements.btnFloatingBrandBadge) {
    elements.btnFloatingBrandBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.floatingCategoryMenu?.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!elements.btnFloatingBrandBadge.contains(e.target) && !elements.floatingCategoryMenu.contains(e.target)) {
        elements.floatingCategoryMenu?.classList.remove('active');
      }
    });
  }

  // Floating Menu Pill Category Handlers
  elements.menuPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const category = pill.getAttribute('data-category');
      elements.menuPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.activeCategory = category || 'ALL';
      updateCategoryTheme(category || 'ALL');
      elements.floatingCategoryMenu?.classList.remove('active');
      
      const tabShowroom = document.getElementById('tab-showroom');
      const tabTop10 = document.getElementById('tab-top10');
      
      if (category === 'TOP10') {
        if (tabShowroom) tabShowroom.style.display = 'none';
        if (tabTop10) tabTop10.style.display = 'block';
      } else {
        if (tabShowroom) tabShowroom.style.display = 'block';
        if (tabTop10) tabTop10.style.display = 'none';
        renderShowroom();
      }
    });
  });

  // --- FULL-SCREEN MODEL VARIATIONS FOLDER MODAL OPENER ---
  window.openModelFolder = (make, model) => {
    // Phase 8.1.2 Programmatic SEO: Dynamic Title and Meta Tags
    document.title = `Used ${make} ${model} Deals | 100% Real Photography | YOURCARZ`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = `Compare all real-photography listings and variations for the ${make} ${model} on YOURCARZ. See cash prices and PCP finance options.`;

    const sampleVariations = [
      { id: 'v1', title: `2021 ${make} ${model} Edition 1`, year: 2021, mileage: 22000, resalePrice: 18500, location: 'Stockport, Manchester', transmission: 'Automatic', img: 'assets/vehicles/everyday/01_bmw_3series.jpg' },
      { id: 'v2', title: `2020 ${make} ${model} S Line / M Sport`, year: 2020, mileage: 31000, resalePrice: 16900, location: 'Wilmslow, Cheshire', transmission: 'Automatic', img: 'assets/vehicles/everyday/02_audi_a4.jpg' },
      { id: 'v3', title: `2019 ${make} ${model} Match Trim`, year: 2019, mileage: 41000, resalePrice: 14200, location: 'Kensington, London', transmission: 'Manual', img: 'assets/vehicles/first_car/01_ford_fiesta.jpg' }
    ];

    if (elements.folderModelTitle) elements.folderModelTitle.textContent = `📁 ${make} ${model} - Full-Screen Model Variations Folder`;
    if (elements.folderModelSubtitle) elements.folderModelSubtitle.textContent = `Comparing all active real-photo listings for this car model`;

    function renderModalVariations(searchQuery = '') {
      let itemsToRender = sampleVariations;
      if (searchQuery.trim()) {
        const sq = searchQuery.toLowerCase();
        itemsToRender = sampleVariations.filter(v => v.title.toLowerCase().includes(sq) || v.location.toLowerCase().includes(sq) || v.transmission.toLowerCase().includes(sq));
      }

      if (elements.modelVariationsContainer) {
        elements.modelVariationsContainer.innerHTML = itemsToRender.map((item, idx) => {
          const cashPrice = item.resalePrice || 18000;
          const monthlyEst = Math.round((cashPrice * 0.9 * 0.018));

          return `
            <div class="variation-item-card">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="folder-badge">REAL VARIATION #${idx + 1}</span>
                <span style="font-size: 11px; color: var(--accent-cyan); font-weight: 700;">HPI Clear Verified</span>
              </div>

              <img src="${item.img}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 10px;" alt="${item.title}">

              <strong style="font-size: 16px; color: var(--text-main); font-family: var(--font-heading);">${item.title}</strong>
              <div style="font-size: 13px; color: var(--text-muted);">${item.year} • ${(item.mileage || 0).toLocaleString()} miles • ${item.transmission}</div>
              
              <div style="font-size: 13px; color: var(--accent-cyan); font-weight: 700;">📍 ${item.location || 'Manchester'}</div>

              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 10px 14px; border-radius: 10px;">
                <div>
                  <span style="font-size: 11px; color: var(--text-muted); display: block;">Buy Now Price</span>
                  <strong style="font-size: 18px; color: var(--text-main);">£${cashPrice.toLocaleString('en-GB')}</strong>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 11px; color: var(--accent-emerald); display: block;">Est. PCP</span>
                  <strong style="font-size: 15px; color: var(--accent-emerald);">£${monthlyEst}/mo</strong>
                </div>
              </div>

              <button class="btn btn-primary btn-full" onclick="window.initiateSecureEscrow()" style="font-size: 13px; padding: 10px; margin-top: 4px; background: linear-gradient(135deg, #00E676, #00c853); color: #000; font-weight: 800;">
                🛡️ Reserve & Buy via Secure Escrow
              </button>
            </div>
          `;
        }).join('');
      }

      if (window.lucide) window.lucide.createIcons();
    }

    renderModalVariations();

    if (elements.modalModelSearch) {
      elements.modalModelSearch.value = '';
      elements.modalModelSearch.oninput = (e) => renderModalVariations(e.target.value);
    }

    elements.modelFolderModal?.classList.add('active');
  };

  // --- FLOATING CENTER VOICE SEARCH ASSISTANT DOCK ---
  function initVoiceAssistant() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    const startRecording = () => {
      elements.voiceModal?.classList.add('active');

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-GB';

        recognition.onstart = () => {
          const title = document.getElementById('voiceStatusTitle');
          if (title) title.textContent = 'Listening... Speak Your Car Preference';
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          window.simulateVoiceQuery(transcript);
        };

        recognition.onerror = () => {
          const title = document.getElementById('voiceStatusTitle');
          if (title) title.textContent = 'Speech not recognized. Select a voice query below:';
        };

        try { recognition.start(); } catch(e) {}
      }
    };

    // --- VOICE MODAL HANDLERS (Floating Dock Removed) ---
    if (elements.voiceModal && typeof lucide !== 'undefined') {
      // We keep voice simulation logic in case the modal is triggered via another method (like search bar mic icon)
      window.simulateVoiceQuery = function(queryText) {
        state.voiceQueryText = queryText;
        elements.voiceModal?.classList.remove('active');
        renderShowroom();
      };
    }

    if (elements.btnClearVoiceQuery) {
      elements.btnClearVoiceQuery.addEventListener('click', () => {
        state.voiceQueryText = '';
        renderShowroom();
      });
    }
  }

  // Global toggle photo mode function for customer
  window.togglePhotoMode = (id) => {
    const item = state.listings.find(l => l.id === id);
    if (item) {
      item.viewMode = item.viewMode === 'original' ? 'ai' : 'original';
      renderShowroom();
    }
  };

  // Search & Filters
  if (elements.globalSearchInput) {
    elements.globalSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderShowroom();
    });
  }

  if (elements.filterMakeSelect) {
    elements.filterMakeSelect.addEventListener('change', (e) => {
      state.filterMake = e.target.value;
      renderShowroom();
    });
  }

  if (elements.filterSortSelect) {
    elements.filterSortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderShowroom();
    });
  }

  window.submitGearheadFeedback = function() {
    const name = document.getElementById('ghName').value;
    const feedback = document.getElementById('ghFeedback').value;
    if (name && feedback) {
      document.getElementById('ghSuccessMsg').style.display = 'block';
      setTimeout(() => {
        document.getElementById('gearheadFeedbackForm').reset();
        document.getElementById('ghSuccessMsg').style.display = 'none';
      }, 4000);
    }
  };

  // --- SIMULATORS REMOVED FOR CLEAN ARBITRAGE UI ---

  // --- EXPANDING VEHICLE DETAILS MODAL & DROPDOWN HANDLERS ---
  window.openExpandingModal = function(id) {
    const listing = state.listings.find(l => l.id === id);
    if (!listing) return;

    const modal = document.getElementById('expandingVehicleModal');
    const modalTitle = document.getElementById('expModalTitle');
    const modalImg = document.getElementById('expModalImg');
    const modalPrice = document.getElementById('expModalPrice');
    const modalMonthly = document.getElementById('expModalMonthly');
    const modalDropdown = document.getElementById('expModelDropdown');

    if (!modal) return;

    modalTitle.textContent = listing.title;
    modalImg.src = listing.images && listing.images[0] ? listing.images[0] : 'assets/vehicles/everyday/01_bmw_3series.jpg';
    modalPrice.textContent = `£${(listing.resalePrice || listing.priceScraped || 18000).toLocaleString('en-GB')}`;
    modalMonthly.textContent = `£${Math.round((listing.resalePrice || 18000) * 0.9 * 0.018)} / mo`;

    // Populate Extracted Listing Variants Dropdown
    if (modalDropdown) {
      modalDropdown.innerHTML = `
        <option value="${listing.id}">🚗 Selected Variant: ${listing.title} (£${(listing.resalePrice || 18000).toLocaleString('en-GB')} - ${listing.location || 'Manchester'})</option>
        <option value="VAR-ALT-1">🚗 Variant #2: ${listing.year} ${listing.make} ${listing.model} Sport (£${Math.round((listing.resalePrice || 18000) * 0.94).toLocaleString('en-GB')} - Stockport)</option>
        <option value="VAR-ALT-2">🚗 Variant #3: ${listing.year} ${listing.make} ${listing.model} M Sport (£${Math.round((listing.resalePrice || 18000) * 1.08).toLocaleString('en-GB')} - Wilmslow)</option>
      `;
    }

    modal.classList.add('active');
  };

  window.initiateSecureEscrow = function() {
    alert('🛡️ Initiating Secure Escrow Transaction... Buyer funds are securely held while you process the private seller payout and capture your markup spread.');
  };

  // Wire card click event to open expanding modal
  if (elements.showroomGridContainer) {
    elements.showroomGridContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.car-card');
      if (card && !e.target.closest('.photo-toggle-btn') && !e.target.closest('.btn')) {
        const id = card.getAttribute('data-id');
        window.openExpandingModal(id);
      }
    });
  }

  initVoiceAssistant();
  loadInitialData();
});
