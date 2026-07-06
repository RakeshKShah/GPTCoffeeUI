import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockMenuApi } from "../../helpers/mock-api.js";

async function mockBuyerSession(page, { ordersScenario = "empty" } = {}) {
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

    const scenarios = {
      empty: { orders: [] },
      with_existing_order: {
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
      },
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(scenarios[ordersScenario] ?? scenarios.empty),
    });
  });
}

async function loginAsBuyer(page, recorder) {
  await recorder.step("Open the BuyerApp login screen");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "GPT Coffee" })).toBeVisible();

  await recorder.step("Authenticate as the sample buyer");
  await page.locator("form").getByRole("button").last().click();
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
}

test("Review Shopping Cart Selections Before Checkout", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "buyer_app_review_cart_selections",
    "Review Shopping Cart Selections Before Checkout",
  );

  await mockMenuApi(page, "default");
  await mockBuyerSession(page, { ordersScenario: "empty" });

  try {
    await loginAsBuyer(page, recorder);

    await recorder.step("Add a customized coffee item so the cart can be reviewed");
    const midnightCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Midnight Mocha" }) });
    await midnightCard.getByRole("button", { name: "Customize" }).click();
    await expect(page.getByRole("heading", { name: "Midnight Mocha" })).toBeVisible();
    await page.getByRole("button", { name: "Small" }).click();
    await page.getByRole("button", { name: "Whole" }).click();
    await page.getByRole("button", { name: /Extra Shot/ }).click();
    await page.getByRole("button", { name: /Add to cart/ }).click();

    await recorder.step("Open or review the shopping cart view");
    await expect(page.getByRole("heading", { name: "Pickup order" })).toBeVisible();
    await expect(page.getByText("Midnight Mocha")).toBeVisible();

    await recorder.step("Review the listed coffee selections and applied customizations");
    await expect(page.getByText("1 x Small, Whole, Extra Shot")).toBeVisible();
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.getByText("Estimated pickup: about 15 minutes after checkout.")).toBeVisible();

    await recorder.step("Verify all added selections are visible before checkout");
    await expect(page.getByRole("button", { name: "Checkout for pickup" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Remove Midnight Mocha" })).toBeVisible();

    console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_review_cart_selections");
  } finally {
    await recorder.save(testInfo);
  }
});
