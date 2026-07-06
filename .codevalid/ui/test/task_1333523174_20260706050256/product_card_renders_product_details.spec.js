import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupBuyerAppMocks } from "../../helpers/mock-api.js";

test("Render Product Details in ProductCard", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("product_card_renders_product_details", testInfo);

  await recorder.step("Set up mocked buyer login, menu, and empty orders APIs", async () => {
    await setupBuyerAppMocks(page, {
      loginScenario: "buyer_success",
      menuScenario: "default",
      ordersScenario: "empty",
    });
  });

  await recorder.step("Launch the application containing ProductCard", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "GPT Coffee" })).toBeVisible();
  });

  await recorder.step("Login as the sample buyer to reach the buyer application", async () => {
    await page.locator("form").getByRole("button").last().click();
    await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  });

  await recorder.step("Observe the ProductCard component rendered in the UI", async () => {
    await expect(page.getByText("Floral honey · espresso comfort")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Honey Oat Latte" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Midnight Mocha" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Maple Cloud Brew" })).toBeVisible();
  });

  await recorder.step("Verify that product detail information is visible within the ProductCard component", async () => {
    await expect(page.getByText("Silky espresso folded with oat milk and a honey drizzle.")).toBeVisible();
    await expect(page.getByText("Dark chocolate mocha with a velvet finish.")).toBeVisible();
    await expect(page.getByText("Caramelized maple cream over chilled cold brew.")).toBeVisible();
    await expect(page.getByText("Balanced")).toBeVisible();
    await expect(page.getByText("Bold")).toBeVisible();
    await expect(page.getByText("Smooth")).toBeVisible();
    await expect(page.getByText("$6.50")).toBeVisible();
    await expect(page.getByText("$6.95")).toBeVisible();
    await expect(page.getByText("$5.95")).toBeVisible();
    await expect(page.getByRole("button", { name: "Customize" }).first()).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:product_card_renders_product_details");
  await recorder.save(testInfo);
});
