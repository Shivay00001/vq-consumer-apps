/* ============================================================
   VQ Food — DEMO DATA (App 2, prototype)
   All restaurants, menus, prices and ratings are fictional.
   No real restaurants, no real orders, no real payments.
   ============================================================ */

const DEMO_RESTAURANTS = [
  {
    id: "r1", name: "Spice Symphony", icon: "🍛", area: "Connaught Place, Delhi",
    cuisines: ["North Indian", "Mughlai"], rating: 4.4, deliveryTime: "35–45 min",
    deliveryFee: 29, minOrder: 149,
    offer: "Demo: 20% off up to ₹100",
    menu: [
      { id: "r1m1", name: "Butter Chicken", price: 289, veg: false, icon: "🍗", desc: "Creamy tomato gravy, demo dish." },
      { id: "r1m2", name: "Paneer Tikka Masala", price: 249, veg: true, icon: "🧀", desc: "Smoky paneer in rich masala, demo dish." },
      { id: "r1m3", name: "Dal Makhani", price: 199, veg: true, icon: "🍲", desc: "Slow-cooked black dal, demo dish." },
      { id: "r1m4", name: "Garlic Naan (2 pc)", price: 79, veg: true, icon: "🫓", desc: "Tandoor-fresh naan, demo dish." },
      { id: "r1m5", name: "Chicken Biryani", price: 269, veg: false, icon: "🍚", desc: "Dum-style biryani, demo dish." },
      { id: "r1m6", name: "Gulab Jamun (4 pc)", price: 99, veg: true, icon: "🍮", desc: "Warm syrupy dessert, demo dish." },
    ],
  },
  {
    id: "r2", name: "Dosa Junction", icon: "🥞", area: "Indiranagar, Bengaluru",
    cuisines: ["South Indian"], rating: 4.6, deliveryTime: "25–35 min",
    deliveryFee: 19, minOrder: 99,
    offer: "Demo: free filter coffee over ₹199",
    menu: [
      { id: "r2m1", name: "Masala Dosa", price: 129, veg: true, icon: "🥞", desc: "Crispy golden dosa, demo dish." },
      { id: "r2m2", name: "Idli Sambar (4 pc)", price: 89, veg: true, icon: "🍥", desc: "Soft idlis, hot sambar, demo dish." },
      { id: "r2m3", name: "Mysore Masala Dosa", price: 149, veg: true, icon: "🌶️", desc: "Spicy red-garlic spread, demo dish." },
      { id: "r2m4", name: "Curd Rice", price: 99, veg: true, icon: "🍚", desc: "Comfort curd rice, demo dish." },
      { id: "r2m5", name: "Filter Coffee", price: 49, veg: true, icon: "☕", desc: "Strong decoction coffee, demo dish." },
    ],
  },
  {
    id: "r3", name: "Dragon Wok", icon: "🥡", area: "Bandra, Mumbai",
    cuisines: ["Chinese", "Pan-Asian"], rating: 4.2, deliveryTime: "30–40 min",
    deliveryFee: 35, minOrder: 199,
    offer: "Demo: free spring rolls over ₹299",
    menu: [
      { id: "r3m1", name: "Hakka Noodles", price: 169, veg: true, icon: "🍜", desc: "Smoky wok-tossed noodles, demo dish." },
      { id: "r3m2", name: "Manchurian Fried Rice", price: 189, veg: true, icon: "🍛", desc: "Veg manchurian + fried rice, demo dish." },
      { id: "r3m3", name: "Chilli Chicken (Dry)", price: 249, veg: false, icon: "🍗", desc: "Indo-Chinese classic, demo dish." },
      { id: "r3m4", name: "Veg Spring Rolls (6 pc)", price: 139, veg: true, icon: "🥟", desc: "Crispy rolls, demo dish." },
      { id: "r3m5", name: "Schezwan Chicken Rice", price: 229, veg: false, icon: "🌶️", desc: "Fiery schezwan combo, demo dish." },
    ],
  },
  {
    id: "r4", name: "Crust & Co.", icon: "🍕", area: "Hitech City, Hyderabad",
    cuisines: ["Italian", "Pizza"], rating: 4.5, deliveryTime: "30–40 min",
    deliveryFee: 25, minOrder: 199,
    offer: "Demo: buy 1 get 1 on medium pizzas",
    menu: [
      { id: "r4m1", name: "Margherita Blast", price: 299, veg: true, icon: "🍕", desc: "Classic cheese overload, demo dish." },
      { id: "r4m2", name: "Farmhouse Veggie", price: 349, veg: true, icon: "🫑", desc: "Garden veggies, demo dish." },
      { id: "r4m3", name: "Pepperoni Feast", price: 449, veg: false, icon: "🍕", desc: "Loaded pepperoni, demo dish." },
      { id: "r4m4", name: "Garlic Breadsticks", price: 149, veg: true, icon: "🥖", desc: "Cheesy sticks + dip, demo dish." },
      { id: "r4m5", name: "Tiramisu Cup", price: 179, veg: true, icon: "🍰", desc: "Coffee dessert cup, demo dish." },
    ],
  },
  {
    id: "r5", name: "Biryani Blues House", icon: "🍚", area: "Park Street, Kolkata",
    cuisines: ["Biryani", "North Indian"], rating: 4.3, deliveryTime: "40–50 min",
    deliveryFee: 39, minOrder: 249,
    offer: "Demo: free raita with every biryani",
    menu: [
      { id: "r5m1", name: "Chicken Dum Biryani", price: 279, veg: false, icon: "🍚", desc: "Kolkata-style with aloo, demo dish." },
      { id: "r5m2", name: "Mutton Biryani", price: 379, veg: false, icon: "🍖", desc: "Tender mutton pieces, demo dish." },
      { id: "r5m3", name: "Veg Biryani", price: 219, veg: true, icon: "🥕", desc: "Saffron veg biryani, demo dish." },
      { id: "r5m4", name: "Chicken Chaap", price: 249, veg: false, icon: "🍗", desc: "Slow-cooked chaap, demo dish." },
    ],
  },
  {
    id: "r6", name: "Sweet Crumbs Bakery", icon: "🧁", area: "Koramangala, Bengaluru",
    cuisines: ["Bakery", "Desserts"], rating: 4.7, deliveryTime: "20–30 min",
    deliveryFee: 15, minOrder: 99,
    offer: "Demo: free cookie over ₹149",
    menu: [
      { id: "r6m1", name: "Chocolate Truffle Pastry", price: 95, veg: true, icon: "🍫", desc: "Rich truffle slice, demo dish." },
      { id: "r6m2", name: "Blueberry Cheesecake", price: 185, veg: true, icon: "🍰", desc: "Baked cheesecake, demo dish." },
      { id: "r6m3", name: "Croissant (Butter)", price: 85, veg: true, icon: "🥐", desc: "Flaky butter croissant, demo dish." },
      { id: "r6m4", name: "Red Velvet Jar", price: 145, veg: true, icon: "🧁", desc: "Layered jar dessert, demo dish." },
    ],
  },
];

const DEMO_CUISINES = ["All", "North Indian", "South Indian", "Chinese", "Italian", "Pizza", "Biryani", "Bakery", "Desserts", "Mughlai", "Pan-Asian"];

/* Simulated tracking stages — purely a demo animation, labeled as such in UI */
const DEMO_TRACK_STAGES = [
  { label: "Order confirmed", note: "Restaurant accepted your demo order" },
  { label: "Preparing", note: "Your demo food is being prepared" },
  { label: "On the way", note: "Demo rider picked up your order" },
  { label: "Delivered", note: "Demo complete — nothing was actually delivered" },
];
