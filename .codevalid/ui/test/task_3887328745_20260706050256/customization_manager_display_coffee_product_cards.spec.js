import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../../../../ui_test/helpers/execution-recorder.js";
import { mockMenuApi } from "../../../../../ui_test/helpers/mock-api.js";

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

test("Display available coffee products as product cards", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "customization_manager_display_coffee_product_cards",
    testTitle: "Display available coffee products as product cards",
  });

  await recorder.step("Set up mocked buyer session and menu data", async () => {
    await mockBuyerSession(page);
    await mockMenuApi(page, "default");
  });

  await recorder.step("Open the customer-facing coffee menu interface", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  });

  await recorder.step("Verify that coffee products are displayed as individual product cards", async () => {
    await expect(page.getByText("Honey Oat Latte")).toBeVisible();
    await expect(page.getByText("Midnight Mocha")).toBeVisible();
    await expect(page.getByText("Maple Cloud Brew")).toBeVisible();
    await expect(page.getByRole("button", { name: "Customize" })).toHaveCount(3);
  });

  await recorder.step("Verify that multiple products can be browsed in the interface", async () => {
    await expect(page.getByText("Floral honey · espresso comfort")).toBeVisible();
    await expect(page.getByText("Bittersweet cocoa · after-dark energy")).toBeVisible();
    await expect(page.getByText("Toasted maple · cool cream")).toBeVisible();
  });

  await recorder.step("Verify the warm dark-themed presentation cues are visible", async () => {
    await expect(page.getByRole("heading", { name: "Start an order" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your pickup status" })).toBeVisible();
    await expect(page.getByText("Customize every cup and check out for pickup.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customization_manager_display_coffee_product_cards");
  await recorder.save(testInfo);
});
