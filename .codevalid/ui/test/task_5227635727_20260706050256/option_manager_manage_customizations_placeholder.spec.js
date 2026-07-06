import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockAdminLoginFlow, mockMenuApi } from "../../helpers/mock-api.js";

test("Administrator updates drink customization options", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("option_manager_manage_customizations_placeholder", testInfo);

  await recorder.step("Register admin authentication and initial dashboard API mocks.");
  await mockAdminLoginFlow(page, { loginScenario: "success", menuScenario: "default" });

  await recorder.step("Register customization save API mock.");
  await page.route(/\/admin\/customizations$/, async (route) => {
    if (route.request().method().toUpperCase() !== "PUT") {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        customizations: {
          sizes: [
            { id: "xl", label: "XL", price: 1.5 },
            { id: "small", label: "Small", price: 0 },
            { id: "medium", label: "Medium", price: 0.5 },
            { id: "large", label: "Large", price: 1 }
          ],
          milks: [
            { id: "whole", label: "Whole", price: 0 },
            { id: "oat", label: "Oat", price: 0.75 }
          ],
          extras: [
            { id: "nutmeg", label: "Nutmeg", price: 0.4 },
            { id: "cinnamon", label: "Cinnamon", price: 0.25 },
            { id: "caramel", label: "Caramel", price: 0.5 }
          ]
        }
      })
    });
  });

  await recorder.step("Open the customization management area from the admin dashboard.");
  await page.goto("/");
  await page.getByLabel("Email").fill("admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("admin123");
  await page.locator("form").getByRole("button").last().click();
  await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();

  await recorder.step("Modify drink customization options by adding a new size and a new extra.");
  await page.getByPlaceholder("New sizes").fill("XL");
  await page.locator('input[type="number"]').nth(1).fill("1.5");
  await page.getByRole("button", { name: "Add" }).nth(0).click();
  await expect(page.getByText("XL · $1.50")).toBeVisible();

  await page.getByPlaceholder("New extras").fill("Nutmeg");
  await page.locator('input[type="number"]').nth(3).fill("0.4");
  await page.getByRole("button", { name: "Add" }).nth(2).click();
  await expect(page.getByText("Nutmeg · $0.40")).toBeVisible();

  await recorder.step("Save the customization changes.");
  await page.getByRole("button", { name: "Save all" }).click();
  await expect(page.getByText("XL · $1.50")).toBeVisible();
  await expect(page.getByText("Nutmeg · $0.40")).toBeVisible();

  await recorder.step("Verify updated customization data becomes available in the ordering experience.");
  await page.unroute(/\/api\/menu$/);
  await mockMenuApi(page, "buyer_with_updated_customizations");
  await page.goto("/");
  await expect(page.getByText("Espresso Noir")).toBeVisible();
  await page.getByRole("button", { name: /espresso noir/i }).click();
  await expect(page.getByRole("heading", { name: "Espresso Noir" })).toBeVisible();
  await expect(page.getByRole("button", { name: /xl/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /nutmeg/i })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:option_manager_manage_customizations_placeholder");
  await recorder.save(testInfo);
});
