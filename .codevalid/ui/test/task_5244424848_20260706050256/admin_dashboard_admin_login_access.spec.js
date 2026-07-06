import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockAdminLoginFlow } from "../helpers/mock-api.js";

test("Administrator Can Access Admin Dashboard", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_dashboard_admin_login_access", testInfo);

  await recorder.step("Register admin login, menu, orders, and sales mocks");
  await mockAdminLoginFlow(page, {
    loginScenario: "success",
    menuScenario: "default",
  });

  await recorder.step("Open the application login page");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Order from home. Pick up when your cup is ready." })).toBeVisible();

  await recorder.step("Enter valid administrator account credentials");
  await page.getByRole("button", { name: "Sample admin" }).click();
  await expect(page.getByLabel("Email")).toHaveValue("admin@gptcoffee.test");
  await expect(page.getByLabel("Password")).toHaveValue("admin123");

  await recorder.step("Submit the login form");
  await page.getByRole("button", { name: "Login" }).click();

  await recorder.step("Verify administrator functionality area associated with AdminDashboard is accessible");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
  await expect(page.getByText("Signature drinks")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_dashboard_admin_login_access");
  await recorder.save(testInfo);
});
