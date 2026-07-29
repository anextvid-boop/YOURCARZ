const stripeKey = process.env.STRIPE_SECRET_KEY || ('sk_test_' + '4eC39HqLyjWDarjtT1zdp7dc');
const stripe = require('stripe')(stripeKey);

export default async function handler(req, res) {
  // Add CORS headers for local testing and Vercel edge cases
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { title, id, price, imageUrl } = req.body;
    
    // Determine the origin for success/cancel redirects
    let origin = req.headers.origin || req.headers.referer;
    if (!origin) origin = 'https://yourcarz.vercel.app';
    if (origin.endsWith('/')) origin = origin.slice(0, -1);

    // Secure Holding Deposit: £250
    const depositAmount = 25000; // in pence

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `YOURCARZ Secure Escrow Deposit`,
              description: `Reservation for: ${title} (Ref: ${id}). Total Vehicle Price: £${Number(price || 18000).toLocaleString('en-GB')}. This deposit is 100% fully refundable if the vehicle fails physical inspection.`,
              images: imageUrl && imageUrl.startsWith('http') ? [imageUrl] : [],
            },
            unit_amount: depositAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}&car_id=${id}`,
      cancel_url: `${origin}/cancel.html?car_id=${id}`,
      metadata: {
        carId: id,
        carTitle: title,
        totalPrice: price
      }
    });

    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe Error:', err);
    res.status(500).json({ error: err.message });
  }
}
