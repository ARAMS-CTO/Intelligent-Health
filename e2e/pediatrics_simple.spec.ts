import { test, expect } from '@playwright/test';

test('Pediatrics Simple Load', async ({ page }) => {
    // Set Auth Token
    await page.addInitScript(() => {
        window.localStorage.setItem('token', 'mock-token');
    });

    // Mock Config
    await page.route('**/api/auth/config', async route => {
        await route.fulfill({ json: { googleClientId: 'mock-id' } });
    });

    // Mock Me
    await page.route('**/api/auth/me', async route => {
        await route.fulfill({
            json: {
                id: 'test-user-1',
                email: 'parent@example.com',
                name: 'Parent User',
                role: 'Patient',
                patientProfileId: 'profile-1'
            }
        });
    });

    // Navigate
    console.log('Navigating to /pediatrics...');
    await page.goto('http://localhost:3000/pediatrics');

    // Check for ANY content to verify routing worked
    await expect(page.locator('body')).toBeVisible();

    // Check for the specific heading
    console.log('Waiting for heading...');
    await expect(page.getByRole('heading', { name: /Pediatrics/i })).toBeVisible({ timeout: 10000 });
});
