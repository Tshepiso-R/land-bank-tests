import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';

type TestFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  authenticatedPage: HomePage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(
      process.env.CRM_USERNAME || 'promise',
      process.env.CRM_PASSWORD || '123qwe',
    );
    const homePage = new HomePage(page);
    await homePage.waitForDashboard();
    await use(homePage);
  },
});

export { expect };
