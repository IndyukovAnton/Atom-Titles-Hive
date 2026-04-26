import { test, expect } from '@playwright/test';

test.describe('Media Management', () => {
    test.beforeEach(async ({ page }) => {
        // Mock authentication
        await page.route('**/api/auth/profile', async route => {
            await route.fulfill({
                status: 200,
                json: { id: 1, username: 'testuser', email: 'test@example.com' }
            });
        });

        // Initial media list (empty)
        await page.route('**/api/media*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, json: [] });
            } else {
                await route.continue();
            }
        });
        
        await page.route('**/api/groups*', async route => {
           await route.fulfill({ status: 200, json: [] });
        });

        // Set token in localStorage directly
        await page.addInitScript(() => {
            window.localStorage.setItem('seen-auth-storage', JSON.stringify({
                state: { token: 'fake-jwt', isAuthenticated: true, user: { id: 1 } },
                version: 0
            }));
        });

        await page.goto('/');
    });

    test('should create new media entry', async ({ page }) => {
        // Mock create API
        await page.route('**/api/media', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    json: { id: 1, title: 'New Movie', rating: 9, category: 'Movie' }
                });
            }
        });

        // Click Add button (assuming it's in the header or visible)
        // If not found, look for button with label or icon
        // Usually HomeHeader has a button.
        await page.getByRole('button', { name: /добавить/i }).first().click();

        await expect(page.getByRole('dialog')).toBeVisible();

        await page.getByLabel('Название').fill('New Movie');
        await page.getByLabel('Оценка').fill('9');
        
        await page.getByRole('button', { name: 'Сохранить' }).click();

        await expect(page.getByRole('dialog')).not.toBeVisible();
        
        // Should refresh list (which depends on GET /media mock being updated or handled)
        // Verifying the call happened is enough for mock test usually, or we update the mock for GET
    });
});
