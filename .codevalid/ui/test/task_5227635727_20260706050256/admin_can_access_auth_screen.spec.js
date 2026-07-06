import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockMenuApi } from "../../helpers/mock-api.js";

test("Administrator Can Open Authentication Screen", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_can_access_auth_screen", "Administrator Can Open Authentication Screen");

  await recorder.step("Mock menu API required by initial app load", async () => {
    await mockMenuApi(page, "default");
  });

  await recorder.step("Launch the application", async () => {
    await page.goto("/");
  });

  await recorder.step("Observe the initial authentication screen", async () => {
    await expect(page.getByRole("heading", { name: "Order from home. Pick up when your cup is ready." })).toBeVisible();
    await expect(page.locator("form").getByRole("button").last()).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByText("Sample admin")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_can_access_auth_screen");
  await recorder.save(testInfo);
});
