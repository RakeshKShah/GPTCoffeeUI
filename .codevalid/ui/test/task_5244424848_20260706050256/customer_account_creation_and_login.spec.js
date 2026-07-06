import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { mockMenuApi, mockBuyerLoginFlow } from "../../helpers/mock-api.js";

test("Customer Account Creation and Login", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("customer_account_creation_and_login", "Customer Account Creation and Login");

  await recorder.step("Open the authentication screen and register API mocks.");
  await page.route(/\/api\/auth\/signup$/, async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "customer-signup-token",
        user: {
          id: "buyer-2",
          name: "Casey Customer",
          email: "casey.customer@gptcoffee.test",
          role: "buyer"
        }
      })
    });
  });
  await page.route(/\/api\/auth\/login$/, async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const body = route.request().postDataJSON();
    const isCreatedCustomer = body?.email === "casey.customer@gptcoffee.test" && body?.password === "brewpass123";
    await route.fulfill({
      status: isCreatedCustomer ? 200 : 401,
      contentType: "application/json",
      body: JSON.stringify(
        isCreatedCustomer
          ? {
              token: "customer-login-token",
              user: {
                id: "buyer-2",
                name: "Casey Customer",
                email: "casey.customer@gptcoffee.test",
                role: "buyer"
              }
            }
          : { message: "Invalid credentials" }
      )
    });
  });
  await mockMenuApi(page, "default");
  await page.route(/\/api\/orders\/my$/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ orders: [] })
    });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /order from home\. pick up when your cup is ready\./i })).toBeVisible();

  await recorder.step("Select signup flow and enter valid customer registration details.");
  await page.getByRole("button", { name: "signup" }).click();
  await page.getByPlaceholder("Your name").fill("Casey Customer");
  await page.getByPlaceholder("you@example.com").fill("casey.customer@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("brewpass123");

  await recorder.step("Submit the registration form and verify buyer access is granted.");
  await page.getByRole("button", { name: /create buyer account/i }).click();
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByText("Your Cart")).toBeVisible();
  await expect(page.getByText("Admin Dashboard")).toHaveCount(0);

  await recorder.step("Log out and log back in with the newly created customer credentials.");
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.locator("form").getByRole("button").last()).toBeVisible();
  await page.getByPlaceholder("you@example.com").fill("casey.customer@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("brewpass123");
  await page.locator("form").getByRole("button").last().click();

  await recorder.step("Observe the authenticated customer experience.");
  await expect(page.getByRole("heading", { name: "Signature drinks" })).toBeVisible();
  await expect(page.getByText("Pickup order").or(page.getByText("Start an order"))).toBeVisible();
  await expect(page.getByText("Admin Dashboard")).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:customer_account_creation_and_login");
  await recorder.save(testInfo);
});
