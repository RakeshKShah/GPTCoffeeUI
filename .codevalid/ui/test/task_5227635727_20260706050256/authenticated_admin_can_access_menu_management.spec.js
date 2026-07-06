import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockMenuApi, mockAdminLoginFlow } from "../../helpers/mock-api.js";

test("Authenticated Administrator Can Access Coffee Menu Management", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("authenticated_admin_can_access_menu_management", "Authenticated Administrator Can Access Coffee Menu Management");

  await recorder.step("Register admin login and dashboard mocks", async () => {
    await mockMenuApi(page, "default");
    await mockAdminLoginFlow(page, { loginScenario: "success", menuScenario: "default" });
  });

  await recorder.step("Authenticate as an administrator", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sample admin" }).click();
    await page.locator("form").getByRole("button").last().click();
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
  });

  await recorder.step("Navigate to the available menu management functionality", async () => {
    await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
    await page.getByRole("heading", { name: "Coffee flavors" }).scrollIntoViewIfNeeded();
  });

  await recorder.step("Observe available coffee menu management controls", async () => {
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Price")).toBeVisible();
    await expect(page.getByLabel("Tasting note")).toBeVisible();
    await expect(page.getByLabel("Strength")).toBeVisible();
    await expect(page.getByText("Description")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add flavor" })).toBeVisible();
    await expect(page.getByText("Espresso Noir")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove" }).first()).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:authenticated_admin_can_access_menu_management");
  await recorder.save(testInfo);
});
