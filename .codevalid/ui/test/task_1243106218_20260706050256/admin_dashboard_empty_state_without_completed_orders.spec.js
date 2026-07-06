import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";

const adminUser = {
  id: "admin-1",
  name: "Ari Admin",
  email: "admin@gptcoffee.test",
  role: "admin",
};

const menuResponse = {
  products: [
    {
      id: "latte",
      name: "Velvet Latte",
      note: "Smooth & balanced",
      description: "Espresso with silky milk and a mellow finish.",
      price: 6.5,
      strength: "Balanced",
      gradient: "from-amber-300 via-orange-500 to-stone-900",
    },
  ],
  customizations: {
    sizes: [
      { id: "small", label: "Small", price: 0 },
      { id: "medium", label: "Medium", price: 0.5 },
    ],
    milks: [{ id: "whole", label: "Whole", price: 0 }],
    extras: [{ id: "vanilla", label: "Vanilla", price: 0.5 }],
  },
};

const ordersResponse = {
  orders: [],
};

const salesResponse = {
  daily: 0,
  monthly: 0,
  total: 0,
  orderCount: 0,
};

async function seedAdminSession(page) {
  await page.addInitScript((session) => {
    window.localStorage.setItem("gpt-coffee-token", session.token);
    window.localStorage.setItem("gpt-coffee-user", JSON.stringify(session.user));
  }, { token: "admin-token", user: adminUser });
}

async function mockAdminApis(page) {
  await page.route("**/api/menu", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(menuResponse),
    });
  });

  await page.route("**/api/admin/orders", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ordersResponse),
    });
  });

  await page.route("**/api/admin/sales", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(salesResponse),
    });
  });
}

test("Handle Empty State When No Completed Orders Exist", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("admin_dashboard_empty_state_without_completed_orders", testInfo);

  await recorder.step("Given an authenticated administrator and no completed orders in the system");
  await seedAdminSession(page);
  await mockAdminApis(page);

  await recorder.step("When the administrator opens the AdminDashboard component");
  await page.goto("/");

  await recorder.step("Then the dashboard loads without errors and displays zero sales metrics with an empty history table");
  await expect(page.getByText("Admin Dashboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live order history" })).toBeVisible();
  await expect(page.getByRole("cell", { name: /ORD-/ })).toHaveCount(0);
  await expect(page.getByText("Orders")).toBeVisible();
  await expect(page.getByText("Daily sales")).toBeVisible();
  await expect(page.getByText("Monthly sales")).toBeVisible();
  await expect(page.getByText("$0.00")).toHaveCount(3);
  await expect(page.getByText("0")).toBeVisible();
  await expect(page.getByText(/Could not connect to the server|Request failed|API status:/)).toHaveCount(0);

  console.log("CODEVALID_TEST_ASSERTION_OK:admin_dashboard_empty_state_without_completed_orders");
  await recorder.save(testInfo);
});
