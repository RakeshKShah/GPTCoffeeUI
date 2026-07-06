import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockAdminLoginFlow, mockMenuApi } from "../../helpers/mock-api.js";

test("Administrator manages coffee flavors", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("option_manager_manage_coffee_flavors_placeholder", testInfo);

  await recorder.step("Register admin authentication and initial dashboard API mocks.");
  await mockAdminLoginFlow(page, { loginScenario: "success", menuScenario: "default" });

  await recorder.step("Register product management API mocks for add, update, and remove actions.");
  await page.route(/\/admin\/products$/, async (route) => {
    if (route.request().method().toUpperCase() !== "POST") {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        product: {
          id: "hazelnut-halo",
          name: "Hazelnut Halo",
          note: "Toasted hazelnut",
          description: "Velvety roast finished with a warm hazelnut aroma.",
          price: 6.75,
          strength: "Smooth",
          gradient: "from-amber-300 via-orange-500 to-stone-900"
        }
      })
    });
  });

  await page.route(/\/admin\/products\/espresso-noir$/, async (route) => {
    if (route.request().method().toUpperCase() !== "PATCH") {
      return route.fallback();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        product: {
          id: "espresso-noir",
          name: "Espresso Noir Reserve",
          note: "Dark cacao",
          description: "Bold espresso with a velvet finish and a richer roast profile.",
          price: 5.1,
          strength: "Intense",
          gradient: "from-amber-300 via-orange-500 to-stone-900"
        }
      })
    });
  });

  await page.route(/\/admin\/products\/vanilla-cloud$/, async (route) => {
    if (route.request().method().toUpperCase() !== "DELETE") {
      return route.fallback();
    }

    await route.fulfill({
      status: 204,
      contentType: "application/json",
      body: JSON.stringify({})
    });
  });

  await recorder.step("Open the admin dashboard.");
  await page.goto("/");
  await page.getByLabel("Email").fill("admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("admin123");
  await page.locator("form").getByRole("button").last().click();
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();

  await recorder.step("Add a new coffee flavor from the coffee flavor management area.");
  await page.getByLabel("Name").fill("Hazelnut Halo");
  await page.getByLabel("Price").fill("6.75");
  await page.getByLabel("Tasting note").fill("Toasted hazelnut");
  await page.getByLabel("Strength").fill("Smooth");
  await page.getByLabel("Description").fill("Velvety roast finished with a warm hazelnut aroma.");
  await page.getByRole("button", { name: "Add flavor" }).click();
  await expect(page.getByText("Hazelnut Halo")).toBeVisible();
  await expect(page.getByText("$6.75 · Smooth")).toBeVisible();

  await recorder.step("Update an existing coffee flavor.");
  await page.getByRole("button", { name: /^edit espresso noir$/i }).click();
  await page.getByLabel("Name").fill("Espresso Noir Reserve");
  await page.getByLabel("Price").fill("5.1");
  await page.getByLabel("Strength").fill("Intense");
  await page.getByLabel("Description").fill("Bold espresso with a velvet finish and a richer roast profile.");
  await page.getByRole("button", { name: "Save flavor" }).click();
  await expect(page.getByText("Espresso Noir Reserve")).toBeVisible();
  await expect(page.getByText("$5.10 · Intense")).toBeVisible();

  await recorder.step("Remove an existing coffee flavor.");
  await page.getByRole("button", { name: /^remove vanilla cloud$/i }).click();
  await expect(page.getByText("Vanilla Cloud")).toHaveCount(0);

  await recorder.step("Verify the updated menu data can be reflected in the ordering experience for an added flavor.");
  await page.unroute(/\/api\/menu$/);
  await mockMenuApi(page, "buyer_with_added_flavor");
  await page.goto("/");
  await expect(page.getByText("Hazelnut Halo")).toBeVisible();

  await recorder.step("Verify the updated menu data can be reflected in the ordering experience for an updated flavor.");
  await page.unroute(/\/api\/menu$/);
  await mockMenuApi(page, "buyer_with_updated_menu");
  await page.goto("/");
  await expect(page.getByText("Espresso Noir Reserve")).toBeVisible();
  await expect(page.getByText("Intense")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:option_manager_manage_coffee_flavors_placeholder");
  await recorder.save(testInfo);
});
