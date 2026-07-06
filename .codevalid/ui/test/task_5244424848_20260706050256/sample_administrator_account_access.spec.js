import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockAdminLoginFlow } from "../../helpers/mock-api.js";

test("Preconfigured Sample Administrator Account Authentication", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("sample_administrator_account_access", testInfo);

  await recorder.step("Register sample administrator login, menu, order, and sales mocks");
  await mockAdminLoginFlow(page, {
    loginScenario: "success",
    menuScenario: "default",
  });

  await recorder.step("Open the application and use the sample administrator account card");
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Sample admin" })).toBeVisible();
  await page.getByRole("button", { name: "Sample admin" }).click();
  await expect(page.getByLabel("Email")).toHaveValue("admin@gptcoffee.test");
  await expect(page.getByLabel("Password")).toHaveValue("admin123");

  await recorder.step("Authenticate with the sample administrator credentials");
  await page.locator("form").getByRole("button").last().click();

  await recorder.step("Verify administrator management functionality is accessible");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:sample_administrator_account_access");
  await recorder.save(testInfo);
});
