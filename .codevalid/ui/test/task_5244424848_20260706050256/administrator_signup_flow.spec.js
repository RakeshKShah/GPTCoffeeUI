import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockMenuApi } from "../helpers/mock-api.js";

const adminUser = {
  id: "admin-new-1",
  name: "Dana Administrator",
  email: "dana.admin@gptcoffee.test",
  role: "admin",
};

async function mockJsonRoute(page, method, endpointPath, responseBody, status = 200) {
  await page.route(new RegExp(`${endpointPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), async (route) => {
    if (route.request().method().toUpperCase() !== method.toUpperCase()) {
      return route.fallback();
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(responseBody),
    });
  });
}

test("Administrator Account Creation and Authentication", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("administrator_signup_flow", testInfo);

  await recorder.step("Register signup, login, menu, admin orders, and sales mocks");
  await mockMenuApi(page, "default");
  await mockJsonRoute(page, "POST", "/api/auth/signup", {
    token: "admin-new-token",
    user: adminUser,
  });
  await mockJsonRoute(page, "POST", "/api/auth/login", {
    token: "admin-new-token",
    user: adminUser,
  });
  await mockJsonRoute(page, "GET", "/api/admin/orders", {
    orders: [
      {
        id: "ORD-7001",
        buyerId: "buyer-77",
        buyerName: "Launch Buyer",
        createdAt: "2026-07-06T12:00:00.000Z",
        readyAt: "2026-07-06T12:15:00.000Z",
        status: "Placed",
        items: [{ id: "line-1", productName: "Honey Oat Latte", quantity: 1, total: 6.5 }],
        total: 6.5,
      },
    ],
  });
  await mockJsonRoute(page, "GET", "/api/admin/sales", {
    orderCount: 1,
    daily: 6.5,
    monthly: 6.5,
    total: 6.5,
  });

  await recorder.step("Open the application");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Order from home. Pick up when your cup is ready." })).toBeVisible();

  await recorder.step("Navigate to sign up mode");
  await page.getByRole("button", { name: "signup" }).click();
  await expect(page.getByLabel("Name")).toBeVisible();

  await recorder.step("Create a new administrator account and submit registration");
  await page.getByLabel("Name").fill("Dana Administrator");
  await page.getByLabel("Email").fill("dana.admin@gptcoffee.test");
  await page.getByLabel("Password").fill("adminplus123");
  await page.getByRole("button", { name: "Create buyer account" }).click();

  await recorder.step("Verify the new administrator is authenticated into management functionality");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();

  await recorder.step("Log out and log in again with the newly created administrator credentials");
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  await page.getByLabel("Email").fill("dana.admin@gptcoffee.test");
  await page.getByLabel("Password").fill("adminplus123");
  await page.getByRole("button", { name: "Login" }).click();

  await recorder.step("Confirm administrator management functionality remains accessible after login");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:administrator_signup_flow");
  await recorder.save(testInfo);
});
