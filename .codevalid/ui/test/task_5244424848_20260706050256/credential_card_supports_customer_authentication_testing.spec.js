import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockBuyerLoginFlow } from "../helpers/mock-api.js";

test("Use displayed buyer credentials for customer authentication", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("credential_card_supports_customer_authentication_testing", testInfo.title);

  await recorder.step("Register buyer login, menu, and buyer orders mocks for the customer authentication flow.");
  await mockBuyerLoginFlow(page, {
    loginScenario: "buyer_success",
    menuScenario: "default",
    ordersScenario: "empty",
  });

  await recorder.step("Open the application and confirm the sample buyer credentials are visible.");
  await page.goto("/");
  await expect(page.getByText("Sample buyer")).toBeVisible();
  await expect(page.getByText("buyer@gptcoffee.test")).toBeVisible();
  await expect(page.getByText("buyer123")).toBeVisible();

  await recorder.step("Use the displayed buyer credentials during login via the sample buyer credential card.");
  await page.getByRole("button", { name: /Sample buyer[\s\S]*buyer@gptcoffee\.test[\s\S]*buyer123/i }).click();
  await expect(page.getByLabel("Email")).toHaveValue("buyer@gptcoffee.test");
  await expect(page.getByLabel("Password")).toHaveValue("buyer123");

  await recorder.step("Complete authentication by submitting the login form.");
  await page.getByRole("button", { name: /^Login$/ }).click();

  await recorder.step("Verify customer ordering functionality is accessible after authentication.");
  await expect(page.getByText("Signature drinks")).toBeVisible();
  await expect(page.getByText("Customize every cup and check out for pickup.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start an order" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Customize" }).first()).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:credential_card_supports_customer_authentication_testing");
  await recorder.save(testInfo);
});
