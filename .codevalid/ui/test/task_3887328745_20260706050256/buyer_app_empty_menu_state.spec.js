import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../../../ui_test/helpers/execution-recorder.js";
import { mockMenuApi } from "../../../../ui_test/helpers/mock-api.js";

async function setupBuyerSession(page, { menuScenario = "empty" } = {}) {
  await mockMenuApi(page, menuScenario);

  await page.route(/\/api\/auth\/login$/, async (route) => {
    if (route.request().method().toUpperCase() !== "POST") {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "buyer-token",
        user: {
          id: "buyer-1",
          name: "Maya Buyer",
          email: "buyer@gptcoffee.test",
          role: "buyer",
        },
      }),
    });
  });

  await page.route(/\/api\/orders\/my$/, async (route) => {
    if (route.request().method().toUpperCase() !== "GET") {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ orders: [] }),
    });
  });
}

async function loginAsBuyer(page, recorder) {
  await recorder.recordStep("Open the Buyer application");
  await page.goto("/");

  await recorder.recordStep("Authenticate as a buyer");
  await page.getByLabel("Email").fill("buyer@gptcoffee.test");
  await page.getByLabel("Password").fill("buyer123");
  await page.getByRole("button", { name: /^Login$/ }).click();

  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
}

test("buyer_app_empty_menu_state", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("buyer_app_empty_menu_state", "Handle empty coffee menu gracefully", testInfo.outputDir);

  await setupBuyerSession(page, { menuScenario: "empty" });
  await loginAsBuyer(page, recorder);

  await recorder.recordStep("Observe the menu area where coffee product cards would normally appear");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Customize" })).toHaveCount(0);
  await expect(page.getByText("Pick a drink and customize it to see your order here.")).toBeVisible();
  await expect(page.getByText("Your placed orders will appear here.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_empty_menu_state");
  await recorder.save(testInfo);
});
