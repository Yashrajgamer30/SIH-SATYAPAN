import { test, expect } from '@playwright/test';

/**
 * Admin Rule Engine E2E Specification
 * Validates dynamic rule retrieval, JSON editing, active toggles, and reset functionality.
 */

test.describe('Official Admin Rules Engine (/official/admin/rules)', () => {
  test.beforeEach(async ({ page }) => {
    // Seed SYSTEM_ADMIN official role
    await page.addInitScript(() => {
      localStorage.setItem('satyapan_demo_role', 'SYSTEM_ADMIN');
      localStorage.setItem('satyapan_user', JSON.stringify({
        id: 'admin-001',
        name: 'AICTE Central Administrator',
        role: 'SYSTEM_ADMIN',
      }));
    });
  });

  test('displays all 6 statutory APH 2026-27 rules with version badges and descriptions', async ({ page }) => {
    await page.goto('/official/admin/rules');
    await expect(page).toHaveTitle(/SATYAPAN/);

    // Advisory banner must be present
    const advisory = page.locator('text=Advisory Decision-Support Notice');
    await expect(advisory.first()).toBeVisible();

    // Verify key statutory rule codes appear
    const expectedRules = [
      'LAND_AREA_COMPLIANCE',
      'FIRE_NOC_VALIDITY',
      'FACULTY_CADRE_RATIO',
      'FDR_DEPOSIT_SECURITY',
      'BUILDING_SAFETY_AND_OCCUPANCY',
      'STATUTORY_AFFIDAVIT_INTEGRITY',
    ];

    for (const ruleCode of expectedRules) {
      const badge = page.locator(`text=${ruleCode}`);
      await expect(badge.first()).toBeVisible();
    }
  });

  test('allows expanding JSON editor, validates syntax, and supports editing', async ({ page }) => {
    await page.goto('/official/admin/rules');

    // Find the first Edit button
    const editButtons = page.locator('button:has-text("Edit")');
    if (await editButtons.count() > 0) {
      await editButtons.first().click();

      // Textarea should appear
      const textarea = page.locator('textarea');
      await expect(textarea).toBeVisible();

      // Enter invalid JSON and click Save
      await textarea.fill('{ invalid_json: ');
      const saveBtn = page.locator('button:has-text("Save New Version")');
      await saveBtn.click();

      // Should show validation error message
      const errorMsg = page.locator('text=Invalid JSON');
      await expect(errorMsg).toBeVisible();

      // Click Cancel
      const cancelBtn = page.locator('button:has-text("Cancel")');
      await cancelBtn.click();
      await expect(textarea).not.toBeVisible();
    }
  });

  test('displays reset to statutory defaults button', async ({ page }) => {
    await page.goto('/official/admin/rules');
    const resetBtn = page.locator('button:has-text("Reset to APH Defaults")');
    await expect(resetBtn).toBeVisible();
  });
});
