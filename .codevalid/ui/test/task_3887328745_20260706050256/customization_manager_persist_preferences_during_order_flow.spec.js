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
}

test("Retain customization preferences throughout the order flow", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "customization_manager_persist_preferences_during_order_flow",
    testTitle: "Retain customization preferences throughout the order flow",
  });

  await recorder.step("Set up buyer session and available customization options", async () => {
    await mockBuyerSession(page);
    await mockMenuApi(page, "default");
  });

  await recorder.step("Open the app and select a coffee product", async () => {
    await page.goto("/");
    const card = page.locator("article", { hasText: "Honey Oat Latte" });
    await card.getByRole("button", { name: "Customize" }).click();
    await expect(page.getByRole("heading", { name: "Honey Oat Latte" })).toBeVisible();
  });

  await recorder.step("Customize the drink using available preferences", async () => {
    await page.getByRole("button", { name: /Large/i }).click();
    await page.getByRole("button", { name: /Oat/i }).click();
    await page.getByRole("button", { name: /Vanilla Sweet Foam/i }).click();
    await page.getByRole("button", { name: /Cinnamon Dust/i }).click();
    await page.getByRole("button", { name: /Add to cart/i }).click();
  });

  await recorder.step("Continue to the next stage of the order flow", async () => {
    await expect(page.getByRole("heading", { name: "Pickup order" })).toBeVisible();
  });

  await recorder.step("Review the selected drink configuration in the cart", async () => {
    await expect(page.getByText("Honey Oat Latte")).toBeVisible();
    await expect(page.getByText(/1 x Large, Oat, Vanilla Sweet Foam, Cinnamon Dust/)).toBeVisible();
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.getByText("$8.55")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customization_manager_persist_preferences_during_order_flow");
  await recorder.save(testInfo);
});
