import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../../../ui_test/helpers/execution-recorder.js";
import { mockBuyerLoginFlow } from "../../../../ui_test/helpers/mock-api.js";

test("Authentication Using Preconfigured Sample Buyer Account", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("sample_buyer_account_authentication", "Authentication Using Preconfigured Sample Buyer Account");

  await recorder.step("Open the authentication screen and prepare sample buyer mocks.");
  await mockBuyerLoginFlow(page, {
    loginScenario: "buyer_success",
    menuScenario: "default",
    ordersScenario: "empty"
  });

  await page.goto("/");
  await expect(page.getByText("Sample buyer")).toBeVisible();
  await expect(page.getByText("buyer@gptcoffee.test")).toBeVisible();
  await expect(page.getByText("buyer123")).toBeVisible();

  await recorder.step("Enter the credentials for the preconfigured sample buyer account.");
  await page.getByPlaceholder("you@example.com").fill("buyer@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("buyer123");

  await recorder.step("Submit the login form.");
  await page.getByRole("button", { name: /^login$/i }).click();

  await recorder.step("Observe the authenticated buyer experience.");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByText("Your Cart")).toBeVisible();
  await expect(page.getByText("Admin Dashboard")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:sample_buyer_account_authentication");
  await recorder.save(testInfo);
});
