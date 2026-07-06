import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { setupBuyerAppMocks } from "../helpers/mock-api.js";

test("View Empty Shopping Cart", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("cart_empty_state_before_items_added", testInfo);

  await recorder.step("Register buyer menu and empty order mocks", async () => {
    await setupBuyerAppMocks(page, {
      loginScenario: "buyer_success",
      menuScenario: "default",
      ordersScenario: "empty",
    });
  });

  await recorder.step("Open the application and login as buyer", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText("Your Cart")).toBeVisible();
  });

  await recorder.step("Observe the empty shopping cart contents", async () => {
    await expect(page.getByRole("heading", { name: "Start an order" })).toBeVisible();
    await expect(page.getByText("Pick a drink and customize it to see your order here.")).toBeVisible();
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.getByText("$0.00")).toBeVisible();
    await expect(page.getByRole("button", { name: /Checkout/i })).toBeDisabled();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:cart_empty_state_before_items_added");
  await recorder.save(testInfo);
});
