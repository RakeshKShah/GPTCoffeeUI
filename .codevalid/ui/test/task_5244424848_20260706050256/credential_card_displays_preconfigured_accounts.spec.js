import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockMenuApi } from "../../helpers/mock-api.js";

test("Display preconfigured buyer and administrator credentials", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("credential_card_displays_preconfigured_accounts", testInfo.title);

  await recorder.step("Register initial menu API mock so the auth screen loads without a real backend.");
  await mockMenuApi(page, "default");

  await recorder.step("Open the application containing the CredentialCard component.");
  await page.goto("/");

  await recorder.step("Verify the authentication screen and credential cards are visible.");
  await expect(page.getByRole("heading", { name: "Order from home. Pick up when your cup is ready." })).toBeVisible();
  await expect(page.getByText("Sample buyer")).toBeVisible();
  await expect(page.getByText("Sample admin")).toBeVisible();

  await recorder.step("Verify that buyer account credentials are displayed.");
  await expect(page.getByText("buyer@gptcoffee.test")).toBeVisible();
  await expect(page.getByText("buyer123")).toBeVisible();

  await recorder.step("Verify that administrator account credentials are displayed.");
  await expect(page.getByText("admin@gptcoffee.test")).toBeVisible();
  await expect(page.getByText("admin123")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:credential_card_displays_preconfigured_accounts");
  await recorder.save(testInfo);
});
