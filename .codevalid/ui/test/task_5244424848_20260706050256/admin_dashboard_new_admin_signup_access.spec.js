import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";

test("New Administrator Account Receives Administrator Access", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_dashboard_new_admin_signup_access", testInfo);

  await recorder.step("Register signup and subsequent admin dashboard mocks");
  await page.route(/\/api\/auth\/signup$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "new-admin-token",
        user: {
          id: "admin-2",
          name: "Dana Admin",
          email: "dana.admin@gptcoffee.test",
          role: "admin",
        },
      }),
    });
  });

  await page.route(/\/api\/menu$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        products: [
          {
            id: "honey-oat-latte",
            name: "Honey Oat Latte",
            note: "Floral honey · espresso comfort",
            description: "Silky espresso folded with oat milk and a honey drizzle.",
            price: 6.5,
            strength: "Balanced",
            gradient: "from-amber-300 via-orange-500 to-stone-900",
          }
        ],
        customizations: {
          sizes: [
            { id: "small", label: "Small", price: 0 },
            { id: "medium", label: "Medium", price: 0.5 },
            { id: "large", label: "Large", price: 1.0 }
          ],
          milks: [
            { id: "oat", label: "Oat", price: 0.5 },
            { id: "whole", label: "Whole", price: 0 },
            { id: "almond", label: "Almond", price: 0.5 }
          ],
          extras: [
            { id: "vanilla-sweet-foam", label: "Vanilla Sweet Foam", price: 0.75 }
          ]
        }
      }),
    });
  });

  await page.route(/\/api\/admin\/orders$/, async (route) => {
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
            items: [
              {
                id: "line-1",
                productName: "Honey Oat Latte",
                quantity: 1,
                total: 6.5
              }
            ],
            total: 6.5
          }
        ]
      }),
    });
  });

  await page.route(/\/api\/admin\/sales$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        orderCount: 1,
        daily: 6.5,
        monthly: 6.5,
        total: 6.5,
      }),
    });
  });

  await recorder.step("Open the account creation or sign-up page");
  await page.goto("/");
  await page.getByRole("button", { name: "signup" }).click();
  await expect(page.getByLabel("Name")).toBeVisible();

  await recorder.step("Create a new account with administrator role information");
  await page.getByLabel("Name").fill("Dana Admin");
  await page.getByLabel("Email").fill("dana.admin@gptcoffee.test");
  await page.getByLabel("Password").fill("adminplus123");

  await recorder.step("Submit the sign-up form");
  await page.getByRole("button", { name: "Create buyer account" }).click();

  await recorder.step("Verify the newly created administrator account is authenticated and can access AdminDashboard");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Manage orders from anywhere." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Coffee flavors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customization options" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_dashboard_new_admin_signup_access");
  await recorder.save(testInfo);
});
