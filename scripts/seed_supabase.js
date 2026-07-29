const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = 'https://lkbvrlqqcgtifebkwdrd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrYnZybHFxY2d0aWZlYmt3ZHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNTY3ODYsImV4cCI6MjEwMDkzMjc4Nn0.i3z71Iu5YEcDGqin4HVVZ4oZklqaNosmMl74ZMkn7iQ';

const ws = require('ws');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  global: { fetch: fetch, headers: {} },
  realtime: { transport: ws }
});

function generateLocalStudioCarDataset() {
  const catalog = [
    // 🚙 YOUR First Car (10 Hatchback Local Studio Assets)
    { cat: 'FIRST_CAR', make: 'Volkswagen', model: 'Polo 1.0 TSI R-Line', year: 2021, price: 15400, mileage: 22000, img: 'assets/vehicles/first_car/01_vw_polo.jpg', loc: 'Altrincham, Cheshire' },
    { cat: 'FIRST_CAR', make: 'Ford', model: 'Fiesta 1.0 EcoBoost ST-Line', year: 2020, price: 12800, mileage: 31000, img: 'assets/vehicles/first_car/02_ford_fiesta.jpg', loc: 'Didsbury, Manchester' },
    { cat: 'FIRST_CAR', make: 'Audi', model: 'A1 1.0 TFSI Sport', year: 2019, price: 14500, mileage: 38000, img: 'assets/vehicles/first_car/03_audi_a1.jpg', loc: 'Stockport, Greater Manchester' },
    { cat: 'FIRST_CAR', make: 'Renault', model: 'Clio 1.0 TCe RS Line', year: 2021, price: 13200, mileage: 18500, img: 'assets/vehicles/first_car/04_renault_clio.jpg', loc: 'Sale, Trafford' },
    { cat: 'FIRST_CAR', make: 'Peugeot', model: '208 1.2 PureTech GT', year: 2020, price: 14900, mileage: 25000, img: 'assets/vehicles/first_car/05_peugeot_208.jpg', loc: 'Macclesfield, Cheshire' },
    { cat: 'FIRST_CAR', make: 'SEAT', model: 'Ibiza 1.0 TSI FR', year: 2021, price: 13800, mileage: 20000, img: 'assets/vehicles/first_car/06_seat_ibiza.jpg', loc: 'Bury, Greater Manchester' },
    { cat: 'FIRST_CAR', make: 'Toyota', model: 'Yaris 1.5 Hybrid Design', year: 2020, price: 16500, mileage: 15000, img: 'assets/vehicles/first_car/07_toyota_yaris.jpg', loc: 'Chorlton, Manchester' },
    { cat: 'FIRST_CAR', make: 'Vauxhall', model: 'Corsa 1.2 Turbo SRi', year: 2021, price: 12500, mileage: 24000, img: 'assets/vehicles/first_car/08_vauxhall_corsa.jpg', loc: 'Bolton, Greater Manchester' },
    { cat: 'FIRST_CAR', make: 'Mini', model: 'Hatch 1.5 Cooper Classic', year: 2019, price: 13900, mileage: 33000, img: 'assets/vehicles/first_car/09_mini_cooper.jpg', loc: 'Wilmslow, Cheshire' },
    { cat: 'FIRST_CAR', make: 'Hyundai', model: 'i20 1.0 T-GDi Premium', year: 2022, price: 15800, mileage: 12000, img: 'assets/vehicles/first_car/10_hyundai_i20.jpg', loc: 'Prestwich, Manchester' },

    // 👨‍👩‍👧‍👦 YOUR Everyday Car (10 Practical SUV/Family Local Studio Assets)
    { cat: 'EVERYDAY', make: 'BMW', model: '3 Series 320i M Sport', year: 2021, price: 23500, mileage: 28000, img: 'assets/vehicles/everyday/01_bmw_3series.jpg', loc: 'Knutsford, Cheshire' },
    { cat: 'EVERYDAY', make: 'Audi', model: 'A4 2.0 TDI S Line', year: 2020, price: 21800, mileage: 35000, img: 'assets/vehicles/everyday/02_audi_a4.jpg', loc: 'Cheadle, Stockport' },
    { cat: 'EVERYDAY', make: 'Volkswagen', model: 'Tiguan 1.5 TSI R-Line', year: 2021, price: 26500, mileage: 21000, img: 'assets/vehicles/everyday/03_vw_tiguan.jpg', loc: 'Hale, Altrincham' },
    { cat: 'EVERYDAY', make: 'Volvo', model: 'XC40 2.0 B4 Inscription', year: 2020, price: 25900, mileage: 30000, img: 'assets/vehicles/everyday/04_volvo_xc40.jpg', loc: 'Bowdon, Cheshire' },
    { cat: 'EVERYDAY', make: 'Mercedes-Benz', model: 'C-Class C220d AMG Line', year: 2019, price: 22500, mileage: 42000, img: 'assets/vehicles/everyday/05_mercedes_cclass.jpg', loc: 'Worsley, Salford' },
    { cat: 'EVERYDAY', make: 'Nissan', model: 'Qashqai 1.3 DiG-T Tekna', year: 2021, price: 20500, mileage: 18000, img: 'assets/vehicles/everyday/06_nissan_qashqai.jpg', loc: 'Rochdale, Greater Manchester' },
    { cat: 'EVERYDAY', make: 'Kia', model: 'Sportage 1.6 CRDi GT-Line', year: 2020, price: 19800, mileage: 26000, img: 'assets/vehicles/everyday/07_kia_sportage.jpg', loc: 'Oldham, Greater Manchester' },
    { cat: 'EVERYDAY', make: 'Skoda', model: 'Octavia 2.0 TDI SE L', year: 2021, price: 21000, mileage: 24000, img: 'assets/vehicles/everyday/08_skoda_octavia.jpg', loc: 'Urmston, Manchester' },
    { cat: 'EVERYDAY', make: 'Ford', model: 'Kuga 2.5 PHEV ST-Line X', year: 2022, price: 28500, mileage: 15000, img: 'assets/vehicles/everyday/09_ford_kuga.jpg', loc: 'Wigan, Greater Manchester' },
    { cat: 'EVERYDAY', make: 'Toyota', model: 'RAV4 2.5 VVT-i Hybrid Excel', year: 2020, price: 27900, mileage: 29000, img: 'assets/vehicles/everyday/10_toyota_rav4.jpg', loc: 'Alderley Edge, Cheshire' },

    // 💎 YOUR Luxury Car (10 Premium/Executive Local Studio Assets)
    { cat: 'LUXURY', make: 'Porsche', model: 'Macan 2.0T PDK', year: 2021, price: 45000, mileage: 18500, img: 'assets/vehicles/luxury/01_porsche_macan.jpg', loc: 'Alderley Edge, Cheshire' },
    { cat: 'LUXURY', make: 'Range Rover', model: 'Sport 3.0 SDV6 HSE', year: 2020, price: 48500, mileage: 32000, img: 'assets/vehicles/luxury/02_range_rover_sport.jpg', loc: 'Hale Barns, Cheshire' },
    { cat: 'LUXURY', make: 'Mercedes-Benz', model: 'S-Class S350d AMG Line', year: 2021, price: 58000, mileage: 22000, img: 'assets/vehicles/luxury/03_mercedes_sclass.jpg', loc: 'Mayfair, London' },
    { cat: 'LUXURY', make: 'Audi', model: 'e-tron GT Quattro', year: 2022, price: 65000, mileage: 10500, img: 'assets/vehicles/luxury/04_audi_etrongt.jpg', loc: 'Knutsford, Cheshire' },
    { cat: 'LUXURY', make: 'BMW', model: '7 Series 745Le M Sport', year: 2020, price: 52000, mileage: 28000, img: 'assets/vehicles/luxury/05_bmw_7series.jpg', loc: 'Chelsea, London' },
    { cat: 'LUXURY', make: 'Jaguar', model: 'F-PACE 2.0 P400e R-Dynamic', year: 2021, price: 42500, mileage: 19000, img: 'assets/vehicles/luxury/06_jaguar_fpace.jpg', loc: 'Wilmslow, Cheshire' },
    { cat: 'LUXURY', make: 'Land Rover', model: 'Defender 110 3.0 D250 X-Dynamic', year: 2022, price: 62000, mileage: 14000, img: 'assets/vehicles/luxury/07_land_rover_defender.jpg', loc: 'Prestbury, Cheshire' },
    { cat: 'LUXURY', make: 'Volvo', model: 'XC90 2.0 T8 Recharge Inscription', year: 2021, price: 55000, mileage: 20000, img: 'assets/vehicles/luxury/08_volvo_xc90.jpg', loc: 'Harrogate, North Yorkshire' },
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
    fb_listing_id: `FB-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    title: `${item.year} ${item.make} ${item.model}`,
    make: item.make,
    model: item.model,
    year: item.year,
    mileage: item.mileage,
    price_scraped: item.price,
    resale_price: item.price + 1250, // £1,250 Brokerage Markup
    location: item.loc,
    fuel_type: item.model.includes('Electric') ? 'Electric' : (item.model.includes('d') ? 'Diesel' : 'Petrol'),
    transmission: 'Automatic',
    category: item.cat,
    images_json: [item.img, 'assets/vehicles/everyday/01_bmw_3series.jpg'],
    status: 'active'
  }));
}

async function seed() {
  const data = generateLocalStudioCarDataset();
  
  console.log('Seeding', data.length, 'vehicles into Supabase...');
  
  const { data: inserted, error } = await supabase
    .from('vehicles')
    .insert(data)
    .select();

  if (error) {
    console.error('Error seeding DB:', error);
  } else {
    console.log('Successfully seeded DB with', inserted.length, 'records.');
  }
}

seed();
