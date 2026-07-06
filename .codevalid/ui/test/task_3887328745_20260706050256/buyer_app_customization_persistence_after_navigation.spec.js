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

test("buyer_app_customization_persistence_after_navigation", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("buyer_app_customization_persistence_after_navigation", "Retain customization selections during order flow navigation", testInfo.outputDir);

  await setupBuyerSession(page);
  await loginAsBuyer(page, recorder);

  await recorder.recordStep("Select a coffee product and open the customization screen");
  await page.getByRole("heading", { name: "Honey Oat Latte" }).locator("..").locator("..").getByRole("button", { name: "Customize" }).click();

  await recorder.recordStep("Select customization preferences");
  await page.getByRole("button", { name: "Large" }).click();
  await page.locator("aside").getByRole("button", { name: /^Oat/ }).click();
  await page.getByRole("button", { name: /Vanilla Sweet Foam/ }).click();

  await recorder.recordStep("Navigate forward in the order flow");
  await page.getByRole("button", { name: /Add to cart/ }).click();
  await expect(page.getByText(/1 x Large, Oat, Vanilla Sweet Foam/)).toBeVisible();

  await recorder.recordStep("Return to the customization step");
  await page.getByRole("heading", { name: "Honey Oat Latte" }).locator("..").locator("..").getByRole("button", { name: "Customize" }).click();

  await recorder.recordStep("Verify previously selected customization preferences remain visible during the order flow");
  await expect(page.getByRole("button", { name: /Add to cart/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Large" })).toBeVisible();
  await expect(page.locator("aside").getByRole("button", { name: /^Oat/ })).toBeVisible();
  await page.getByRole("button", { name: "Close customization", exact: true }).click();
  await expect(page.getByText(/1 x Large, Oat, Vanilla Sweet Foam/)).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_customization_persistence_after_navigation");
  await recorder.save(testInfo);
});
