import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";

test("Administrator Account Creation and Login", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("administrator_account_creation_and_login", "Administrator Account Creation and Login");

  await recorder.step("Open the authentication screen and register administrator auth mocks.");
  await page.route(/\/api\/auth\/signup$/, async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "new-admin-token",
        user: {
          id: "admin-2",
          name: "Dana Admin",
          email: "dana.admin@gptcoffee.test",
          role: "admin"
        }
      })
    });
  });
  await page.route(/\/api\/auth\/login$/, async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const body = route.request().postDataJSON();
    const isNewAdmin = body?.email === "dana.admin@gptcoffee.test" && body?.password === "adminplus123";
    await route.fulfill({
      status: isNewAdmin ? 200 : 401,
      contentType: "application/json",
      body: JSON.stringify(
        isNewAdmin
          ? {
              token: "new-admin-token",
              user: {
                id: "admin-2",
                name: "Dana Admin",
                email: "dana.admin@gptcoffee.test",
                role: "admin"
              }
            }
          : { message: "Invalid credentials" }
      )
    });
  });
  await page.route(/\/api\/menu$/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ products: [], customizations: { sizes: [], milks: [], extras: [] } })
    });
  });
  await page.route(/\/api\/admin\/orders$/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        orders: [
          {
            id: "ORD-4001",
            buyerId: "buyer-9",
            buyerName: "Launch Buyer",
            createdAt: "2026-07-06T12:00:00.000Z",
            readyAt: "2026-07-06T12:15:00.000Z",
            status: "Placed",
            items: [{ id: "line-1", productName: "Honey Oat Latte", quantity: 1, total: 6.5 }],
            total: 6.5
          }
        ]
      })
    });
  });
  await page.route(/\/api\/admin\/sales$/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ orderCount: 1, daily: 6.5, monthly: 6.5, total: 6.5 })
    });
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Signup" })).toBeVisible();

  await recorder.step("Select account creation flow and enter valid administrator registration information.");
  await page.getByRole("button", { name: "Signup" }).click();
  await page.getByPlaceholder("Your name").fill("Dana Admin");
  await page.getByPlaceholder("you@example.com").fill("dana.admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("adminplus123");

  await recorder.step("Submit signup and verify administrator dashboard is shown.");
  await page.getByRole("button", { name: /create buyer account/i }).click();
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: /manage orders from anywhere\./i })).toBeVisible();
  await expect(page.getByText("Signature drinks")).toHaveCount(0);

  await recorder.step("Log out and log in again with the newly created administrator credentials.");
  await page.getByRole("button", { name: /log out/i }).click();
  await page.getByPlaceholder("you@example.com").fill("dana.admin@gptcoffee.test");
  await page.getByPlaceholder("••••••••").fill("adminplus123");
  await page.getByRole("button", { name: /^login$/i }).click();

  await recorder.step("Observe the authenticated administrator experience.");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByText("Daily sales")).toBeVisible();
  await expect(page.getByText("Monthly sales")).toBeVisible();
  await expect(page.getByText("All-time sales")).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:administrator_account_creation_and_login");
  await recorder.save(testInfo);
});
