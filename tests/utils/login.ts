import { Page } from '@playwright/test';

export async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign In' }).waitFor({ state: 'visible', timeout: 60000 });
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('heading', { name: 'My Dashboard' }).waitFor({ state: 'visible', timeout: 60000 });
}

export async function loginAsDefaultUser(page: Page): Promise<void> {
  const username = process.env.CRM_USERNAME || 'admin';
  const password = process.env.CRM_PASSWORD || '123qwe';
  await login(page, username, password);
}
