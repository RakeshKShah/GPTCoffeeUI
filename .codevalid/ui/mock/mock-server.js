/**
 * Mock API server for GPT Coffee Playwright tests.
 *
 * Starts an HTTP server on port 4100 (matching VITE_API_URL / API_BASE in App.tsx)
 * and responds with deterministic mock data so tests run without a real backend.
 *
 * Usage:
 *   node .codevalid/ui/mock/mock-server.js
 *
 * Or imported and controlled programmatically:
 *   import { startMockServer, stopMockServer } from './mock/mock-server.js';
 */

import http from "http";
import {
  mockUsers,
  mockTokens,
  mockProducts,
  mockCustomizations,
  mockOrders,
  mockSales,
} from "./mock-data.js";

const PORT = process.env.MOCK_API_PORT || 4100;

// In-memory mutable state so tests can create orders and see them reflected.
let products = [...mockProducts];
let customizations = { ...mockCustomizations };
let orders = [...mockOrders];
let sales = { ...mockSales };

function resetState() {
  products = [...mockProducts];
  customizations = {
    sizes: [...mockCustomizations.sizes],
    milks: [...mockCustomizations.milks],
    extras: [...mockCustomizations.extras],
  };
  orders = [...mockOrders];
  sales = { ...mockSales };
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

function json(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function getUserFromToken(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.replace("Bearer ", "").trim();
  const email = Object.keys(mockTokens).find((e) => mockTokens[e] === token);
  if (!email) return null;
  return mockUsers.find((u) => u.email === email) || null;
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname; // e.g. /api/menu

  // CORS pre-flight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  // -----------------------------------------------------------------------
  // POST /api/auth/login
  // -----------------------------------------------------------------------
  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await parseBody(req);
    const user = mockUsers.find(
      (u) => u.email === body.email && u.password === body.password
    );
    if (!user) {
      return json(res, 401, { message: "Invalid email or password." });
    }
    return json(res, 200, {
      token: mockTokens[user.email],
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  }

  // -----------------------------------------------------------------------
  // POST /api/auth/signup
  // -----------------------------------------------------------------------
  if (req.method === "POST" && pathname === "/api/auth/signup") {
    const body = await parseBody(req);
    const existing = mockUsers.find((u) => u.email === body.email);
    if (existing) {
      return json(res, 409, { message: "Email already registered." });
    }
    const newUser = {
      id: `user-${Date.now()}`,
      name: body.name || "Coffee Guest",
      email: body.email,
      password: body.password,
      role: "buyer",
    };
    mockUsers.push(newUser);
    const token = `mock-token-${newUser.id}`;
    mockTokens[newUser.email] = token;
    return json(res, 200, {
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  }

  // -----------------------------------------------------------------------
  // GET /api/menu
  // -----------------------------------------------------------------------
  if (req.method === "GET" && pathname === "/api/menu") {
    return json(res, 200, { products, customizations });
  }

  // -----------------------------------------------------------------------
  // GET /api/orders/my  (buyer)
  // -----------------------------------------------------------------------
  if (req.method === "GET" && pathname === "/api/orders/my") {
    const user = getUserFromToken(req);
    if (!user) return json(res, 401, { message: "Unauthorized." });
    const userOrders = orders.filter((o) => o.buyerId === user.id);
    return json(res, 200, { orders: userOrders });
  }

  // -----------------------------------------------------------------------
  // POST /api/orders  (buyer checkout)
  // -----------------------------------------------------------------------
  if (req.method === "POST" && pathname === "/api/orders") {
    const user = getUserFromToken(req);
    if (!user) return json(res, 401, { message: "Unauthorized." });
    const body = await parseBody(req);
    const total = (body.items || []).reduce((s, i) => s + (i.total || 0), 0);
    const newOrder = {
      id: `order-${Date.now()}`,
      buyerId: user.id,
      buyerName: user.name,
      createdAt: new Date().toISOString(),
      readyAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: "Placed",
      items: body.items || [],
      total,
    };
    orders.unshift(newOrder);
    sales.orderCount += 1;
    sales.daily += total;
    sales.total += total;
    return json(res, 200, { order: newOrder });
  }

  // -----------------------------------------------------------------------
  // GET /api/admin/orders  (admin)
  // -----------------------------------------------------------------------
  if (req.method === "GET" && pathname === "/api/admin/orders") {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin")
      return json(res, 403, { message: "Forbidden." });
    return json(res, 200, { orders });
  }

  // -----------------------------------------------------------------------
  // GET /api/admin/sales  (admin)
  // -----------------------------------------------------------------------
  if (req.method === "GET" && pathname === "/api/admin/sales") {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin")
      return json(res, 403, { message: "Forbidden." });
    return json(res, 200, sales);
  }

  // -----------------------------------------------------------------------
  // PATCH /api/admin/orders/:id/status  (admin)
  // -----------------------------------------------------------------------
  const orderStatusMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)\/status$/);
  if (req.method === "PATCH" && orderStatusMatch) {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin")
      return json(res, 403, { message: "Forbidden." });
    const orderId = orderStatusMatch[1];
    const body = await parseBody(req);
    const order = orders.find((o) => o.id === orderId);
    if (!order) return json(res, 404, { message: "Order not found." });
    order.status = body.status;
    return json(res, 200, { order });
  }

  // -----------------------------------------------------------------------
  // POST /api/admin/products  (admin – add product)
  // -----------------------------------------------------------------------
  if (req.method === "POST" && pathname === "/api/admin/products") {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin")
      return json(res, 403, { message: "Forbidden." });
    const body = await parseBody(req);
    const newProduct = { ...body, id: body.id || `product-${Date.now()}` };
    products.unshift(newProduct);
    return json(res, 200, { product: newProduct });
  }

  // -----------------------------------------------------------------------
  // PATCH /api/admin/products/:id  (admin – edit product)
  // -----------------------------------------------------------------------
  const productPatchMatch = pathname.match(/^\/api\/admin\/products\/([^/]+)$/);
  if (req.method === "PATCH" && productPatchMatch) {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin")
      return json(res, 403, { message: "Forbidden." });
    const productId = productPatchMatch[1];
    const body = await parseBody(req);
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) return json(res, 404, { message: "Product not found." });
    products[idx] = { ...products[idx], ...body };
    return json(res, 200, { product: products[idx] });
  }

  // -----------------------------------------------------------------------
  // DELETE /api/admin/products/:id  (admin)
  // -----------------------------------------------------------------------
  if (req.method === "DELETE" && productPatchMatch) {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin")
      return json(res, 403, { message: "Forbidden." });
    const productId = productPatchMatch[1];
    const before = products.length;
    products = products.filter((p) => p.id !== productId);
    if (products.length === before)
      return json(res, 404, { message: "Product not found." });
    res.writeHead(204, { "Access-Control-Allow-Origin": "*" });
    res.end();
    return;
  }

  // -----------------------------------------------------------------------
  // PUT /api/admin/customizations  (admin)
  // -----------------------------------------------------------------------
  if (req.method === "PUT" && pathname === "/api/admin/customizations") {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin")
      return json(res, 403, { message: "Forbidden." });
    const body = await parseBody(req);
    customizations = body.customizations || customizations;
    return json(res, 200, { customizations });
  }

  // -----------------------------------------------------------------------
  // POST /api/_reset  – test helper to restore initial state
  // -----------------------------------------------------------------------
  if (req.method === "POST" && pathname === "/api/_reset") {
    resetState();
    return json(res, 200, { ok: true });
  }

  // -----------------------------------------------------------------------
  // 404 fallback
  // -----------------------------------------------------------------------
  json(res, 404, { message: `Not found: ${pathname}` });
}

let server = null;

export function startMockServer(port = PORT) {
  return new Promise((resolve, reject) => {
    if (server) {
      resolve(server);
      return;
    }
    resetState();
    server = http.createServer(handleRequest);
    server.listen(port, "0.0.0.0", () => {
      console.log(`[mock-server] GPT Coffee mock API listening on http://localhost:${port}/api`);
      resolve(server);
    });
    server.on("error", reject);
  });
}

export function stopMockServer() {
  return new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    server.close(() => {
      server = null;
      resolve();
    });
  });
}

// Allow running directly: node .codevalid/ui/mock/mock-server.js
const isMain =
  process.argv[1] &&
  new URL(process.argv[1], "file://").pathname.endsWith("mock-server.js");

if (isMain) {
  startMockServer().catch((err) => {
    console.error("[mock-server] Failed to start:", err);
    process.exit(1);
  });
}
