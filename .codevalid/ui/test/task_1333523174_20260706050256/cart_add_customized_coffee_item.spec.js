import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupBuyerAppMocks } from "../../helpers/mock-api.js";

test("Add Customized Coffee Item to Cart", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("cart_add_customized_coffee_item", testInfo);

  await recorder.step("Register buyer menu and order mocks", async () => {
    await setupBuyerAppMocks(page, {
      loginScenario: "buyer_success",
      menuScenario: "default",
      ordersScenario: "empty",
    });
  });

  await recorder.step("Open the shopping experience", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Order from home. Pick up when your cup is ready." })).toBeVisible();
  });

  await recorder.step("Login as buyer", async () => {
    await page.locator("form").getByRole("button").last().click();
    await expect(page.getByText("Signature drinks")).toBeVisible();
    await expect(page.getByText("Your Cart")).toBeVisible();
  });

  await recorder.step("Select a coffee item with customization options", async () => {
    const firstProductCard = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: "Honey Oat Latte" }) });
    await expect(firstProductCard).toBeVisible();
    await firstProductCard.getByRole("button", { name: "Customize" }).click();
    await expect(page.getByRole("complementary").getByRole("heading", { name: "Honey Oat Latte" })).toBeVisible();
    await expect(page.getByText("Cup Size")).toBeVisible();
  });

  await recorder.step("Apply customizations to the coffee item", async () => {
    await page.getByRole("button", { name: /Large/i }).click();
    await page.getByRole("button", { name: /Oat/i }).click();
    await page.getByRole("button", { name: /Vanilla Sweet Foam/i }).click();
    await page.getByRole("button", { name: /Cinnamon Dust/i }).click();
  });

  await recorder.step("Add the customized coffee item to the cart", async () => {
    await page.getByRole("button", { name: /Add to cart/i }).click();
    await expect(page.getByRole("heading", { name: "Pickup order" })).toBeVisible();
  });

  await recorder.step("Review the shopping cart contents", async () => {
    await expect(page.getByRole("paragraph").filter({ hasText: "Honey Oat Latte" })).toBeVisible();
    await expect(page.getByText("1 x Large, Oat, Vanilla Sweet Foam, Cinnamon Dust")).toBeVisible();
    await expect(page.getByText("$8.55")).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:cart_add_customized_coffee_item");
  await recorder.save(testInfo);
});
