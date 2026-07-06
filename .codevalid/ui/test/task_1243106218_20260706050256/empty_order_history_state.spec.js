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

test("Display Empty State When No Orders Exist", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("empty_order_history_state", "Display Empty State When No Orders Exist");

  await recorder.step("Mock admin login and an empty dashboard with zero sales and no orders");
  await mockMenuApi(page, "admin_dashboard_empty");
  await mockJson(page, "POST", "/api/auth/login", {
    token: "admin-token",
    user: {
      id: "admin-1",
      name: "Avery Admin",
      email: "admin@gptcoffee.test",
      role: "admin",
    },
  });
  await mockJson(page, "GET", "/api/admin/orders", { orders: [] });
  await mockJson(page, "GET", "/api/admin/sales", {
    orderCount: 0,
    daily: 0,
    monthly: 0,
    total: 0,
  });

  await recorder.step("Open the administrator dashboard containing the OrderHistory component");
  await page.goto("/");
  await page.getByPlaceholder("you@example.com").fill("admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("admin123");
  await page.getByRole("button", { name: "Login" }).click();

  await recorder.step("Observe the order history section");
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
  await expect(page.getByRole("row", { name: /Order Buyer Pickup Items Status Total/i })).toBeVisible();

  await recorder.step("Observe the daily and monthly sales metrics");
  await expect(page.getByText("Orders")).toBeVisible();
  await expect(page.getByText("Daily sales")).toBeVisible();
  await expect(page.getByText("Monthly sales")).toBeVisible();
  await expect(page.getByText("$0.00")).toHaveCount(3);
  await expect(page.getByText("0")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:empty_order_history_state");
  await recorder.save(testInfo);
});
