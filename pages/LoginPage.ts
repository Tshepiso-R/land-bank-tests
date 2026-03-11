import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly logo: Locator;
  readonly welcomeHeading: Locator;
  readonly welcomeSubtext: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly rememberMeLabel: Locator;
  readonly forgotPasswordLink: Locator;
  readonly passwordToggleHidden: Locator;
  readonly passwordToggleVisible: Locator;
  readonly mailIcon: Locator;
  readonly lockIcon: Locator;
  readonly errorMessage: Locator;
  readonly errorCloseIcon: Locator;

  constructor(page: Page) {
    super(page);

    this.logo = page.locator('img').first();
    this.welcomeHeading = page.locator('strong').filter({ hasText: 'Welcome!' });
    this.welcomeSubtext = page.getByText('Please enter your personal details in order to access your profile.');
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.rememberMeCheckbox = page.getByRole('checkbox');
    this.rememberMeLabel = page.getByText('Remember Me');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forget_Password' });
    this.passwordToggleHidden = page.getByRole('img', { name: 'eye-invisible' });
    this.passwordToggleVisible = page.getByRole('img', { name: 'eye' }).first();
    this.mailIcon = page.getByRole('img', { name: 'mail' });
    this.lockIcon = page.getByRole('img', { name: 'lock' });
    this.errorMessage = page.getByText('Either the username or password you are trying to log in with are incorrect.');
    this.errorCloseIcon = page.getByRole('img', { name: 'close-circle' });
  }

  async navigate(): Promise<void> {
    await super.navigate('/login');
    await this.waitForAppInitialization();
    await this.signInButton.waitFor({ state: 'visible', timeout: 30000 });
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async togglePasswordVisibility(): Promise<void> {
    if (await this.passwordToggleHidden.isVisible()) {
      await this.passwordToggleHidden.click();
    } else if (await this.passwordToggleVisible.isVisible()) {
      await this.passwordToggleVisible.click();
    }
  }

  async isPasswordMasked(): Promise<boolean> {
    const type = await this.passwordInput.getAttribute('type');
    return type === 'password';
  }

  async checkRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.check();
  }

  async uncheckRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.uncheck();
  }
}
