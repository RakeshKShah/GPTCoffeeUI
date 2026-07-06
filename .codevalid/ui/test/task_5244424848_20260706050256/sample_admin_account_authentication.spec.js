import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockAdminLoginFlow } from "../../helpers/mock-api.js";

test("Authentication Using Preconfigured Sample Administrator Account", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("sample_admin_account_authentication", "Authentication Using Preconfigured Sample Administrator Account");

  await recorder.step("Open the authentication screen and prepare sample administrator mocks.");
  await mockAdminLoginFlow(page, {
    loginScenario: "success",
    menuScenario: "default"
  });

  await page.goto("/");
  await expect(page.getByText("Sample admin")).toBeVisible();
  await expect(page.getByText("admin@gptcoffee.test")).toBeVisible();
  await expect(page.getByText("admin123")).toBeVisible();

  await recorder.step("Enter the credentials for the preconfigured sample administrator account.");
  await page.getByPlaceholder("you@example.com").fill("admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("admin123");

  await recorder.step("Submit the login form.");
  await page.locator("form").getByRole("button").last().click();

  await recorder.step("Observe the authenticated administrator experience.");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: /manage orders from anywhere\./i })).toBeVisible();
  await expect(page.getByText("Daily sales")).toBeVisible();
  await expect(page.getByText("Signature drinks")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:sample_admin_account_authentication");
  await recorder.save(testInfo);
});
