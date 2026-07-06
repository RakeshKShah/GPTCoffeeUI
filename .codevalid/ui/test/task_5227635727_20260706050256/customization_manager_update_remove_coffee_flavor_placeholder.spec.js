import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";
import { mockAdminLoginFlow } from "../helpers/mock-api.js";

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

test("Administrator can update or remove an existing coffee flavor", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("customization_manager_update_remove_coffee_flavor_placeholder", "Administrator can update or remove an existing coffee flavor");

  const updatedProduct = {
    id: "espresso-noir",
    name: "Espresso Noir Reserve",
    note: "Dark cacao",
    description: "Bold espresso with a velvet finish and a richer roast profile.",
    price: 5.1,
    strength: "Intense",
    gradient: "from-amber-300 via-orange-500 to-stone-900",
  };

  const remainingProduct = {
    id: "vanilla-cloud",
    name: "Vanilla Cloud",
    note: "Sweet cream",
    description: "Smooth roast with vanilla sweetness.",
    price: 5.25,
    strength: "Balanced",
    gradient: "from-yellow-200 via-amber-300 to-orange-700",
  };

  const customizations = {
    sizes: [
      { id: "small", label: "Small", price: 0 },
      { id: "medium", label: "Medium", price: 0.5 },
      { id: "large", label: "Large", price: 1 },
    ],
    milks: [
      { id: "whole", label: "Whole", price: 0 },
      { id: "oat", label: "Oat", price: 0.75 },
    ],
    extras: [
      { id: "cinnamon", label: "Cinnamon", price: 0.25 },
      { id: "caramel", label: "Caramel", price: 0.5 },
    ],
  };

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await mockAdminLoginFlow(page, { loginScenario: "success", menuScenario: "default" });
  await mockScenario(page, "PATCH", "/api/admin/products/espresso-noir", {
    status: 200,
    body: { product: updatedProduct },
  });
  await mockScenario(page, "DELETE", "/api/admin/products/vanilla-cloud", {
    status: 204,
    body: {},
  });

  await recorder.step("Open the app and log in as an administrator", async () => {
    await page.goto("/");
    await page.getByLabel("Email").fill("admin@gptcoffee.test");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  });

  await recorder.step("Open an existing coffee flavor entry and update it", async () => {
    const espressoCard = page.locator("div.rounded-3xl.border", { hasText: "Espresso Noir" }).first();
    await espressoCard.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Name").fill(updatedProduct.name);
    await page.getByLabel("Price").fill(String(updatedProduct.price));
    await page.getByLabel("Strength").fill(updatedProduct.strength);
    await page.getByLabel("Description").fill(updatedProduct.description);
    await page.getByRole("button", { name: "Save flavor" }).click();
    await expect(page.getByText(updatedProduct.name)).toBeVisible();
    await expect(page.getByText("$5.10 · Intense")).toBeVisible();
  });

  await recorder.step("Remove another existing coffee flavor", async () => {
    const vanillaCard = page.locator("div.rounded-3xl.border", { hasText: "Vanilla Cloud" }).first();
    await vanillaCard.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("Vanilla Cloud")).toHaveCount(0);
  });

  await recorder.step("Log out and verify ordering experience reflects the updated and removed flavors", async () => {
    await page.unroute(/\/api\/menu$/);
    await mockScenario(page, "GET", "/api/menu", {
      status: 200,
      body: {
        products: [updatedProduct],
        customizations,
      },
    });

    await page.getByRole("button", { name: "Logout" }).click();
    await page.getByRole("button", { name: "Sample buyer" }).click();
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText(updatedProduct.name)).toBeVisible();
    await expect(page.getByText("Vanilla Cloud")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customization_manager_update_remove_coffee_flavor_placeholder");
  await recorder.save(testInfo);
});
