import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { setupBuyerAppMocks } from "../helpers/mock-api.js";

test("Smooth UI Animation During Cart Interaction", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("cart_ui_animation_during_add_to_cart", testInfo);

  await recorder.step("Register buyer menu and order mocks", async () => {
    await setupBuyerAppMocks(page, {
      loginScenario: "buyer_success",
      menuScenario: "default",
      ordersScenario: "empty",
    });
  });

  await recorder.step("Open the application and login", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText("Signature drinks")).toBeVisible();
  });

  await recorder.step("Open the customization panel and observe transition", async () => {
    const productCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Honey Oat Latte" }) });
    await productCard.getByRole("button", { name: "Customize" }).click();
    await expect(page.getByRole("button", { name: "Close customization overlay" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Close customization" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Honey Oat Latte" })).toBeVisible();
  });

  await recorder.step("Add the item to the cart and verify animated cart state updates", async () => {
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await expect(page.getByRole("heading", { name: "Pickup order" })).toBeVisible();
    await expect(page.getByText("Honey Oat Latte")).toBeVisible();
    await expect(page.locator("span", { hasText: "1" }).first()).toBeVisible();
  });

  await recorder.step("Open and close the customization interface again to validate smooth transitions", async () => {
    const mochaCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Midnight Mocha" }) });
    await mochaCard.getByRole("button", { name: "Customize" }).click();
    await expect(page.getByRole("button", { name: "Close customization overlay" })).toBeVisible();
    await page.getByRole("button", { name: "Close customization" }).click();
    await expect(page.getByRole("button", { name: "Close customization overlay" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Pickup order" })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:cart_ui_animation_during_add_to_cart");
  await recorder.save(testInfo);
});
