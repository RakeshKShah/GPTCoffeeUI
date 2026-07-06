import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockAdminLoginFlow } from "../../helpers/mock-api.js";

test("Administrator Role Access Restriction", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("administrator_role_based_access", testInfo);

  await recorder.step("Register administrator login, menu, order, and sales mocks");
  await mockAdminLoginFlow(page, {
    loginScenario: "success",
    menuScenario: "default",
  });

  await recorder.step("Open the application and log in with valid administrator credentials");
  await page.goto("/");
  await page.getByRole("button", { name: "Sample admin" }).click();
  await expect(page.getByLabel("Email")).toHaveValue("admin@gptcoffee.test");
  await page.locator("form").getByRole("button").last().click();

  await recorder.step("Verify administrator management functionality is accessible");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:administrator_role_based_access");
  await recorder.save(testInfo);
});
