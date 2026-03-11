import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string = '/'): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  async waitForAppInitialization(): Promise<void> {
    const initializingText = this.page.getByText('Initializing...');
    try {
      await initializingText.waitFor({ state: 'visible', timeout: 5000 });
      await initializingText.waitFor({ state: 'hidden', timeout: 60000 });
    } catch {
      // App may have loaded fast
    }
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }
}
