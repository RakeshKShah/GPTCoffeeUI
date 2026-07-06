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

test("Administrator can add a coffee flavor", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("customization_manager_add_coffee_flavor_placeholder", "Administrator can add a coffee flavor");

  const addedProduct = {
    id: "hazelnut-halo",
    name: "Hazelnut Halo",
    note: "Toasted hazelnut",
    description: "Velvety roast finished with a warm hazelnut aroma.",
    price: 6.75,
    strength: "Smooth",
    gradient: "from-amber-300 via-orange-500 to-stone-900",
  };

  const baseMenu = {
    products: [
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
    ],
    customizations: {
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
    },
  };

  const buyerMenu = {
    products: [addedProduct, ...baseMenu.products],
    customizations: baseMenu.customizations,
  };

  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await mockAdminLoginFlow(page, { loginScenario: "success", menuScenario: "default" });
  await mockScenario(page, "POST", "/api/admin/products", {
    status: 200,
    body: { product: addedProduct },
  });

  await recorder.step("Open the app and log in as an administrator", async () => {
    await page.goto("/");
    await page.getByLabel("Email").fill("admin@gptcoffee.test");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  });

  await recorder.step("Open the menu management functionality and add a new coffee flavor", async () => {
    await page.getByLabel("Name").fill(addedProduct.name);
    await page.getByLabel("Price").fill(String(addedProduct.price));
    await page.getByLabel("Tasting note").fill(addedProduct.note);
    await page.getByLabel("Strength").fill(addedProduct.strength);
    await page.getByLabel("Description").fill(addedProduct.description);
    await page.getByRole("button", { name: "Add flavor" }).click();
  });

  await recorder.step("Verify the new flavor appears in admin menu management", async () => {
    await expect(page.getByText(addedProduct.name)).toBeVisible();
    await expect(page.getByText("$6.75 · Smooth")).toBeVisible();
  });

  await recorder.step("Log out and confirm the added flavor is available in the ordering experience", async () => {
    await page.unroute(/\/api\/menu$/);
    await mockScenario(page, "GET", "/api/menu", {
      status: 200,
      body: buyerMenu,
    });

    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();

    await page.getByRole("button", { name: "Sample buyer" }).click();
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
    await expect(page.getByText(addedProduct.name)).toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:customization_manager_add_coffee_flavor_placeholder");
  await recorder.save(testInfo);
});
