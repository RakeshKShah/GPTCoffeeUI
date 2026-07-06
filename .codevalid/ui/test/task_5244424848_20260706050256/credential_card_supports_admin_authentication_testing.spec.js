import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockAdminLoginFlow } from "../../helpers/mock-api.js";

test("Use displayed administrator credentials for admin authentication", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("credential_card_supports_admin_authentication_testing", testInfo.title);

  await recorder.step("Register admin login, menu, admin orders, and admin sales mocks for the administrator authentication flow.");
  await mockAdminLoginFlow(page, {
    loginScenario: "success",
    menuScenario: "default",
  });

  await recorder.step("Open the application and confirm the sample administrator credentials are visible.");
  await page.goto("/");
  await expect(page.getByText("Sample admin")).toBeVisible();
  await expect(page.getByText("admin@gptcoffee.test")).toBeVisible();
  await expect(page.getByText("admin123")).toBeVisible();

  await recorder.step("Use the displayed administrator credentials during login via the sample admin credential card.");
  await page.getByRole("button", { name: /Sample admin[\s\S]*admin@gptcoffee\.test[\s\S]*admin123/i }).click();
  await expect(page.getByLabel("Email")).toHaveValue("admin@gptcoffee.test");
  await expect(page.getByLabel("Password")).toHaveValue("admin123");

  await recorder.step("Complete authentication by submitting the login form.");
  await page.locator("form").getByRole("button").last().click();

  await recorder.step("Verify administrator management functionality is accessible after authentication.");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:credential_card_supports_admin_authentication_testing");
  await recorder.save(testInfo);
});
