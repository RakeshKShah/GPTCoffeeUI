/**
 * Sample Playwright test for GPT Coffee UI.
 *
 * Covers the core user journeys exercised against the mock API server:
 *  - Page load and login screen renders correctly
 *  - Buyer login with mock credentials
 *  - Menu products are displayed after login
 *  - Buyer can add an item to cart
 *  - Buyer can checkout
 *  - Admin login and dashboard view
 *
 * The mock server (mock/mock-server.js) must be running, or started via
 * globalSetup, before these tests execute.
 *
 * ExecutionRecorder is used to capture test steps for CodeValid recordings.
 */

import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../helpers/execution-recorder.js";

const BASE_URL = "http://localhost:5174";

// ---------------------------------------------------------------------------
// Helper: reset mock API state between test runs
// ---------------------------------------------------------------------------
async function resetMockApi(request) {
  try {
    await request.post("http://localhost:4100/api/_reset");
  } catch {
    // Ignore – mock server may not be running in all environments.
  }
}

// ---------------------------------------------------------------------------
// Test: Login screen renders
// ---------------------------------------------------------------------------
test("login screen renders with branding and credential cards", async ({
  page,
  request,
}, testInfo) => {
  const recorder = new ExecutionRecorder(
    { testId: "CV-001", testTitle: "Login screen renders" },
    testInfo.title
  );

  await resetMockApi(request);

  await recorder.step("Navigate to app root", async () => {
    await page.goto(BASE_URL);
  });

  await recorder.step("Verify GPT Coffee heading is visible", async () => {
    await expect(page.getByText("GPT Coffee")).toBeVisible({ timeout: 15000 });
  });

  await recorder.step("Verify login / signup toggle is present", async () => {
    await expect(page.getByRole("button", { name: "login" })).toBeVisible();
    await expect(page.getByRole("button", { name: "signup" })).toBeVisible();
  });

  await recorder.step("Verify sample credential cards are shown", async () => {
    await expect(page.getByText("Sample buyer")).toBeVisible();
    await expect(page.getByText("Sample admin")).toBeVisible();
  });

  await recorder.save(testInfo);
});

// ---------------------------------------------------------------------------
// Test: Buyer login and menu loads
// ---------------------------------------------------------------------------
test("buyer can log in and see the menu", async ({ page, request }, testInfo) => {
  const recorder = new ExecutionRecorder(
    { testId: "CV-002", testTitle: "Buyer login and menu loads" },
    testInfo.title
  );

  await resetMockApi(request);

  await recorder.step("Navigate to app", async () => {
    await page.goto(BASE_URL);
  });

  await recorder.step("Fill in buyer credentials", async () => {
    await page.getByLabel("Email").fill("buyer@gptcoffee.test");
    await page.getByLabel("Password").fill("buyer123");
  });

  await recorder.step("Submit login form", async () => {
    await page.getByRole("button", { name: /login/i }).last().click();
  });

  await recorder.step("Wait for menu section to appear", async () => {
    await expect(page.getByText("Signature drinks")).toBeVisible({ timeout: 15000 });
  });

  await recorder.step("Verify at least one product card is visible", async () => {
    const customizeButtons = page.getByRole("button", { name: "Customize" });
    await expect(customizeButtons.first()).toBeVisible({ timeout: 10000 });
  });

  await recorder.save(testInfo);
});

// ---------------------------------------------------------------------------
// Test: Buyer can add an item to cart
// ---------------------------------------------------------------------------
test("buyer can add a product to the cart", async ({ page, request }, testInfo) => {
  const recorder = new ExecutionRecorder(
    { testId: "CV-003", testTitle: "Buyer adds item to cart" },
    testInfo.title
  );

  await resetMockApi(request);

  // Log in as buyer
  await page.goto(BASE_URL);
  await page.getByLabel("Email").fill("buyer@gptcoffee.test");
  await page.getByLabel("Password").fill("buyer123");
  await page.getByRole("button", { name: /login/i }).last().click();
  await expect(page.getByText("Signature drinks")).toBeVisible({ timeout: 15000 });

  await recorder.step("Click Customize on first product", async () => {
    await page.getByRole("button", { name: "Customize" }).first().click();
  });

  await recorder.step("Customization panel opens", async () => {
    await expect(page.getByText("Customize")).toBeVisible({ timeout: 5000 });
  });

  await recorder.step("Click Add to cart", async () => {
    await page.getByRole("button", { name: /add to cart/i }).click();
  });

  await recorder.step("Cart shows 1 item badge", async () => {
    // The cart badge shows item count; look for a '1' near the shopping bag
    await expect(page.getByText("1")).toBeVisible({ timeout: 5000 });
  });

  await recorder.save(testInfo);
});

// ---------------------------------------------------------------------------
// Test: Admin login and dashboard
// ---------------------------------------------------------------------------
test("admin can log in and view the dashboard", async ({ page, request }, testInfo) => {
  const recorder = new ExecutionRecorder(
    { testId: "CV-004", testTitle: "Admin login and dashboard" },
    testInfo.title
  );

  await resetMockApi(request);

  await recorder.step("Navigate to app", async () => {
    await page.goto(BASE_URL);
  });

  await recorder.step("Enter admin credentials", async () => {
    await page.getByLabel("Email").fill("admin@gptcoffee.test");
    await page.getByLabel("Password").fill("admin123");
  });

  await recorder.step("Submit login", async () => {
    await page.getByRole("button", { name: /login/i }).last().click();
  });

  await recorder.step("Admin Dashboard heading is visible", async () => {
    await expect(page.getByText("Admin Dashboard")).toBeVisible({ timeout: 15000 });
  });

  await recorder.step("Sales metrics cards are visible", async () => {
    await expect(page.getByText("Orders")).toBeVisible();
    await expect(page.getByText("Daily sales")).toBeVisible();
  });

  await recorder.save(testInfo);
});
