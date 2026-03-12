import { test, expect } from '../fixtures/fixtures';
import * as allure from 'allure-js-commons';
import users from '../test-data/users.json';

test.describe('Login Page', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('should display all login form elements', async ({ loginPage }) => {
    await allure.allureId('001');
    await expect(loginPage.logo).toBeVisible();
    await expect(loginPage.welcomeHeading).toHaveText('Welcome!');
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeEnabled();
    await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('should mask password by default and toggle visibility', async ({ loginPage }) => {
    await allure.allureId('002');
    await loginPage.passwordInput.fill('testpassword');
    expect(await loginPage.isPasswordMasked()).toBe(true);

    await loginPage.togglePasswordVisibility();
    expect(await loginPage.isPasswordMasked()).toBe(false);

    await loginPage.togglePasswordVisibility();
    expect(await loginPage.isPasswordMasked()).toBe(true);
  });

  test('should toggle Remember Me checkbox', async ({ loginPage }) => {
    await allure.allureId('003');
    await loginPage.checkRememberMe();
    await expect(loginPage.rememberMeCheckbox).toBeChecked();
    await loginPage.uncheckRememberMe();
    await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
  });

  test('should show error when submitting empty form', async ({ loginPage }) => {
    await allure.allureId('004');
    await loginPage.signInButton.click();
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    await allure.allureId('005');
    await loginPage.login(users.invalidUser.username, users.invalidUser.password);
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should show error for valid username with wrong password', async ({ loginPage }) => {
    await allure.allureId('006');
    await loginPage.login(users.validUser.username, 'wrongpassword');
    await expect(loginPage.errorMessage).toBeVisible();
  });

  test('should login successfully and redirect to dashboard', async ({ loginPage, page }) => {
    await allure.allureId('007');
    await loginPage.login(users.validUser.username, users.validUser.password);
    await page.waitForURL('**/dynamic/user-dashboard', { timeout: 60000 });
    await expect(page).toHaveURL(/\/dynamic\/user-dashboard/);
    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Promise Raganya')).toBeVisible();
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await allure.allureId('008');
    await page.goto('/dynamic/user-dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/login/, { timeout: 60000 });
  });
});
