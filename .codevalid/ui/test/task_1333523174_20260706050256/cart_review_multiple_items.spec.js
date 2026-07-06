import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupBuyerAppMocks } from "../../helpers/mock-api.js";

test("Review Multiple Cart Selections Before Checkout", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("cart_review_multiple_items", testInfo);

  await recorder.step("Register buyer menu and order mocks", async () => {
    await setupBuyerAppMocks(page, {
      loginScenario: "buyer_success",
      menuScenario: "default",
      ordersScenario: "empty",
    });
  });

  await recorder.step("Open the application and login as buyer", async () => {
    await page.goto("/");
    await page.locator("form").getByRole("button").last().click();
    await expect(page.getByText("Signature drinks")).toBeVisible();
  });

  await recorder.step("Add a customized Honey Oat Latte to the cart", async () => {
    const honeyCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Honey Oat Latte" }) });
    await honeyCard.getByRole("button", { name: "Customize" }).click();
    await page.getByRole("button", { name: /Large/i }).click();
    await page.getByRole("button", { name: /Oat/i }).click();
    await page.getByRole("button", { name: /Vanilla Sweet Foam/i }).click();
    await page.getByRole("button", { name: /Add to cart/i }).click();
  });

  await recorder.step("Add a second customized Midnight Mocha to the cart", async () => {
    const mochaCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "Midnight Mocha" }) });
    await mochaCard.getByRole("button", { name: "Customize" }).click();
    await page.getByRole("button", { name: /Small/i }).click();
    await page.getByRole("button", { name: /Almond/i }).click();
    await page.getByRole("button", { name: /Extra Shot/i }).click();
    await page.getByRole("button", { name: /Add to cart/i }).click();
  });

  await recorder.step("Review the cart contents", async () => {
    await expect(page.getByRole("heading", { name: "Pickup order" })).toBeVisible();
    await expect(page.getByRole("paragraph").filter({ hasText: "Honey Oat Latte" })).toBeVisible();
    await expect(page.getByText("1 x Large, Oat, Vanilla Sweet Foam")).toBeVisible();
    await expect(page.getByRole("paragraph").filter({ hasText: "Midnight Mocha" })).toBeVisible();
    await expect(page.getByText("1 x Small, Almond, Extra Shot")).toBeVisible();
    await expect(page.locator("span", { hasText: "2" }).first()).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:cart_review_multiple_items");
  await recorder.save(testInfo);
});
