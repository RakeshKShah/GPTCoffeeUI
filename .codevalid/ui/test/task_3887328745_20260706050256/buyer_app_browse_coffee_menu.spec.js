import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../../../ui_test/helpers/execution-recorder.js";
import { mockMenuApi } from "../../../../ui_test/helpers/mock-api.js";

async function setupBuyerSession(page, { menuScenario = "default", ordersScenario = "empty" } = {}) {
  await mockMenuApi(page, menuScenario);

  await page.route(/\/api\/auth\/login$/, async (route) => {
    if (route.request().method().toUpperCase() !== "POST") {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "buyer-token",
        user: {
          id: "buyer-1",
          name: "Maya Buyer",
          email: "buyer@gptcoffee.test",
          role: "buyer",
        },
      }),
    });
  });

  await page.route(/\/api\/orders\/my$/, async (route) => {
    if (route.request().method().toUpperCase() !== "GET") {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ordersScenario === "empty" ? { orders: [] } : { orders: [] }),
    });
  });
}

async function loginAsBuyer(page, recorder) {
  await recorder.recordStep("Open the Buyer application");
  await page.goto("/");

  await recorder.recordStep("Login as a buyer to reach the menu");
  await page.getByLabel("Email").fill("buyer@gptcoffee.test");
  await page.getByLabel("Password").fill("buyer123");
  await page.getByRole("button", { name: /^Login$/ }).click();

  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
}

test("buyer_app_browse_coffee_menu", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("buyer_app_browse_coffee_menu", "Browse available coffee menu products", testInfo.outputDir);

  await setupBuyerSession(page, { menuScenario: "default", ordersScenario: "empty" });
  await loginAsBuyer(page, recorder);

  await recorder.recordStep("Navigate through the visible coffee menu");
  await expect(page.getByText("Honey Oat Latte")).toBeVisible();
  await expect(page.getByText("Midnight Mocha")).toBeVisible();
  await expect(page.getByText("Maple Cloud Brew")).toBeVisible();

  await recorder.recordStep("Review multiple available coffee product cards");
  await expect(page.getByText("Caramelized maple cream over chilled cold brew.")).toBeVisible();
  await expect(page.getByText("Dark chocolate mocha with a velvet finish.")).toBeVisible();

  await recorder.recordStep("Select a coffee product to continue toward ordering");
  await page.getByRole("heading", { name: "Honey Oat Latte" }).locator("..").locator("..").getByRole("button", { name: "Customize" }).click();

  await expect(page.getByText("Customize")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Honey Oat Latte" })).toBeVisible();
  await expect(page.getByText("Cup Size")).toBeVisible();
  await expect(page.getByText("Milk")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:buyer_app_browse_coffee_menu");
  await recorder.save(testInfo);
});
