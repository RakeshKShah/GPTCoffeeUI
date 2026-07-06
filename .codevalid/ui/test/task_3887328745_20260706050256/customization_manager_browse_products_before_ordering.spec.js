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

test("Browse coffee menu before starting an order", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "customization_manager_browse_products_before_ordering",
    testTitle: "Browse coffee menu before starting an order",
  });

  await recorder.step("Set up buyer session with available menu products", async () => {
    await mockBuyerSession(page);
    await mockMenuApi(page, "default");
  });

  await recorder.step("Open the customer-facing application", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  });

  await recorder.step("Browse multiple coffee products without initiating an order", async () => {
    await expect(page.getByText("Honey Oat Latte")).toBeVisible();
    await expect(page.getByText("Midnight Mocha")).toBeVisible();
    await expect(page.getByText("Maple Cloud Brew")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Start an order" })).toBeVisible();
    await expect(page.getByText("Pick a drink and customize it to see your order here.")).toBeVisible();
  });

  await recorder.step("Confirm no order has been initiated during browsing", async () => {
    await expect(page.getByRole("button", { name: "Checkout for pickup" })).toBeDisabled();
    await expect(page.getByText("Your placed orders will appear here.")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customization_manager_browse_products_before_ordering");
  await recorder.save(testInfo);
});
