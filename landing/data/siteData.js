// ============================================================
// NEXVYRO FITNESS - SINGLE SOURCE OF TRUTH
// Edit ONLY this file to change text, prices, links and photos.
// Every line marked TODO is a placeholder to replace later.
// ============================================================

const siteData = {
  siteUrl: "https://www.example.com", // TODO: your real domain, e.g. https://nexvyro.in

  brand: {
    name: "Nutrients Ocean",
    shortName: "Nutriocean",
    tagline: "Fresh protein, made right by your gym.",
    logo: "/images/logo.png", // TODO: after adding public/images/logo.png change this to "/images/logo.png"
  },

  contact: {
    phoneDisplay: "+91 70199 93154",
    phoneRaw: "+917019993154",
    whatsappNumber: "917019993154",
    email: "support@fitmitra.in",
  },

  socials: {
    whatsapp: "https://wa.me/919876543210?text=Hi%20Nexvyro%20Fitness%2C%20I%20would%20like%20to%20pre-order",
    instagram: "https://instagram.com/nutrientsocean.in",
    youtube: "https://youtube.com/@fitmitra-fitness",
    twitter: "https://x.com/fitmitra",
    facebook: "https://facebook.com/fitmitra.fitness",
  },

  legal: {
    companyName: "Nexvyro (Nutrients Ocean)",
    brandName: "Nutrients Ocean",
    lastUpdated: "October 2026",
    address: "Opposite Cobra Fitness Club, Valencia, Kankanadi, Mangalore, Karnataka 575001, India",
    supportEmail: "support@fitmitra.in",
    supportPhone: "+91 70199 93154",
    refundWindow: "Immediate for stall pickup issues / 14 days for packaged supplements",
    responseTimeline: "Within 24 business hours",
  },

  location: {
    gymName: "Cobra Fitness Club", // TODO
    addressLine: "Opposite Cobra Fitness Club, Valencia, Kankanadi, Mangalore", // TODO
    mapsLink: "https://maps.app.goo.gl/5dnLPACG8KJUQa7A7",
    mapPhoto: "/images/google-map.jpg",
    mapsEmbedUrl: "", // OPTIONAL: paste a Google Maps "Embed a map" src URL here to show a live map
    timings: [
      { label: "Evening", time: "5:00 PM - 8:00 PM" }, // TODO
    ],
  },

  hero: {
    headlineStart: "Fuel your workout with",
    headlineHighlight: "fresh protein.",
    subtext:
      "Protein meals, protein shakes and milk, prepared fresh at our stall right opposite your gym. Call, pre-order and pick up in minutes.",
    image: '/images/hero_showcase.jpg',
    backgroundImage: "", // OPTIONAL: e.g. "/images/hero-bg.jpg"
    videoUrl: "", // OPTIONAL: e.g. "/videos/hero.mp4" (muted looping clip, keep under 5 MB)
    videoPoster: "", // OPTIONAL: e.g. "/images/hero-poster.jpg"
    badges: ["Made fresh", "Protein-packed", "Quick pickup"],
    chips: [
      { icon: "Phone", text: "Pre-order by call" },
      { icon: "Clock", text: "Pickup in minutes" },
      { icon: "MapPin", text: "Opposite your gym" },
    ],
  },

  marquee: ["Fresh protein", "Made on the spot", "Pre-order by call", "Pickup in minutes", "Opposite your gym"],

  menu: {
    title: "Our Menu",
    subtitle: "Simple, fresh and protein-focused. More items coming soon.",
    note: "Call us to pre-order and pick up at the stall.",
    items: [
      {
        id: "protein_meal",
        name: "Chocolate Protein Oats Bowl",
        tag: "Meal",
        description: "Creamy chocolate oats topped with banana, almonds, chia seeds and rich chocolate chunks.",
        price: "₹89", // TODO
        image: "/images/protein_meal.png", // TODO: e.g. "/images/protein-meal.jpg"
      },
      {
        id: "nightout_protein_meal",
        name: "Nightfuel Protein Bowl",
        tag: "Meal",
        description: "A nutritious oats bowl loaded with banana, pomegranate, nuts and seeds for a satisfying evening meal.",
        price: "₹79", // TODO
        image: "/images/nightout_protein_meal.png", // TODO: e.g. "/images/protein-shake.jpg"
      },
      {
        id: "dryfruits_sandwich",
        name: "Fruit & Dry Fruit Sandwich",
        tag: "Snacks",
        description: "Fresh banana, pomegranate and assorted dry fruits layered between wholesome bread slices.",
        price: "₹69", // TODO
        image: "/images/dryfruits_sandwich.png", // TODO: e.g. "/images/milk.jpg"
      },
      {
        id: "peanut_banana_sandwich",
        name: "Peanut Butter Banana Sandwich",
        tag: "Snacks",
        description: "Delicious whole-wheat bread filled with creamy peanut butter, fresh banana slices and crunchy peanuts.",
        price: "₹49", // TODO
        image: "/images/peanut_banana_sandwich.png", // TODO: e.g. "/images/milk.jpg"
      },
    ],
  },

  why: {
    title: "Why Nexvyro",
    subtitle: "Good fuel should be easy to get, right where you train.",
    points: [
      { icon: "Leaf", title: "Made fresh", text: "Everything is prepared on the spot at our stall, not packed days ago." },
      { icon: "Dumbbell", title: "Built for training", text: "Protein-focused food for before and after your workout." },
      { icon: "MapPin", title: "Right by your gym", text: "Find us opposite the gym. Grab it on your way in or out." },
      { icon: "Phone", title: "Pre-order, skip the wait", text: "Call ahead and your order is ready when you arrive." },
    ],
  },

  how: {
    title: "How It Works",
    subtitle: "Three simple steps.",
    steps: [
      { title: "Call us", text: "Call the number and tell us what you want." },
      { title: "We prepare it fresh", text: "We make your order at the stall while you finish your workout." },
      { title: "Pick it up", text: "Walk across, collect your order and enjoy." },
    ],
  },

  supplements: {
    badge: "Coming soon",
    title: "Supplements on our website and app",
    text: "We are getting our supplements range ready for the Nexvyro website and app. Join the waitlist and we will let you know first.",
    formButton: "Notify me",
  },

  app: {
    badge: "Mobile Ecosystem",
    name: "FitMitra Mobile App",
    tagline: "Your Bilingual Workout Trainer & Fuel Companion",
    description: "Designed specifically to complement your daily training and stall pickup routine. Track your workouts, earn ⚡ Reward Points, get instant AI guidance in Kannada and English, and manage your nutrition effortlessly.",
    image: "/images/app-preview.jpg",
    features: [
      {
        icon: "Dumbbell",
        title: "Interactive Workout Player",
        desc: "Step-by-step exercise logger with live set counters, animated guidance, and automatic rest timers.",
      },
      {
        icon: "Bot",
        title: "Bilingual AI Fitness Coach",
        desc: "Get instant answers on form, macros, and split recommendations in both Kannada (ಕನ್ನಡ) and English.",
      },
      {
        icon: "Zap",
        title: "Earn ⚡ Reward Points",
        desc: "Gain +5 reward points for every completed workout. Redeem points directly for stall discounts & free shakes.",
      },
      {
        icon: "PieChart",
        title: "Daily Nutrition & Macro Tracker",
        desc: "Real-time energy balance tracking (Protein, Carbs, Fats) calibrated with our fresh gym stall menu.",
      },
      {
        icon: "ShoppingBag",
        title: "Supplements Store & Live Tracking",
        desc: "Order certified Whey Protein, Creatine, and Shakers with dual checkout (Cash ₹ or Points ⚡) and Shiprocket tracking.",
      },
      {
        icon: "TrendingUp",
        title: "Weight & Progress Analytics",
        desc: "Visual charts of your body transformation, personal records, and workout consistency streaks.",
      },
    ],
    stats: [
      { label: "AI Coach Support", value: "English + ಕನ್ನಡ" },
      { label: "Workout Reward", value: "+5 ⚡ Points" },
      { label: "Platform", value: "iOS & Android" },
    ],
  },

  team: {
    title: "Meet the team",
    subtitle: "Three students, one goal: better fuel for your training.",
    members: [
      { name: "Sachin Kumar", role: "Founder", photo: "/images/sachinkumar.jpg" }, // TODO
      { name: "Shivanna", role: "Co-founder", photo: "/images/shivanna.jpg" }, // TODO
      { name: "Team Member 3", role: "Co-founder", photo: "/images/uday.jpg" }, // TODO
    ],
  },
};

export default siteData;
