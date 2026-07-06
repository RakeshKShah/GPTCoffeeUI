import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupBuyerAppMocks } from "../../helpers/mock-api.js";

test("Complete Checkout and Submit Final Order", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("cart_checkout_order_submission", testInfo);

  await recorder.step("Register buyer login, menu, existing orders, and checkout mocks", async () => {
    await setupBuyerAppMocks(page, {
      loginScenario: "buyer_success",
      menuScenario: "default",
      ordersScenario: "empty",
      checkoutScenario: "customized_order_success",
      postCheckoutOrdersScenario: "with_existing_order",
    });
  });

  await recorder.step("Open the application and login as buyer", async () => {
    await page.goto("/");
    await page.locator("form").getByRole("button").last().click();
    await expect(page.getByText("Your Cart")).toBeVisible();
  });

  await recorder.step("Add a customized coffee item to the shopping cart", async () => {
    const honeyCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Honey Oat Latte" }) });
    await honeyCard.getByRole("button", { name: "Customize" }).click();
    await page.getByRole("button", { name: /Large/i }).click();
    await page.getByRole("button", { name: /Oat/i }).click();
    await page.getByRole("button", { name: /Vanilla Sweet Foam/i }).click();
    await page.getByRole("button", { name: /Cinnamon Dust/i }).click();
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await expect(page.getByText("1 x Large, Oat, Vanilla Sweet Foam, Cinnamon Dust")).toBeVisible();
  });

  await recorder.step("Proceed to checkout and submit the final order", async () => {
    await page.getByRole("button", { name: /Checkout/i }).click();
  });

  await recorder.step("Verify successful order submission confirmation", async () => {
    await expect(page.getByText("Order placed. Watch your pickup status below.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Start an order" })).toBeVisible();
    await expect(page.getByText("Pick a drink and customize it to see your order here.")).toBeVisible();
    await expect(page.getByText("ORD-1001")).toBeVisible();
    await expect(page.getByText("Placed")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:cart_checkout_order_submission");
  await recorder.save(testInfo);
});
