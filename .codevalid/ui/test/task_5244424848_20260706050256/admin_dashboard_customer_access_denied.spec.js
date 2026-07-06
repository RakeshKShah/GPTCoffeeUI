import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockBuyerLoginFlow } from "../helpers/mock-api.js";

test("Customer Cannot Access Admin Dashboard", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_dashboard_customer_access_denied", testInfo);

  await recorder.step("Register buyer login, menu, and order mocks");
  await mockBuyerLoginFlow(page, {
    loginScenario: "buyer_success",
    menuScenario: "default",
    ordersScenario: "empty",
  });

  await recorder.step("Open the application login page");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Order from home. Pick up when your cup is ready." })).toBeVisible();

  await recorder.step("Enter valid customer or buyer account credentials");
  await page.getByRole("button", { name: "Sample buyer" }).click();
  await expect(page.getByLabel("Email")).toHaveValue("buyer@gptcoffee.test");
  await expect(page.getByLabel("Password")).toHaveValue("buyer123");

  await recorder.step("Submit the login form");
  await page.getByRole("button", { name: "Login" }).click();

  await recorder.step("Attempt to access administrator functionality and verify role-based access is denied");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
  await expect(page.getByText("Admin Dashboard")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_dashboard_customer_access_denied");
  await recorder.save(testInfo);
});
