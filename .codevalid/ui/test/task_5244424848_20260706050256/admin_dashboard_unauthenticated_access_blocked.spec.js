import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockMenuApi } from "../helpers/mock-api.js";

test("Unauthenticated User Cannot Access Admin Dashboard", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_dashboard_unauthenticated_access_blocked", testInfo);

  await recorder.step("Register menu mock used by initial unauthenticated app load");
  await mockMenuApi(page, "default");

  await recorder.step("Clear any persisted authenticated session");
  await page.addInitScript(() => {
    window.localStorage.removeItem("gpt-coffee-token");
    window.localStorage.removeItem("gpt-coffee-user");
  });

  await recorder.step("Attempt to open the application directly without logging in");
  await page.goto("/");

  await recorder.step("Verify access to administrator functionality is blocked until authentication");
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("button", { name: "signup" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByText("Admin Dashboard")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_dashboard_unauthenticated_access_blocked");
  await recorder.save(testInfo);
});
