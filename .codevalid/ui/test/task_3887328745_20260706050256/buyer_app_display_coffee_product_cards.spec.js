import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockMenuApi } from "../../helpers/mock-api.js";

async function setupBuyerSession(page, { menuScenario = "default", ordersScenario = "empty", loginScenario = "buyer_success" } = {}) {
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
          email: loginScenario === "buyer_success" ? "buyer@gptcoffee.test" : "buyer@example.com",
          role: "buyer",
        },
      }),
    });
  });

  await page.route(/\/api\/orders\/my$/, async (route) => {
    if (route.request().method().toUpperCase() !== "GET") {
      return route.fallback();
    }

    const body = ordersScenario === "empty"
      ? { orders: [] }
      : {
          orders: [
            {
              id: "ORD-1001",
              buyerId: "buyer-1",
              buyerName: "Maya Buyer",
              createdAt: "2026-07-06T09:00:00.000Z",
              readyAt: "2026-07-06T09:15:00.000Z",
              status: "Placed",
              items: [
                {
                  id: "line-1",
                  productName: "Honey Oat Latte",
                  size: "Medium",
                  milk: "Oat",
                  extras: ["Vanilla Sweet Foam"],
                  quantity: 1,
                  total: 7.75,
                },
              ],
              total: 7.75,
            },
          ],
        };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

async function loginAsBuyer(page, recorder) {
  await recorder.recordStep("Open the buyer application login screen");
  await page.goto("/");

  await recorder.recordStep("Submit buyer login credentials");
  await page.getByLabel("Email").fill("buyer@gptcoffee.test");
  await page.getByLabel("Password").fill("buyer123");
  await page.locator("form").getByRole("button").last().click();

  await expect(page.getByRole("heading", { name: "Welcome, Maya Buyer" })).toBeVisible();
}

test("buyer_app_display_coffee_product_cards", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("buyer_app_display_coffee_product_cards", "Display available coffee products as product cards", testInfo.outputDir);

  await setupBuyerSession(page, { menuScenario: "default", ordersScenario: "empty" });

  await loginAsBuyer(page, recorder);

  await recorder.recordStep("Observe the main coffee menu screen");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByText("Warm dark cafe experience")).toBeVisible();
  await expect(page.getByText("Customize every cup and check out for pickup.")).toBeVisible();

  await recorder.recordStep("Verify that multiple coffee products are displayed as product cards");
  await expect(page.getByRole("heading", { name: "Honey Oat Latte" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Midnight Mocha" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Customize" })).toHaveCount(3);

  await recorder.recordStep("Verify that the interface uses a warm dark-themed visual presentation");
  await expect(page.locator("main.bg-\[\#120b08\]").first()).toBeVisible();
  await expect(page.getByText("Warm dark cafe experience")).toBeVisible();

  await recorder.recordStep("Verify that each product card is visually distinguishable and browseable");
  await expect(page.getByText("Floral honey · espresso comfort")).toBeVisible();
  await expect(page.getByText("Bittersweet cocoa · after-dark energy")).toBeVisible();
  await expect(page.getByText("$6.50")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_display_coffee_product_cards");
  await recorder.save(testInfo);
});
