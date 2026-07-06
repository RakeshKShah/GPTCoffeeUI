import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockAdminLoginFlow } from "../../helpers/mock-api.js";

test("Administrator accesses option management functionality", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("option_manager_admin_access_placeholder", testInfo);

  await recorder.step("Register admin authentication and dashboard API mocks.");
  await mockAdminLoginFlow(page, { loginScenario: "success", menuScenario: "default" });

  await recorder.step("Navigate to the application authentication entry point.");
  await page.goto("/");
  await expect(page.getByText("GPT Coffee")).toBeVisible();

  await recorder.step("Authenticate as an administrator using the login form.");
  await page.getByLabel("Email").fill("admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("admin123");
  await page.locator("form").getByRole("button").last().click();

  await recorder.step("Verify the administrator reaches the dashboard and option management interfaces.");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
  await expect(page.getByText("sizes")).toBeVisible();
  await expect(page.getByText("milks")).toBeVisible();
  await expect(page.getByText("extras")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:option_manager_admin_access_placeholder");
  await recorder.save(testInfo);
});
