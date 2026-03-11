class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigate(path = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  async waitForAppInitialization() {
    // The Shesha app shows "Initializing..." on load - wait for it to disappear
    const initializingText = this.page.getByText('Initializing...');
    try {
      await initializingText.waitFor({ state: 'visible', timeout: 5000 });
      await initializingText.waitFor({ state: 'hidden', timeout: 60000 });
    } catch {
      // If "Initializing..." never appeared, the app may have loaded fast
    }
  }

  async getTitle() {
    return await this.page.title();
  }

  async waitForElement(selector) {
    await this.page.waitForSelector(selector);
  }

  async click(locator) {
    await locator.click();
  }

  async fill(locator, text) {
    await locator.fill(text);
  }

  async getText(locator) {
    return await locator.textContent();
  }

  async isVisible(locator) {
    return await locator.isVisible();
  }
}

module.exports = { BasePage };
