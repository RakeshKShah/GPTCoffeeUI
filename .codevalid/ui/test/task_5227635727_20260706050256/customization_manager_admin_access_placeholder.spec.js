import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockAdminLoginFlow } from "../helpers/mock-api.js";

test("Administrator can access customization management functionality", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("customization_manager_admin_access_placeholder", "Administrator can access customization management functionality");

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await mockAdminLoginFlow(page, { loginScenario: "success", menuScenario: "default" });

  await recorder.step("Open the authentication screen", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "GPT Coffee" })).toBeVisible();
  });

  await recorder.step("Log in using administrator credentials", async () => {
    await page.getByLabel("Email").fill("admin@gptcoffee.test");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Login" }).click();
  });

  await recorder.step("Navigate to the customization management area on the admin dashboard", async () => {
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save all" })).toBeVisible();
    await expect(page.getByPlaceholder("New sizes")).toBeVisible();
    await expect(page.getByPlaceholder("New milks")).toBeVisible();
    await expect(page.getByPlaceholder("New extras")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customization_manager_admin_access_placeholder");
  await recorder.save(testInfo);
});
