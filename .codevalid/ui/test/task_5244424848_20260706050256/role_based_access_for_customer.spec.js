import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockBuyerLoginFlow } from "../../helpers/mock-api.js";

test("Role-Based Access for Customer User", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("role_based_access_for_customer", "Role-Based Access for Customer User");

  await recorder.step("Open the authentication screen with buyer login mocks.");
  await mockBuyerLoginFlow(page, {
    loginScenario: "buyer_success",
    menuScenario: "default",
    ordersScenario: "empty"
  });

  await page.goto("/");
  await expect(page.locator("form").getByRole("button").last()).toBeVisible();

  await recorder.step("Log in using valid customer credentials.");
  await page.getByPlaceholder("you@example.com").fill("buyer@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("buyer123");
  await page.locator("form").getByRole("button").last().click();

  await recorder.step("Observe the functionality available after authentication.");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByText("Your Cart")).toBeVisible();
  await expect(page.getByText("Customize every cup and check out for pickup.")).toBeVisible();
  await expect(page.getByText("Admin Dashboard")).toHaveCount(0);
  await expect(page.getByText("Daily sales")).toHaveCount(0);
  await expect(page.getByText("Monthly sales")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:role_based_access_for_customer");
  await recorder.save(testInfo);
});
