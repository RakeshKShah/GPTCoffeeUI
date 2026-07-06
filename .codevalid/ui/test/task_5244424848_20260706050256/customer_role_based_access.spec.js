import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockBuyerLoginFlow } from "../helpers/mock-api.js";

test("Customer Role Access Restriction", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("customer_role_based_access", testInfo);

  await recorder.step("Register buyer login, menu, and order mocks");
  await mockBuyerLoginFlow(page, {
    loginScenario: "buyer_success",
    menuScenario: "default",
    ordersScenario: "empty",
  });

  await recorder.step("Open the application and log in with valid customer credentials");
  await page.goto("/");
  await page.getByRole("button", { name: "Sample buyer" }).click();
  await expect(page.getByLabel("Email")).toHaveValue("buyer@gptcoffee.test");
  await page.getByRole("button", { name: "Login" }).click();

  await recorder.step("Verify customer ordering functionality is available");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
  await expect(page.getByText("Pickup order").or(page.getByText("Start an order"))).toBeVisible();

  await recorder.step("Verify administrator management functionality is unavailable to the customer role");
  await expect(page.getByText("Admin Dashboard")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Customization options" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Live order history" })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:customer_role_based_access");
  await recorder.save(testInfo);
});
