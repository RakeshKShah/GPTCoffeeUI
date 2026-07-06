import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockMenuApi } from "../../helpers/mock-api.js";

async function setupBuyerSession(page, { menuScenario = "default" } = {}) {
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
  await page.locator("form").getByRole("button").last().click();

  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
}

test("buyer_app_open_drink_customization_screen", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("buyer_app_open_drink_customization_screen", "Open drink customization before ordering", testInfo.outputDir);

  await setupBuyerSession(page);
  await loginAsBuyer(page, recorder);

  await recorder.recordStep("Select a coffee product from the product cards");
  await page.getByRole("heading", { name: "Honey Oat Latte" }).locator("..").locator("..").getByRole("button", { name: "Customize" }).click();

  await recorder.recordStep("Proceed to the next step in the order flow");
  await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();

  await recorder.recordStep("Verify that a drink customization screen is displayed");
  await expect(page.locator("aside").getByRole("heading", { name: "Honey Oat Latte" })).toBeVisible();
  await expect(page.locator("aside").getByText("Cup Size")).toBeVisible();
  await expect(page.locator("aside").getByRole("heading", { name: "Milk" })).toBeVisible();
  await expect(page.locator("aside").getByText("Finishing Touches")).toBeVisible();
  await expect(page.getByRole("button", { name: "Close customization", exact: true })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_open_drink_customization_screen");
  await recorder.save(testInfo);
});
