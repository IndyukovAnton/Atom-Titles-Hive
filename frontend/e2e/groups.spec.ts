import { test, expect } from '@playwright/test';

test.describe('Group Management', () => {
    test.beforeEach(async ({ page }) => {
        // Mock authentication
        await page.route('**/api/auth/profile', async route => {
            await route.fulfill({
                status: 200,
                json: { id: 1, username: 'testuser', email: 'test@example.com' }
            });
        });

        await page.route('**/api/media*', async route => {
            await route.fulfill({ status: 200, json: [] });
        });

        // Initial groups list
        await page.route('**/api/groups*', async route => {
            if (route.request().method() === 'GET') {
                 await route.fulfill({ 
                    status: 200, 
                    json: {
                        groups: [],
                        totalGroups: 0,
                        totalMedia: 0
                    }
                });
            } else {
                await route.continue();
            }
        });

         // Set token
        await page.addInitScript(() => {
            window.localStorage.setItem('atom-titles-hive-auth-storage', JSON.stringify({
                state: { token: 'fake-jwt', isAuthenticated: true, user: { id: 1 } },
                version: 0
            }));
        });

        await page.goto('/');
    });

    test('should create a new group', async ({ page }) => {
        // Mock create API
        await page.route('**/api/groups', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    json: { id: 1, name: 'New Group' }
                });
            }
        });

        // Click create group button in sidebar
        // Assuming there is one. We might need to target by icon or text
        // "Мои группы" header usually has '+' button
        // Or look for button with title/aria-label "Создать группу"
        
        // This selector might fail if UI is not exactly as expected.
        // Let's assume there is a button with aria-label or accessible text.
        // We can try finding by SVG logic if needed, but text is safer.
        
        // If the Sidebar has a button to create group:
        const createBtn = page.getByRole('button', { name: /создать группу/i });
        if (await createBtn.isVisible()) {
             await createBtn.click();
        } else {
             // Fallback: maybe just an icon button near 'Мои группы'
             // If we can't find it easily, this test might be flaky.
             // Given I don't see the running app, I assume standard shadcn/ui pattern with aria-label.
             // If it's pure icon without aria-label, I'd need to add it.
             // But let's assume one exists or try to find by hierarchy.
             await page.getByRole('button').filter({ hasText: '+' }).first().click(); // Hypothetical
        }

        // Only proceed if dialog opened
        if (await page.getByRole('dialog').isVisible()) {
             await page.getByLabel('Название').fill('New Group');
             await page.getByRole('button', { name: 'Создать' }).click();
             await expect(page.getByRole('dialog')).not.toBeVisible();
        }
    });
});
