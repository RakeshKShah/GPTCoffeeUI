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

  await page.route(/\/api\/orders$/, async (route) => {
    if (route.request().method().toUpperCase() !== "POST") {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        order: {
          id: "ORD-2001",
          buyerId: "buyer-1",
          buyerName: "Maya Buyer",
          createdAt: "2026-07-06T10:00:00.000Z",
          readyAt: "2026-07-06T10:15:00.000Z",
          status: "Placed",
          items: [
            {
              id: "line-1",
              productName: "Honey Oat Latte",
              size: "Large",
              milk: "Oat",
              extras: ["Vanilla Sweet Foam", "Cinnamon Dust"],
              quantity: 1,
              total: 8.55,
            },
          ],
          total: 8.55,
        },
      }),
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

test("buyer_app_save_customization_preferences", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("buyer_app_save_customization_preferences", "Save selected drink customization preferences", testInfo.outputDir);

  await setupBuyerSession(page);
  await loginAsBuyer(page, recorder);

  await recorder.recordStep("Select a coffee product");
  await page.getByRole("heading", { name: "Honey Oat Latte" }).locator("..").locator("..").getByRole("button", { name: "Customize" }).click();

  await recorder.recordStep("Open the drink customization screen and choose available preferences");
  await page.getByRole("button", { name: "Large" }).click();
  await page.getByRole("button", { name: "Oat" }).click();
  await page.getByRole("button", { name: /Vanilla Sweet Foam/ }).click();
  await page.getByRole("button", { name: /Cinnamon Dust/ }).click();

  await recorder.recordStep("Continue through the ordering flow");
  await page.getByRole("button", { name: /Add to cart/ }).click();

  await expect(page.getByText("Honey Oat Latte")).toBeVisible();
  await expect(page.getByText(/1 x Large, Oat, Vanilla Sweet Foam, Cinnamon Dust/)).toBeVisible();

  await recorder.recordStep("Review the order details before completion");
  await page.getByRole("button", { name: /Checkout for pickup/ }).click();

  await expect(page.getByText("Order placed. Watch your pickup status below.")).toBeVisible();
  await expect(page.getByText("Your pickup status")).toBeVisible();
  await expect(page.getByText("Your placed orders will appear here.")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_save_customization_preferences");
  await recorder.save(testInfo);
});
