/* ============================================================
   VQ Grocery — DEMO DATA (App 1, prototype)
   All products, prices and inventory below are fictional demo
   data. There is no real store, no real inventory, and no real
   payment processing in this build (Phase 2).
   ============================================================ */

const DEMO_CATEGORIES = [
  { id: "all",        label: "All",        icon: "🛒" },
  { id: "fruits-veg",  label: "Fruits & Veg", icon: "🥬" },
  { id: "dairy",       label: "Dairy",      icon: "🥛" },
  { id: "bakery",      label: "Bakery",     icon: "🍞" },
  { id: "snacks",      label: "Snacks",     icon: "🍿" },
  { id: "beverages",   label: "Beverages",  icon: "🧃" },
  { id: "household",   label: "Household",  icon: "🧹" },
];

const DEMO_PRODUCTS = [
  // Fruits & Vegetables
  { id: "p01", name: "Fresh Tomatoes",      category: "fruits-veg", price: 32,  mrp: 40,  unit: "1 kg",   icon: "🍅", rating: 4.3, desc: "Farm-fresh red tomatoes, demo stock." },
  { id: "p02", name: "Onions",              category: "fruits-veg", price: 28,  mrp: 35,  unit: "1 kg",   icon: "🧅", rating: 4.2, desc: "Everyday cooking onions, demo stock." },
  { id: "p03", name: "Bananas (Robusta)",   category: "fruits-veg", price: 45,  mrp: 55,  unit: "1 dozen",icon: "🍌", rating: 4.6, desc: "Sweet ripe bananas, demo stock." },
  { id: "p04", name: "Fresh Spinach",       category: "fruits-veg", price: 20,  mrp: 25,  unit: "250 g",  icon: "🥬", rating: 4.1, desc: "Leafy green spinach bunch, demo stock." },
  { id: "p05", name: "Alphonso Mangoes",    category: "fruits-veg", price: 299, mrp: 349, unit: "1 kg",   icon: "🥭", rating: 4.8, desc: "Seasonal king of fruits, demo stock." },
  { id: "p06", name: "Potatoes",            category: "fruits-veg", price: 30,  mrp: 38,  unit: "1 kg",   icon: "🥔", rating: 4.2, desc: "Staple cooking potatoes, demo stock." },
  // Dairy
  { id: "p07", name: "Toned Milk",          category: "dairy",      price: 66,  mrp: 70,  unit: "1 L",    icon: "🥛", rating: 4.5, desc: "Pasteurised toned milk, demo stock." },
  { id: "p08", name: "Curd Cup",            category: "dairy",      price: 35,  mrp: 40,  unit: "400 g",  icon: "🍶", rating: 4.4, desc: "Thick creamy curd, demo stock." },
  { id: "p09", name: "Paneer",              category: "dairy",      price: 95,  mrp: 110, unit: "200 g",  icon: "🧀", rating: 4.6, desc: "Fresh soft paneer, demo stock." },
  { id: "p10", name: "Butter (Salted)",     category: "dairy",      price: 58,  mrp: 62,  unit: "100 g",  icon: "🧈", rating: 4.3, desc: "Creamy salted butter, demo stock." },
  { id: "p11", name: "Eggs (Pack of 12)",  category: "dairy",      price: 84,  mrp: 96,  unit: "12 pcs", icon: "🥚", rating: 4.4, desc: "Farm eggs, pack of 12, demo stock." },
  // Bakery
  { id: "p12", name: "Whole Wheat Bread",  category: "bakery",     price: 45,  mrp: 50,  unit: "400 g",  icon: "🍞", rating: 4.2, desc: "Freshly baked daily (demo), whole wheat." },
  { id: "p13", name: "Chocolate Croissant", category: "bakery",     price: 60,  mrp: 70,  unit: "2 pcs",  icon: "🥐", rating: 4.7, desc: "Flaky croissants, demo stock." },
  { id: "p14", name: "Atta Cookies",       category: "bakery",     price: 75,  mrp: 85,  unit: "300 g",  icon: "🍪", rating: 4.5, desc: "Whole-grain cookies, demo stock." },
  // Snacks
  { id: "p15", name: "Masala Chips",        category: "snacks",     price: 35,  mrp: 40,  unit: "150 g",  icon: "🍟", rating: 4.1, desc: "Crispy masala chips, demo stock." },
  { id: "p16", name: "Roasted Peanuts",     category: "snacks",     price: 55,  mrp: 65,  unit: "500 g",  icon: "🥜", rating: 4.4, desc: "Salted roasted peanuts, demo stock." },
  { id: "p17", name: "Mixed Namkeen",       category: "snacks",     price: 48,  mrp: 55,  unit: "400 g",  icon: "🍿", rating: 4.3, desc: "Classic tea-time namkeen, demo stock." },
  { id: "p18", name: "Dark Chocolate Bar",  category: "snacks",     price: 120, mrp: 140, unit: "100 g",  icon: "🍫", rating: 4.8, desc: "70% dark chocolate, demo stock." },
  // Beverages
  { id: "p19", name: "Masala Chai Mix",     category: "beverages",  price: 140, mrp: 160, unit: "250 g",  icon: "🍵", rating: 4.6, desc: "Spiced chai premix, demo stock." },
  { id: "p20", name: "Cold Coffee",         category: "beverages",  price: 99,  mrp: 120, unit: "300 ml", icon: "🥤", rating: 4.5, desc: "Chilled cold coffee, demo stock." },
  { id: "p21", name: "Mango Juice",         category: "beverages",  price: 110, mrp: 125, unit: "1 L",    icon: "🧃", rating: 4.2, desc: "Real mango pulp juice, demo stock." },
  { id: "p22", name: "Filter Coffee Powder",category: "beverages",  price: 180, mrp: 200, unit: "500 g",  icon: "☕", rating: 4.7, desc: "South Indian filter coffee, demo stock." },
  // Household
  { id: "p23", name: "Dishwash Bar (3)",    category: "household",  price: 85,  mrp: 99,  unit: "3 pcs",  icon: "🧽", rating: 4.3, desc: "Lemon dishwash bars, demo stock." },
  { id: "p24", name: "Detergent Powder",    category: "household",  price: 145, mrp: 165, unit: "1 kg",   icon: "🧺", rating: 4.4, desc: "Everyday detergent, demo stock." },
  { id: "p25", name: "Floor Cleaner",       category: "household",  price: 99,  mrp: 115, unit: "975 ml", icon: "🧴", rating: 4.2, desc: "Disinfectant floor cleaner, demo stock." },
  { id: "p26", name: "Toilet Paper (6)",    category: "household",  price: 160, mrp: 185, unit: "6 rolls",icon: "🧻", rating: 4.5, desc: "Soft 3-ply rolls, demo stock." },
];

const DEMO_OFFERS = [
  "Demo offer: 10% off on first order (no real discount applied)",
  "Free demo delivery on orders above ₹199",
];
