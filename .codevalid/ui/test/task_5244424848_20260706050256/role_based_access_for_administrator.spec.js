import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../../../ui_test/helpers/execution-recorder.js";
import { mockAdminLoginFlow } from "../../../../ui_test/helpers/mock-api.js";

test("Role-Based Access for Administrator User", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("role_based_access_for_administrator", "Role-Based Access for Administrator User");

  await recorder.step("Open the authentication screen with administrator login mocks.");
  await mockAdminLoginFlow(page, {
    loginScenario: "success",
    menuScenario: "default"
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();

  await recorder.step("Log in using valid administrator credentials.");
  await page.getByPlaceholder("you@example.com").fill("admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("admin123");
  await page.getByRole("button", { name: /^login$/i }).click();

  await recorder.step("Observe the functionality available after authentication.");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: /manage orders from anywhere\./i })).toBeVisible();
  await expect(page.getByText("Daily sales")).toBeVisible();
  await expect(page.getByText("Monthly sales")).toBeVisible();
  await expect(page.getByText("All-time sales")).toBeVisible();
  await expect(page.getByText("Signature drinks")).toHaveCount(0);
  await expect(page.getByText("Your Cart")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:role_based_access_for_administrator");
  await recorder.save(testInfo);
});
