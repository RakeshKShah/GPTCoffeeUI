import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";

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
      id: "ORD-2001",
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
          total: 12.5,
        },
      ],
      total: 12.5,
    },
    {
      id: "ORD-2002",
      buyerId: "buyer-2",
      buyerName: "Noah Buyer",
      createdAt: "2026-07-06T10:05:00.000Z",
      readyAt: "2026-07-06T10:25:00.000Z",
      status: "Completed",
      items: [
        {
          id: "item-2",
          productName: "Velvet Latte",
          size: "Medium",
          milk: "Whole",
          extras: ["Vanilla"],
          quantity: 1,
          total: 17.25,
        },
      ],
      total: 17.25,
    },
  ],
};

const salesResponse = {
  daily: 29.75,
  monthly: 29.75,
  total: 29.75,
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

test("Display Daily Total Sales Metrics", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_dashboard_displays_daily_sales_metrics", testInfo);

  await recorder.step("Given an authenticated administrator and multiple completed orders for the same day");
  await seedAdminSession(page);
  await mockAdminApis(page);

  await recorder.step("When the administrator opens the AdminDashboard component");
  await page.goto("/");

  await recorder.step("Then the daily sales metric shows the aggregated total from completed orders");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByText("Daily sales")).toBeVisible();
  await expect(page.getByText("$29.75")).toBeVisible();
  await expect(page.getByText("Orders")).toBeVisible();
  await expect(page.getByText("2")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_dashboard_displays_daily_sales_metrics");
  await recorder.save(testInfo);
});
