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

test("Open drink customization screen from a coffee product", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "customization_manager_open_drink_customization_screen",
    testTitle: "Open drink customization screen from a coffee product",
  });

  await recorder.step("Set up buyer menu mocks", async () => {
    await mockBuyerSession(page);
    await mockMenuApi(page, "default");
  });

  await recorder.step("Open the application and browse available coffee products", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
    await expect(page.getByText("Honey Oat Latte")).toBeVisible();
  });

  await recorder.step("Select a coffee product card", async () => {
    const card = page.locator("article", { hasText: "Honey Oat Latte" });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Customize" }).click();
  });

  await recorder.step("Verify the drink customization experience opens for the selected drink", async () => {
    await expect(page.getByText("Customize")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Honey Oat Latte" })).toBeVisible();
    await expect(page.getByText("Cup Size")).toBeVisible();
    await expect(page.getByText("Milk")).toBeVisible();
    await expect(page.getByText("Finishing Touches")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to cart" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customization_manager_open_drink_customization_screen");
  await recorder.save(testInfo);
});
