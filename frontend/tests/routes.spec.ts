import { test, expect } from '@playwright/test';

/**
 * Route Guard Rails for SATYAPAN
 * Ensures every registered route renders without 404/crash and sets the title.
 */

const PUBLIC_STATIC_ROUTES = [
  { path: '/policies', titleSnippet: 'Policies' },
  { path: '/accessibility', titleSnippet: 'Accessibility' },
  { path: '/terms', titleSnippet: 'Terms' },
  { path: '/help', titleSnippet: 'Help' },
  { path: '/contact', titleSnippet: 'Contact' },
  { path: '/feedback', titleSnippet: 'Feedback' },
  { path: '/styleguide', titleSnippet: 'Styleguide' },
];

const INSTITUTE_ROUTES = [
  '/institute/dashboard',
  '/institute/profile',
  '/institute/faculty',
  '/institute/students',
  '/institute/new-application',
  '/institute/track',
  '/institute/documents',
  '/institute/reports',
  '/institute/notifications',
  '/institute/help',
];

const OFFICIAL_ROUTES = [
  '/official/dashboard',
  '/official/applications/1',
  '/official/admin/rules',
  '/official/scan/fire_noc_clean.pdf?presenter=1',
];

test.describe('Public & Static Route Guard Rails', () => {
  test('Login route loads and contains SATYAPAN branding', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/SATYAPAN/);
    const emblem = page.locator('text=सत्यमेव जयते');
    await expect(emblem.first()).toBeVisible();
  });

  for (const route of PUBLIC_STATIC_ROUTES) {
    test(`Static route ${route.path} renders and contains SATYAPAN title`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveTitle(/SATYAPAN/);
      // Ensure no error boundary is triggered
      const body = page.locator('body');
      await expect(body).not.toContainText('404 Not Found');
      await expect(body).not.toContainText('Page Not Found');
      await expect(body).not.toContainText('Something went wrong');
    });
  }
});

test.describe('Institute Authenticated Route Guard Rails', () => {
  test.beforeEach(async ({ page }) => {
    // Seed demo authentication state in localStorage / cookies
    await page.addInitScript(() => {
      localStorage.setItem('satyapan_demo_role', 'INSTITUTE_ADMIN');
      localStorage.setItem('satyapan_user', JSON.stringify({
        id: 'inst-user-001',
        name: 'Dr. Principal Sharma',
        role: 'INSTITUTE_ADMIN',
        institute_id: 'AICTE-1-3324901'
      }));
    });
  });

  for (const route of INSTITUTE_ROUTES) {
    test(`Institute route ${route} renders without crash`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveTitle(/SATYAPAN/);
      const root = page.locator('#root');
      await expect(root).toBeVisible();
      await expect(root).not.toContainText('Cannot read properties of');
      await expect(root).not.toContainText('Uncaught TypeError');
    });
  }
});

test.describe('Official Authenticated Route Guard Rails', () => {
  test.beforeEach(async ({ page }) => {
    // Seed official demo authentication state
    await page.addInitScript(() => {
      localStorage.setItem('satyapan_demo_role', 'OFFICIAL_SCRUTINY');
      localStorage.setItem('satyapan_user', JSON.stringify({
        id: 'off-user-001',
        name: 'Shri R. K. Verma',
        role: 'OFFICIAL_SCRUTINY',
      }));
    });
  });

  for (const route of OFFICIAL_ROUTES) {
    test(`Official route ${route} renders without crash`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveTitle(/SATYAPAN/);
      const root = page.locator('#root');
      await expect(root).toBeVisible();
      await expect(root).not.toContainText('Cannot read properties of');
      await expect(root).not.toContainText('Uncaught TypeError');
    });
  }
});

