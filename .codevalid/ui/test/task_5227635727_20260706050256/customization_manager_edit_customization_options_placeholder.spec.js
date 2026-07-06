import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockAdminLoginFlow } from "../../helpers/mock-api.js";

async function mockScenario(page, method, endpointPath, response) {
  const escaped = endpointPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await page.route(new RegExp(`${escaped}$`), async (route) => {
    if (route.request().method().toUpperCase() !== method.toUpperCase()) {
      return route.fallback();
    }

    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: JSON.stringify(response.body),
    });
  });
}

test("Administrator can edit drink customization options", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("customization_manager_edit_customization_options_placeholder", "Administrator can edit drink customization options");

  const baseProducts = [
    {
      id: "espresso-noir",
      name: "Espresso Noir",
      note: "Dark cacao",
      description: "Bold espresso with a velvet finish.",
      price: 4.5,
      strength: "Bold",
      gradient: "from-amber-300 via-orange-500 to-stone-900",
    },
    {
      id: "vanilla-cloud",
      name: "Vanilla Cloud",
      note: "Sweet cream",
      description: "Smooth roast with vanilla sweetness.",
      price: 5.25,
      strength: "Balanced",
      gradient: "from-yellow-200 via-amber-300 to-orange-700",
    },
  ];

  const updatedCustomizations = {
    sizes: [
      { id: "xl", label: "XL", price: 1.5 },
      { id: "small", label: "Small", price: 0 },
      { id: "medium", label: "Medium", price: 0.5 },
      { id: "large", label: "Large", price: 1 },
    ],
    milks: [
      { id: "whole", label: "Whole", price: 0 },
      { id: "oat", label: "Oat", price: 0.75 },
    ],
    extras: [
      { id: "nutmeg", label: "Nutmeg", price: 0.4 },
      { id: "cinnamon", label: "Cinnamon", price: 0.25 },
      { id: "caramel", label: "Caramel", price: 0.5 },
    ],
  };

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await mockAdminLoginFlow(page, { loginScenario: "success", menuScenario: "default" });
  await mockScenario(page, "PUT", "/api/admin/customizations", {
    status: 200,
    body: { customizations: updatedCustomizations },
  });

  await recorder.step("Open the app and log in as an administrator", async () => {
    await page.goto("/");
    await page.getByLabel("Email").fill("admin@gptcoffee.test");
    await page.getByLabel("Password").fill("admin123");
    await page.locator("form").getByRole("button").last().click();
    await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
  });

  await recorder.step("Modify drink customization options", async () => {
    await page.getByPlaceholder("New sizes").fill("XL");
    await page.locator('input[type="number"]').nth(1).fill("1.5");
    await page.getByPlaceholder("New sizes").locator("..").getByRole("button", { name: "Add" }).click();

    await page.getByPlaceholder("New extras").fill("Nutmeg");
    await page.locator('input[type="number"]').nth(3).fill("0.4");
    await page.getByPlaceholder("New extras").locator("..").getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("XL · $1.50")).toBeVisible();
    await expect(page.getByText("Nutmeg · $0.40")).toBeVisible();
  });

  await recorder.step("Save the changes", async () => {
    await page.getByRole("button", { name: "Save all" }).click();
    await expect(page.getByText("XL · $1.50")).toBeVisible();
    await expect(page.getByText("Nutmeg · $0.40")).toBeVisible();
  });

  await recorder.step("Log out and verify the ordering experience reflects updated customization options", async () => {
    await page.unroute(/\/api\/menu$/);
    await mockScenario(page, "GET", "/api/menu", {
      status: 200,
      body: {
        products: baseProducts,
        customizations: updatedCustomizations,
      },
    });

    await page.getByRole("button", { name: "Logout" }).click();
    await page.getByRole("button", { name: "Sample buyer" }).click();
    await page.locator("form").getByRole("button").last().click();

    await page.getByRole("button", { name: "Customize" }).first().click();
    await expect(page.getByRole("heading", { name: "Espresso Noir" })).toBeVisible();
    await expect(page.getByRole("button", { name: /XL/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Nutmeg/ })).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customization_manager_edit_customization_options_placeholder");
  await recorder.save(testInfo);
});
