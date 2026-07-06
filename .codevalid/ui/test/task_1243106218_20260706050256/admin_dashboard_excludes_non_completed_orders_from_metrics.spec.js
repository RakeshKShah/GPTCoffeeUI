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
      id: "ORD-4001",
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
          extras: [],
          quantity: 1,
          total: 10,
        },
      ],
      total: 10,
    },
    {
      id: "ORD-4002",
      buyerId: "buyer-2",
      buyerName: "Noah Buyer",
      createdAt: "2026-07-06T09:15:00.000Z",
      readyAt: "2026-07-06T09:35:00.000Z",
      status: "Preparing",
      items: [
        {
          id: "item-2",
          productName: "Velvet Latte",
          size: "Small",
          milk: "Whole",
          extras: [],
          quantity: 1,
          total: 7,
        },
      ],
      total: 7,
    },
    {
      id: "ORD-4003",
      buyerId: "buyer-3",
      buyerName: "Ivy Buyer",
      createdAt: "2026-07-06T10:15:00.000Z",
      readyAt: "2026-07-06T10:35:00.000Z",
      status: "Completed",
      items: [
        {
          id: "item-3",
          productName: "Velvet Latte",
          size: "Large",
          milk: "Whole",
          extras: ["Vanilla"],
          quantity: 1,
          total: 15,
        },
      ],
      total: 15,
    },
  ],
};

const salesResponse = {
  daily: 25,
  monthly: 25,
  total: 25,
  orderCount: 2,
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

test("Exclude Non-Completed Orders from Sales Metrics", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_dashboard_excludes_non_completed_orders_from_metrics", testInfo);

  await recorder.step("Given an authenticated administrator and a mix of completed and non-completed orders");
  await seedAdminSession(page);
  await mockAdminApis(page);

  await recorder.step("When the administrator opens the AdminDashboard component");
  await page.goto("/");

  await recorder.step("Then daily and monthly sales metrics reflect completed orders only");
  await expect(page.getByText("Daily sales")).toBeVisible();
  await expect(page.getByText("Monthly sales")).toBeVisible();
  await expect(page.getByText("$25.00")).toHaveCount(3);
  await expect(page.getByRole("cell", { name: "ORD-4002" })).toBeVisible();
  await expect(page.locator("select").nth(1)).toHaveValue("Preparing");
  await expect(page.getByText("Orders")).toBeVisible();
  await expect(page.getByText("2")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_dashboard_excludes_non_completed_orders_from_metrics");
  await recorder.save(testInfo);
});
