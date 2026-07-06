import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockMenuApi } from "../../helpers/mock-api.js";

async function mockBuyerSession(page, { ordersScenario = "empty", orderScenario } = {}) {
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

  if (orderScenario) {
    await page.route(/\/api\/orders$/, async (route) => {
      if (route.request().method().toUpperCase() !== "POST") {
        return route.fallback();
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(orderScenario),
      });
    });
  }
}

async function loginAsBuyer(page, recorder) {
  await recorder.step("Open the BuyerApp login screen");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "GPT Coffee" })).toBeVisible();

  await recorder.step("Authenticate as the sample buyer");
  await page.locator("form").getByRole("button").last().click();
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Start an order" })).toBeVisible();
}

test("Add Customized Coffee Item to Shopping Cart", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "buyer_app_add_customized_coffee_to_cart",
    "Add Customized Coffee Item to Shopping Cart",
  );

  await mockMenuApi(page, "default");
  await mockBuyerSession(page, { ordersScenario: "empty" });

  try {
    await loginAsBuyer(page, recorder);

    await recorder.step("Select a coffee item available for customization");
    const honeyCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Honey Oat Latte" }) });
    await expect(honeyCard).toBeVisible();
    await honeyCard.getByRole("button", { name: "Customize" }).click();

    await recorder.step("Apply available customization options to the coffee item");
    await expect(page.getByRole("complementary").getByRole("heading", { name: "Honey Oat Latte" })).toBeVisible();
    await page.getByRole("button", { name: "Large" }).click();
    await page.getByRole("button", { name: "Almond" }).click();
    await page.getByRole("button", { name: /Vanilla Sweet Foam/ }).click();
    await page.getByRole("button", { name: /Cinnamon Dust/ }).click();
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(page.getByText("2")).toBeVisible();

    await recorder.step("Add the customized coffee item to the shopping cart");
    await page.getByRole("button", { name: /Add to cart/ }).click();
    await expect(page.getByRole("heading", { name: "Pickup order" })).toBeVisible();

    await recorder.step("Review the shopping cart");
    await expect(page.getByRole("paragraph").filter({ hasText: "Honey Oat Latte" })).toBeVisible();
    await expect(page.getByText("2 x Large, Almond, Vanilla Sweet Foam, Cinnamon Dust")).toBeVisible();
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.getByRole("button", { name: "Checkout for pickup" })).toBeEnabled();

    console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_add_customized_coffee_to_cart");
  } finally {
    await recorder.save(testInfo);
  }
});
