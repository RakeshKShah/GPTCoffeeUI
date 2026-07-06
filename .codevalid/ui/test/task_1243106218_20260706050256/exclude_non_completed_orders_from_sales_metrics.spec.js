import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockMenuApi } from "../../helpers/mock-api.js";

async function mockJson(page, method, endpointPath, body, status = 200) {
  await page.route(new RegExp(`${endpointPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), async (route) => {
    if (route.request().method().toUpperCase() !== method.toUpperCase()) {
      return route.fallback();
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

test("Exclude Non-Completed Orders from Aggregated Sales Metrics", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("exclude_non_completed_orders_from_sales_metrics", "Exclude Non-Completed Orders from Aggregated Sales Metrics");

  await recorder.step("Mock admin login and mixed-status orders while sales totals reflect completed orders only");
  await mockMenuApi(page, "default");
  await mockJson(page, "POST", "/api/auth/login", {
    token: "admin-token",
    user: {
      id: "admin-1",
      name: "Avery Admin",
      email: "admin@gptcoffee.test",
      role: "admin",
    },
  });
  await mockJson(page, "GET", "/api/admin/orders", {
    orders: [
      {
        id: "ORD-3001",
        buyerId: "buyer-1",
        buyerName: "Maya Buyer",
        createdAt: "2026-07-06T08:45:00.000Z",
        readyAt: "2026-07-06T09:00:00.000Z",
        status: "Completed",
        items: [{ id: "line-1", productName: "Honey Oat Latte", quantity: 2, total: 13.0 }],
        total: 13.0,
      },
      {
        id: "ORD-3002",
        buyerId: "buyer-2",
        buyerName: "Jordan Bean",
        createdAt: "2026-07-06T10:00:00.000Z",
        readyAt: "2026-07-06T10:20:00.000Z",
        status: "Completed",
        items: [{ id: "line-2", productName: "Midnight Mocha", quantity: 1, total: 8.0 }],
        total: 8.0,
      },
      {
        id: "ORD-3003",
        buyerId: "buyer-3",
        buyerName: "Taylor Roast",
        createdAt: "2026-07-06T11:00:00.000Z",
        readyAt: "2026-07-06T11:20:00.000Z",
        status: "Preparing",
        items: [{ id: "line-3", productName: "Maple Cloud Brew", quantity: 1, total: 6.5 }],
        total: 6.5,
      },
      {
        id: "ORD-3004",
        buyerId: "buyer-5",
        buyerName: "Casey Drip",
        createdAt: "2026-07-02T11:30:00.000Z",
        readyAt: "2026-07-02T12:00:00.000Z",
        status: "Cancelled",
        items: [{ id: "line-5", productName: "Honey Oat Latte", quantity: 1, total: 9.0 }],
        total: 9.0,
      },
      {
        id: "ORD-2999",
        buyerId: "buyer-4",
        buyerName: "Sam Crema",
        createdAt: "2026-07-01T09:00:00.000Z",
        readyAt: "2026-07-01T09:15:00.000Z",
        status: "Completed",
        items: [{ id: "line-4", productName: "Honey Oat Latte", quantity: 1, total: 18.5 }],
        total: 18.5,
      },
    ],
  });
  await mockJson(page, "GET", "/api/admin/sales", {
    orderCount: 5,
    daily: 21,
    monthly: 39.5,
    total: 39.5,
  });

  await recorder.step("Open the administrator dashboard containing the OrderHistory component");
  await page.goto("/");
  await page.getByPlaceholder("you@example.com").fill("admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("admin123");
  await page.locator("form").getByRole("button").last().click();

  await recorder.step("Review the displayed daily and monthly sales totals");
  await expect(page.getByText("Daily sales")).toBeVisible();
  await expect(page.getByText("Monthly sales")).toBeVisible();
  await expect(page.getByText("$21.00")).toBeVisible();
  await expect(page.getByText("$39.50")).toBeVisible();

  await recorder.step("Compare displayed totals against sums calculated using only completed orders");
  await expect(page.getByText("ORD-3003")).toBeVisible();
  await expect(page.getByText("ORD-3004")).toBeVisible();
  await expect(page.getByDisplayValue("Preparing")).toBeVisible();
  await expect(page.getByDisplayValue("Cancelled")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:exclude_non_completed_orders_from_sales_metrics");
  await recorder.save(testInfo);
});
