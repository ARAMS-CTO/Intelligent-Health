import { test, expect } from '@playwright/test';

test('Documentation Pages Load', async ({ page }) => {
    // 1. Mock critical APIs to avoid loading issues if triggered
    await page.route('**/api/auth/config', async route => {
        await route.fulfill({ json: { googleClientId: 'mock-id' } });
    });

    // 2. Test Help Page
    await page.goto('http://localhost:3000/help');
    await expect(page.getByRole('heading', { name: 'How can we help you?' })).toBeVisible();

    // Test Tab Switching
    await page.getByText('doctor Guide').click();
    await expect(page.getByText('Clinical Decision Support')).toBeVisible();

    // 3. Test Roadmap Page
    await page.goto('http://localhost:3000/roadmap');
    await expect(page.getByRole('heading', { name: 'Product Roadmap' })).toBeVisible();
    await expect(page.getByText('Vision 2026')).toBeVisible();

    // Check Q1 content
    await expect(page.getByText('Launch Pediatrics Dashboard')).toBeVisible();
});
