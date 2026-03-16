// Shared login helper — all specs use this for authentication.
import { Page } from '@playwright/test';

export async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  // The app may show "Initializing..." for a long time — reload once if Sign In doesn't appear
  const signInBtn = page.getByRole('button', { name: 'Sign In' });
  const appeared = await signInBtn.waitFor({ state: 'visible', timeout: 60000 }).then(() => true).catch(() => false);
  if (!appeared) {
    await page.reload();
    await signInBtn.waitFor({ state: 'visible', timeout: 60000 });
  }
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('heading', { name: 'My Dashboard' }).waitFor({ state: 'visible', timeout: 60000 });
}

