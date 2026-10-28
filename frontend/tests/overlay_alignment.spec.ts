import { test, expect } from '@playwright/test';

/**
 * SATYAPAN - Step 3d Playwright Test
 * Validates overlay alignment on fire_noc_clean.pdf:
 * For each overlay rectangle, sample the page image under it;
 * the rectangle must contain dark (non-blank) pixels (at least 3% below 200 grey value).
 * Verified at zoom 100% and 200%.
 */

test.describe('Document Overlay Alignment & Pixel Sampling', () => {
  test('fire_noc_clean.pdf overlay rectangles contain >= 3% non-blank dark pixels at 100% and 200% zoom', async ({ page }) => {
    // Navigate to Scrutiny Scanner with fire_noc_clean.pdf
    await page.goto('/official/scan/fire_noc_clean.pdf?presenter=1');
    await page.waitForSelector('.stage img.page');

    // Wait for SVG overlay to load rectangles
    const overlay = page.locator('.stage svg.overlay');
    await expect(overlay).toBeVisible();

    const rects = page.locator('.stage svg.overlay rect');
    const rectCount = await rects.count();
    expect(rectCount).toBeGreaterThanOrEqual(4);

    // Function to sample pixel canvas data under element bounding boxes
    const verifyRectDarkPixels = async (zoomLabel: string) => {
      const results = await page.evaluate(async () => {
        const img = document.querySelector('.stage img.page') as HTMLImageElement;
        if (!img || !img.complete) return [];

        // Create in-memory canvas to sample page pixels
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1241;
        canvas.height = img.naturalHeight || 1754;
        const ctx = canvas.getContext('2d');
        if (!ctx) return [];
        ctx.drawImage(img, 0, 0);

        const svgRects = Array.from(document.querySelectorAll('.stage svg.overlay g rect'));
        return svgRects.map((r) => {
          const x = Math.round(parseFloat(r.getAttribute('x') || '0'));
          const y = Math.round(parseFloat(r.getAttribute('y') || '0'));
          const w = Math.round(parseFloat(r.getAttribute('width') || '0'));
          const h = Math.round(parseFloat(r.getAttribute('height') || '0'));

          if (w <= 0 || h <= 0) return { x, y, w, h, pctDark: 0 };

          const imgData = ctx.getImageData(x, y, w, h);
          const data = imgData.data;
          let darkCount = 0;
          const total = w * h;

          for (let i = 0; i < data.length; i += 4) {
            // Luminance formula
            const grey = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            if (grey < 200) {
              darkCount++;
            }
          }

          return {
            x, y, w, h,
            pctDark: (darkCount / total) * 100
          };
        });
      });

      expect(results.length).toBeGreaterThanOrEqual(4);
      for (const res of results) {
        expect(
          res.pctDark,
          `At ${zoomLabel}, region (${res.x}, ${res.y}, ${res.w}x${res.h}) has only ${res.pctDark.toFixed(1)}% dark pixels (< 3% threshold)`
        ).toBeGreaterThanOrEqual(3.0);
      }
    };

    // 1. Verify at Zoom 100%
    await verifyRectDarkPixels('100% Zoom');

    // 2. Zoom to 200% via Zoom In button
    const zoomInBtn = page.locator('button[title="Zoom In (+)"]');
    for (let i = 0; i < 4; i++) {
      await zoomInBtn.click();
      await page.waitForTimeout(100);
    }

    // Verify at Zoom 200%
    await verifyRectDarkPixels('200% Zoom');
  });
});
