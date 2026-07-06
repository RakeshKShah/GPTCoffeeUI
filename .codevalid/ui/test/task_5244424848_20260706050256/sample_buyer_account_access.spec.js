import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockBuyerLoginFlow } from "../helpers/mock-api.js";

test("Preconfigured Sample Buyer Account Authentication", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("sample_buyer_account_access", testInfo);

  await recorder.step("Register sample buyer login, menu, and order mocks");
  await mockBuyerLoginFlow(page, {
    loginScenario: "buyer_success",
    menuScenario: "default",
    ordersScenario: "empty",
  });

  await recorder.step("Open the application and use the sample buyer account card");
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sample buyer" })).toBeVisible();
  await page.getByRole("button", { name: "Sample buyer" }).click();
  await expect(page.getByLabel("Email")).toHaveValue("buyer@gptcoffee.test");
  await expect(page.getByLabel("Password")).toHaveValue("buyer123");

  await recorder.step("Authenticate with the sample buyer credentials");
  await page.getByRole("button", { name: "Login" }).click();

  await recorder.step("Verify customer ordering functionality is accessible");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
  await expect(page.getByText("Customize every cup and check out for pickup.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:sample_buyer_account_access");
  await recorder.save(testInfo);
});
