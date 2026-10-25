// ============================================================
// NEXVYRO FITNESS - SINGLE SOURCE OF TRUTH
// Edit ONLY this file to change text, prices, links and photos.
// Every line marked TODO is a placeholder to replace later.
// ============================================================

const siteData = {
  siteUrl: "https://www.example.com", // TODO: your real domain, e.g. https://nexvyro.in

  brand: {
    name: "Nexvyro Fitness",
    shortName: "Nexvyro",
    tagline: "Fresh protein, made right by your gym.",
    logo: "/images/logo.svg", // TODO: after adding public/images/logo.png change this to "/images/logo.png"
  },

  contact: {
    phoneDisplay: "+91 00000 00000", // TODO
    phoneRaw: "+910000000000", // TODO: with country code, no spaces
    whatsappNumber: "910000000000", // TODO: digits only, country code first, no +
    email: "hello@example.com", // TODO
  },

  socials: {
    instagram: "https://instagram.com/", // TODO
    facebook: "https://facebook.com/", // TODO
    youtube: "https://youtube.com/", // TODO
  },

  location: {
    gymName: "[Gym Name]", // TODO
    addressLine: "Opposite [Gym Name], [Area], Mangalore", // TODO
    mapsLink: "https://maps.app.goo.gl/5dnLPACG8KJUQa7A7",
    mapsEmbedUrl: "", // OPTIONAL: paste a Google Maps "Embed a map" src URL here to show a live map
    timings: [
      { label: "Morning", time: "6:00 AM - 10:00 AM" }, // TODO
      { label: "Evening", time: "5:00 PM - 9:00 PM" }, // TODO
    ],
  },

  hero: {
    headlineStart: "Fuel your workout with",
    headlineHighlight: "fresh protein.",
    subtext:
      "Protein meals, protein shakes and milk, prepared fresh at our stall right opposite your gym. Call, pre-order and pick up in minutes.",
    image: "/images/placeholder.svg", // TODO: add a real photo e.g. "/images/hero.jpg". While this path contains the word "placeholder", a built-in 3D shake illustration is shown instead.
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
        id: "protein-meal",
        name: "Protein Meal",
        tag: "Meal",
        description: "A filling, protein-rich meal prepared fresh at our stall.",
        price: "₹__", // TODO
        image: "/images/placeholder.svg", // TODO: e.g. "/images/protein-meal.jpg"
      },
      {
        id: "protein-shake",
        name: "Protein Shake",
        tag: "Shake",
        description: "A fresh protein shake blended on the spot, ready for before or after your workout.",
        price: "₹__", // TODO
        image: "/images/placeholder.svg", // TODO: e.g. "/images/protein-shake.jpg"
      },
      {
        id: "milk",
        name: "Milk",
        tag: "Drink",
        description: "Fresh, simple milk to go with your training.",
        price: "₹__", // TODO
        image: "/images/placeholder.svg", // TODO: e.g. "/images/milk.jpg"
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

  team: {
    title: "Meet the team",
    subtitle: "Three students, one goal: better fuel for your training.",
    members: [
      { name: "Team Member 1", role: "Co-founder", photo: "/images/placeholder.svg" }, // TODO
      { name: "Team Member 2", role: "Co-founder", photo: "/images/placeholder.svg" }, // TODO
      { name: "Team Member 3", role: "Co-founder", photo: "/images/placeholder.svg" }, // TODO
    ],
  },
};

export default siteData;
