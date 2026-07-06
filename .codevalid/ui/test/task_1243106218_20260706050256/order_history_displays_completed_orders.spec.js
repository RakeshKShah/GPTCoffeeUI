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

test("Display Order History for Completed Orders", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("order_history_displays_completed_orders", "Display Order History for Completed Orders");

  await recorder.step("Mock admin login, menu, order history, and sales endpoints for completed orders");
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
    orderCount: 4,
    daily: 21,
    monthly: 39.5,
    total: 39.5,
  });

  await recorder.step("Open the administrator dashboard login screen");
  await page.goto("/");
  await expect(page.getByText("Sample admin")).toBeVisible();

  await recorder.step("Log in as administrator");
  await page.getByRole("button", { name: "Use admin credentials" }).click().catch(async () => {
    await page.getByRole("button", { name: "Login" }).click({ trial: true }).catch(() => {});
    await page.getByPlaceholder("you@example.com").fill("admin@gptcoffee.test");
    await page.getByPlaceholder("••••••••").fill("admin123");
    await page.getByRole("button", { name: "Login" }).click();
  });

  await recorder.step("Observe the displayed order history data");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
  await expect(page.getByText("ORD-3001")).toBeVisible();
  await expect(page.getByText("ORD-3002")).toBeVisible();
  await expect(page.getByText("ORD-2999")).toBeVisible();

  await recorder.step("Identify completed orders shown in the order history");
  await expect(page.getByDisplayValue("Completed").first()).toBeVisible();
  await expect(page.getByText("Maya Buyer")).toBeVisible();
  await expect(page.getByText("Jordan Bean")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:order_history_displays_completed_orders");
  await recorder.save(testInfo);
});
