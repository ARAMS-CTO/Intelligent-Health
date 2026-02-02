
import { test, expect } from '@playwright/test';

test('Pediatrics Dashboard Integration', async ({ page }) => {
    // 1. Mock API Responses
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.route('**/api/auth/config', async route => {
        await route.fulfill({ json: { googleClientId: 'mock-id' } });
    });

    await page.route('**/api/auth/login', async route => {
        await route.fulfill({
            json: {
                access_token: 'mock-token',
                token_type: 'bearer',
                user: {
                    id: 'test-user-1',
                    email: 'parent@example.com',
                    name: 'Parent User',
                    role: 'Patient',
                    patientProfileId: 'profile-1'
                }
            }
        });
    });

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

    // Mock Agent Service for Pediatrics
    await page.route('**/api/ai/specialist_consult', async route => {
        await route.fulfill({
            json: {
                message: "I can help with your child's fever.",
                actions: []
            }
        });
    });

    // Mock Family Members
    await page.route('**/api/family/members', async route => {
        await route.fulfill({
            json: [
                { id: 'child-1', name: 'Alice', role: 'CHILD', dob: '2020-01-01', gender: 'Female' },
                { id: 'parent-1', name: 'Parent', role: 'GUARDIAN' }
            ]
        });
    });

    // 2. Set Auth Token & Navigate Directly
    await page.addInitScript(() => {
        window.localStorage.setItem('token', 'mock-token');
    });

    await page.goto('http://localhost:3000/pediatrics');

    // Wait for app to initialize checks
    await page.waitForLoadState('domcontentloaded');



    // 5. Verify Pediatrics Dashboard Elements
    // Wait for the heading directly, which handles the loading state automatically
    console.log('Waiting for Pediatrics heading...');
    await expect(page.getByRole('heading', { name: /Pediatrics/i })).toBeVisible({ timeout: 30000 });

    // Check for the specific component tabs
    await expect(page.getByText('Vaccine', { exact: false })).toBeVisible();

    // Test Tab Switching
    await page.getByText('Symptom Reporter').click();
    await expect(page.getByText('Report Symptoms')).toBeVisible();

    await page.getByText('Growth Tracker').click();
    await expect(page.getByText('Growth Charts')).toBeVisible();

});
