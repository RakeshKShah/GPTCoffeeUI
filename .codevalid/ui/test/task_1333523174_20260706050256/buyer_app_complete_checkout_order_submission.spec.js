import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockMenuApi } from "../helpers/mock-api.js";

async function mockBuyerSession(page) {
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

  let ordersResponse = { orders: [] };

  await page.route(/\/api\/orders\/my$/, async (route) => {
    if (route.request().method().toUpperCase() !== "GET") {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ordersResponse),
    });
  });

  await page.route(/\/api\/orders$/, async (route) => {
    if (route.request().method().toUpperCase() !== "POST") {
      return route.fallback();
    }

    ordersResponse = {
      orders: [
        {
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
      ],
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        order: ordersResponse.orders[0],
      }),
    });
  });
}

async function loginAsBuyer(page, recorder) {
  await recorder.step("Open the BuyerApp login screen");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "GPT Coffee" })).toBeVisible();

  await recorder.step("Authenticate as the sample buyer");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
}

test("Complete Checkout and Submit Final Order", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "buyer_app_complete_checkout_order_submission",
    "Complete Checkout and Submit Final Order",
  );

  await mockMenuApi(page, "default");
  await mockBuyerSession(page);

  try {
    await loginAsBuyer(page, recorder);

    await recorder.step("Add at least one customized coffee item to the shopping cart");
    const honeyCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Honey Oat Latte" }) });
    await honeyCard.getByRole("button", { name: "Customize" }).click();
    await expect(page.getByRole("heading", { name: "Honey Oat Latte" })).toBeVisible();
    await page.getByRole("button", { name: "Large" }).click();
    await page.getByRole("button", { name: "Oat" }).click();
    await page.getByRole("button", { name: /Vanilla Sweet Foam/ }).click();
    await page.getByRole("button", { name: /Cinnamon Dust/ }).click();
    await page.getByRole("button", { name: /Add to cart/ }).click();

    await recorder.step("Open the shopping cart and review the selected items");
    await expect(page.getByRole("heading", { name: "Pickup order" })).toBeVisible();
    await expect(page.getByText("Honey Oat Latte")).toBeVisible();
    await expect(page.getByText("1 x Large, Oat, Vanilla Sweet Foam, Cinnamon Dust")).toBeVisible();

    await recorder.step("Proceed to checkout and submit the final order");
    await page.getByRole("button", { name: "Checkout for pickup" }).click();
    await expect(page.getByText("Order placed. Watch your pickup status below.")).toBeVisible();

    await recorder.step("Verify the system confirms successful order processing");
    await expect(page.getByRole("heading", { name: "Start an order" })).toBeVisible();
    await expect(page.getByText("ORD-2001")).toBeVisible();
    await expect(page.getByText("1x Honey Oat Latte")).toBeVisible();
    await expect(page.getByText("Placed")).toBeVisible();
    await expect(page.getByRole("button", { name: "Checkout for pickup" })).toBeDisabled();

    console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_complete_checkout_order_submission");
  } finally {
    await recorder.save(testInfo);
  }
});
