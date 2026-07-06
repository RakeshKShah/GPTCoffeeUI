import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockMenuApi, mockAdminLoginFlow } from "../helpers/mock-api.js";

test("Administrator Login Grants Access to Management Functionality", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("administrator_login_enables_management_access", "Administrator Login Grants Access to Management Functionality");

  await recorder.step("Register menu and admin authentication mocks", async () => {
    await mockMenuApi(page, "default");
    await mockAdminLoginFlow(page, { loginScenario: "success", menuScenario: "default" });
  });

  await recorder.step("Launch the application", async () => {
    await page.goto("/");
  });

  await recorder.step("Open the AuthScreen", async () => {
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });

  await recorder.step("Enter valid administrator credentials", async () => {
    await page.getByRole("button", { name: /use sample admin/i }).click();
    await expect(page.getByLabel("Email")).toHaveValue("admin@gptcoffee.test");
    await expect(page.getByLabel("Password")).toHaveValue("admin123");
  });

  await recorder.step("Submit the authentication form", async () => {
    await page.getByRole("button", { name: /^Login$/ }).click();
  });

  await recorder.step("Observe the application after successful authentication", async () => {
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:administrator_login_enables_management_access");
  await recorder.save(testInfo);
});
