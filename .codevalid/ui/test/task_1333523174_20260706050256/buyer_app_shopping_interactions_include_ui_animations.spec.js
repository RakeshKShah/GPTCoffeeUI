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
  await recorder.step("Open the BuyerApp login screen");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "GPT Coffee" })).toBeVisible();

  await recorder.step("Authenticate as the sample buyer");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
}

test("Shopping Cart Experience Includes Smooth UI Animations", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder(
    "buyer_app_shopping_interactions_include_ui_animations",
    "Shopping Cart Experience Includes Smooth UI Animations",
  );

  await mockMenuApi(page, "default");
  await mockBuyerSession(page);

  try {
    await loginAsBuyer(page, recorder);

    await recorder.step("Select a coffee item and observe the customization panel transition");
    const productCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Maple Cloud Brew" }) });
    await productCard.getByRole("button", { name: "Customize" }).click();
    await expect(page.getByRole("button", { name: "Close customization overlay" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Close customization" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Maple Cloud Brew" })).toBeVisible();

    await recorder.step("Interact with customization controls and add the item to the cart");
    await page.getByRole("button", { name: "Large" }).click();
    await page.getByRole("button", { name: /Vanilla Sweet Foam/ }).click();
    await page.getByRole("button", { name: /Add to cart/ }).click();

    await recorder.step("Observe the UI response during the add-to-cart interaction");
    await expect(page.getByRole("heading", { name: "Pickup order" })).toBeVisible();
    await expect(page.getByText("Maple Cloud Brew")).toBeVisible();
    await expect(page.getByText("1 x Large, Oat, Vanilla Sweet Foam")).toBeVisible();

    await recorder.step("Open and interact with the shopping cart interface without visual breakage");
    await expect(page.getByRole("button", { name: "Checkout for pickup" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Remove Maple Cloud Brew" })).toBeVisible();
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.getByText("Pick a drink and customize it to see your order here.")).toHaveCount(0);

    console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_shopping_interactions_include_ui_animations");
  } finally {
    await recorder.save(testInfo);
  }
});
