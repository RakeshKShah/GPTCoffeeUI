import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";

const adminUser = {
  id: "admin-1",
  name: "Ari Admin",
  email: "admin@gptcoffee.test",
  role: "admin",
};

const menuResponse = {
  products: [
    {
      id: "latte",
      name: "Velvet Latte",
      note: "Smooth & balanced",
      description: "Espresso with silky milk and a mellow finish.",
      price: 6.5,
      strength: "Balanced",
      gradient: "from-amber-300 via-orange-500 to-stone-900",
    },
  ],
  customizations: {
    sizes: [
      { id: "small", label: "Small", price: 0 },
      { id: "medium", label: "Medium", price: 0.5 },
    ],
    milks: [{ id: "whole", label: "Whole", price: 0 }],
    extras: [{ id: "vanilla", label: "Vanilla", price: 0.5 }],
  },
};

const ordersResponse = {
  orders: [
    {
      id: "ORD-1001",
      buyerId: "buyer-1",
      buyerName: "Maya Buyer",
      createdAt: "2026-07-06T08:15:00.000Z",
      readyAt: "2026-07-06T08:35:00.000Z",
      status: "Completed",
      items: [
        {
          id: "item-1",
          productName: "Velvet Latte",
          size: "Medium",
          milk: "Whole",
          extras: ["Vanilla"],
          quantity: 2,
          total: 13.5,
        },
      ],
      total: 13.5,
    },
  ],
};

const salesResponse = {
  daily: 13.5,
  monthly: 13.5,
  total: 13.5,
  orderCount: 1,
};

async function seedAdminSession(page) {
  await page.addInitScript((session) => {
    window.localStorage.setItem("gpt-coffee-token", session.token);
    window.localStorage.setItem("gpt-coffee-user", JSON.stringify(session.user));
  }, { token: "admin-token", user: adminUser });
}

async function mockAdminApis(page) {
  await page.route("**/api/menu", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(menuResponse),
    });
  });

  await page.route("**/api/admin/orders", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ordersResponse),
    });
  });

  await page.route("**/api/admin/sales", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(salesResponse),
    });
  });
}

test("Display Order History on Admin Dashboard", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_dashboard_displays_order_history", testInfo);

  await recorder.step("Given an authenticated administrator with at least one completed order");
  await seedAdminSession(page);
  await mockAdminApis(page);

  await recorder.step("When the administrator opens the AdminDashboard component");
  await page.goto("/");

  await recorder.step("Then the dashboard shows the order history section with completed order records");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "ORD-1001" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Maya Buyer" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "2x Velvet Latte" })).toBeVisible();
  await expect(page.locator("select").first()).toHaveValue("Completed");
  await expect(page.getByRole("cell", { name: "$13.50" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_dashboard_displays_order_history");
  await recorder.save(testInfo);
});
