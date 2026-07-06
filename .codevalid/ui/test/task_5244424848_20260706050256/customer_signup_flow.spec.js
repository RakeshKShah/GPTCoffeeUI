import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockMenuApi } from "../../helpers/mock-api.js";

const buyerUser = {
  id: "buyer-new-1",
  name: "Casey Customer",
  email: "casey.customer@gptcoffee.test",
  role: "buyer",
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

test("Customer Account Creation and Authentication", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("customer_signup_flow", testInfo);

  await recorder.step("Register signup, login, menu, and buyer order mocks");
  await mockMenuApi(page, "default");
  await mockJsonRoute(page, "POST", "/api/auth/signup", {
    token: "buyer-new-token",
    user: buyerUser,
  });
  await mockJsonRoute(page, "POST", "/api/auth/login", {
    token: "buyer-new-token",
    user: buyerUser,
  });
  await mockJsonRoute(page, "GET", "/api/orders/my", { orders: [] });

  await recorder.step("Open the application");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Order from home. Pick up when your cup is ready." })).toBeVisible();

  await recorder.step("Navigate to sign up mode");
  await page.getByRole("button", { name: "signup" }).click();
  await expect(page.getByLabel("Name")).toBeVisible();

  await recorder.step("Create a new customer account and submit registration");
  await page.getByLabel("Name").fill("Casey Customer");
  await page.getByLabel("Email").fill("casey.customer@gptcoffee.test");
  await page.getByLabel("Password").fill("caseyPass123");
  await page.getByRole("button", { name: "Create buyer account" }).click();

  await recorder.step("Verify the new customer is authenticated into buyer ordering functionality");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
  await expect(page.getByText("Customize every cup and check out for pickup.")).toBeVisible();

  await recorder.step("Log out and log in again with the newly created customer credentials");
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.locator("form").getByRole("button").last()).toBeVisible();
  await page.getByLabel("Email").fill("casey.customer@gptcoffee.test");
  await page.getByLabel("Password").fill("caseyPass123");
  await page.locator("form").getByRole("button").last().click();

  await recorder.step("Confirm customer ordering functionality remains accessible after login");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByText("Start an order")).toBeVisible();
  await expect(page.getByText("Admin Dashboard")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:customer_signup_flow");
  await recorder.save(testInfo);
});
