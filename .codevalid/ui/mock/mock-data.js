/**
 * Mock data for the GPT Coffee API.
 * Used by the mock server to return deterministic responses during Playwright tests.
 */

export const mockUsers = [
  {
    id: "user-buyer-1",
    name: "Maya Buyer",
    email: "buyer@gptcoffee.test",
    password: "buyer123",
    role: "buyer",
  },
  {
    id: "user-admin-1",
    name: "Ari Admin",
    email: "admin@gptcoffee.test",
    password: "admin123",
    role: "admin",
  },
];

export const mockTokens = {
  "buyer@gptcoffee.test": "mock-token-buyer-1",
  "admin@gptcoffee.test": "mock-token-admin-1",
};

export const mockProducts = [
  {
    id: "espresso",
    name: "Espresso",
    note: "Bold & Concentrated",
    description:
      "A rich, full-bodied shot pulled from finely ground dark roast beans. The foundation of all great coffee drinks.",
    price: 3.5,
    strength: "Strong",
    gradient: "from-stone-700 via-stone-900 to-stone-950",
  },
  {
    id: "latte",
    name: "Latte",
    note: "Smooth & Creamy",
    description:
      "Velvety steamed milk poured over a double shot of espresso, topped with a thin layer of microfoam.",
    price: 5.5,
    strength: "Balanced",
    gradient: "from-amber-300 via-orange-500 to-stone-900",
  },
  {
    id: "cold-brew",
    name: "Cold Brew",
    note: "Chilled & Refreshing",
    description:
      "Steeped for 18 hours in cold water, producing a naturally sweet, low-acidity coffee served over ice.",
    price: 6.0,
    strength: "Medium",
    gradient: "from-sky-700 via-blue-900 to-stone-950",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    note: "Classic Italian",
    description:
      "Equal parts espresso, steamed milk, and thick foam. A timeless drink that balances intensity and texture.",
    price: 5.0,
    strength: "Balanced",
    gradient: "from-amber-700 via-orange-800 to-stone-950",
  },
];

export const mockCustomizations = {
  sizes: [
    { id: "small", label: "Small", price: 0 },
    { id: "medium", label: "Medium", price: 0.5 },
    { id: "large", label: "Large", price: 1.0 },
  ],
  milks: [
    { id: "whole", label: "Whole Milk", price: 0 },
    { id: "oat", label: "Oat Milk", price: 0.75 },
    { id: "almond", label: "Almond Milk", price: 0.75 },
    { id: "none", label: "No Milk", price: 0 },
  ],
  extras: [
    { id: "extra-shot", label: "Extra Shot", price: 1.0 },
    { id: "vanilla-syrup", label: "Vanilla Syrup", price: 0.5 },
    { id: "caramel-drizzle", label: "Caramel Drizzle", price: 0.5 },
    { id: "whipped-cream", label: "Whipped Cream", price: 0.75 },
  ],
};

export const mockOrders = [
  {
    id: "order-001",
    buyerId: "user-buyer-1",
    buyerName: "Maya Buyer",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    status: "Preparing",
    items: [
      {
        id: "item-001",
        productName: "Latte",
        size: "Medium",
        milk: "Oat Milk",
        extras: ["Vanilla Syrup"],
        quantity: 1,
        total: 6.75,
      },
    ],
    total: 6.75,
  },
];

export const mockSales = {
  daily: 142.5,
  monthly: 3200.0,
  total: 48750.0,
  orderCount: 87,
};
