import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../../../ui_test/helpers/execution-recorder.js";
import { mockMenuApi } from "../../../../ui_test/helpers/mock-api.js";

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

test("Display Daily Sales Metrics Aggregated from Completed Orders", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("daily_sales_metrics_aggregated_from_completed_orders", "Display Daily Sales Metrics Aggregated from Completed Orders");

  await recorder.step("Mock admin login and dashboard data with same-day completed orders totaling twenty-one dollars");
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
    ],
  });
  await mockJson(page, "GET", "/api/admin/sales", {
    orderCount: 3,
    daily: 21,
    monthly: 21,
    total: 21,
  });

  await recorder.step("Open the administrator dashboard containing the OrderHistory component");
  await page.goto("/");
  await page.getByPlaceholder("you@example.com").fill("admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("admin123");
  await page.getByRole("button", { name: "Login" }).click();

  await recorder.step("Locate the daily sales metrics section");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByText("Daily sales")).toBeVisible();

  await recorder.step("Compare the displayed daily total sales value against the sum of completed orders for that day");
  await expect(page.getByText("$21.00")).toBeVisible();
  await expect(page.getByText("ORD-3001")).toBeVisible();
  await expect(page.getByText("ORD-3002")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:daily_sales_metrics_aggregated_from_completed_orders");
  await recorder.save(testInfo);
});
