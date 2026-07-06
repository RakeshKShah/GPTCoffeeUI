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
      id: "ORD-3001",
      buyerId: "buyer-1",
      buyerName: "Maya Buyer",
      createdAt: "2026-07-01T08:15:00.000Z",
      readyAt: "2026-07-01T08:35:00.000Z",
      status: "Completed",
      items: [
        {
          id: "item-1",
          productName: "Velvet Latte",
          size: "Medium",
          milk: "Whole",
          extras: [],
          quantity: 2,
          total: 25,
        },
      ],
      total: 25,
    },
    {
      id: "ORD-3002",
      buyerId: "buyer-2",
      buyerName: "Noah Buyer",
      createdAt: "2026-07-05T10:05:00.000Z",
      readyAt: "2026-07-05T10:25:00.000Z",
      status: "Completed",
      items: [
        {
          id: "item-2",
          productName: "Velvet Latte",
          size: "Medium",
          milk: "Whole",
          extras: ["Vanilla"],
          quantity: 3,
          total: 40,
        },
      ],
      total: 40,
    },
  ],
};

const salesResponse = {
  daily: 40,
  monthly: 65,
  total: 65,
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

test("Display Monthly Total Sales Metrics", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_dashboard_displays_monthly_sales_metrics", testInfo);

  await recorder.step("Given an authenticated administrator and multiple completed orders within the same month");
  await seedAdminSession(page);
  await mockAdminApis(page);

  await recorder.step("When the administrator opens the AdminDashboard component");
  await page.goto("/");

  await recorder.step("Then the monthly sales metric shows the aggregated total from completed orders in the month");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByText("Monthly sales")).toBeVisible();
  await expect(page.getByText("$65.00")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_dashboard_displays_monthly_sales_metrics");
  await recorder.save(testInfo);
});
