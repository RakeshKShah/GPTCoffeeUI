import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockMenuApi, mockAdminLoginFlow } from "../helpers/mock-api.js";

test("Authenticated Administrator Can Access Drink Customization Management", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("authenticated_admin_can_access_customization_management", "Authenticated Administrator Can Access Drink Customization Management");

  await recorder.step("Register admin login and dashboard mocks", async () => {
    await mockMenuApi(page, "default");
    await mockAdminLoginFlow(page, { loginScenario: "success", menuScenario: "default" });
  });

  await recorder.step("Authenticate as an administrator", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: /use sample admin/i }).click();
    await page.getByRole("button", { name: /^Login$/ }).click();
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
  });

  await recorder.step("Navigate to the available customization management functionality", async () => {
    await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
    await page.getByRole("heading", { name: "Customization options" }).scrollIntoViewIfNeeded();
  });

  await recorder.step("Observe available customization management controls", async () => {
    await expect(page.getByText("sizes")).toBeVisible();
    await expect(page.getByText("milks")).toBeVisible();
    await expect(page.getByText("extras")).toBeVisible();
    await expect(page.getByPlaceholder("New sizes")).toBeVisible();
    await expect(page.getByPlaceholder("New milks")).toBeVisible();
    await expect(page.getByPlaceholder("New extras")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save all" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add" }).nth(0)).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:authenticated_admin_can_access_customization_management");
  await recorder.save(testInfo);
});
