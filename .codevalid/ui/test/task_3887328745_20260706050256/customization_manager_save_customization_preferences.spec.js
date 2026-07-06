import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockMenuApi } from "../../helpers/mock-api.js";

async function mockBuyerSession(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("gpt-coffee-token", "buyer-token");
    window.localStorage.setItem(
      "gpt-coffee-user",
      JSON.stringify({
        id: "buyer-1",
        name: "Maya Buyer",
        email: "buyer@gptcoffee.test",
        role: "buyer",
      }),
    );
  });

  await page.route(/\/api\/orders\/my$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ orders: [] }),
    });
  });

  await page.route(/\/api\/orders$/, async (route) => {
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

test("Save selected drink customization preferences", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "customization_manager_save_customization_preferences",
    testTitle: "Save selected drink customization preferences",
  });

  await recorder.step("Set up buyer session, menu, and order mocks", async () => {
    await mockBuyerSession(page);
    await mockMenuApi(page, "default");
  });

  await recorder.step("Open the application and start customizing a drink", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
    const card = page.locator("article", { hasText: "Honey Oat Latte" });
    await card.getByRole("button", { name: "Customize" }).click();
    await expect(page.locator("aside").getByRole("heading", { name: "Honey Oat Latte" })).toBeVisible();
  });

  await recorder.step("Choose available customization preferences", async () => {
    await page.locator("aside").getByRole("button", { name: /^Large/ }).click();
    await page.locator("aside").getByRole("button", { name: /^Oat/ }).click();
    await page.getByRole("button", { name: /Vanilla Sweet Foam/i }).click();
    await page.getByRole("button", { name: /Cinnamon Dust/i }).click();
    await page.getByRole("button", { name: /Add to cart/i }).click();
  });

  await recorder.step("Verify the customized drink is retained in the cart", async () => {
    await expect(page.getByText(/1 x Large, Oat, Vanilla Sweet Foam, Cinnamon Dust/)).toBeVisible();
    await expect(page.getByText("$9.50").first()).toBeVisible();
  });

  await recorder.step("Continue through checkout and confirm order flow messaging", async () => {
    await page.getByRole("button", { name: "Checkout for pickup" }).click();
    await expect(page.getByText("Order placed. Watch your pickup status below.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Start an order" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customization_manager_save_customization_preferences");
  await recorder.save(testInfo);
});
