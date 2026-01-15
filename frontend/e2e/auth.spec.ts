import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow user to register', async ({ page }) => {
    // Mock register API
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 201,
        json: { 
            access_token: 'fake-jwt',
            user: { id: 1, username: 'newuser', email: 'new@example.com' }
        }
      });
    });

    // Mock profile get after login (auto-login after register)
    await page.route('**/api/auth/profile', async route => {
      await route.fulfill({
        status: 200,
        json: { id: 1, username: 'newuser', email: 'new@example.com' }
      });
    });

     // Mock data queries on home page
    await page.route('**/api/media*', async route => {
      await route.fulfill({ status: 200, json: [] });
    });
    await page.route('**/api/groups*', async route => {
       await route.fulfill({ status: 200, json: [] });
    });


    await page.goto('/register');

    await page.getByLabel('Имя пользователя').fill('newuser');
    await page.getByLabel('Email').fill('new@example.com');
    await page.getByLabel('Пароль').fill('Password123');
    await page.getByLabel('Подтвердите пароль').fill('Password123');
    
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();

    // Should redirect to home
    await expect(page).toHaveURL('/');
  });

  test('should allow user to login', async ({ page }) => {
    // Mock login API
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        json: { 
            access_token: 'fake-jwt',
            user: { id: 1, username: 'testuser', email: 'test@example.com' }
        }
      });
    });

    // Mock profile
    await page.route('**/api/auth/profile', async route => {
      await route.fulfill({
        status: 200,
        json: { id: 1, username: 'testuser', email: 'test@example.com' }
      });
    });

    // Mock data
    await page.route('**/api/media*', async route => {
      await route.fulfill({ status: 200, json: [] });
    });
    await page.route('**/api/groups*', async route => {
       await route.fulfill({ status: 200, json: [] });
    });

    await page.goto('/login');

    await page.getByLabel('Имя пользователя').fill('testuser');
    await page.getByLabel('Пароль').fill('password');
    
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page).toHaveURL('/');
  });
});
