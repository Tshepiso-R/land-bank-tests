const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators
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

  async navigate() {
    await super.navigate('/login');
    await this.waitForAppInitialization();
    await this.signInButton.waitFor({ state: 'visible', timeout: 30000 });
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async togglePasswordVisibility() {
    const eyeInvisible = this.passwordToggleHidden;
    const eyeVisible = this.passwordToggleVisible;

    if (await eyeInvisible.isVisible()) {
      await eyeInvisible.click();
    } else if (await eyeVisible.isVisible()) {
      await eyeVisible.click();
    }
  }

  async isPasswordMasked() {
    const type = await this.passwordInput.getAttribute('type');
    return type === 'password';
  }

  async checkRememberMe() {
    await this.rememberMeCheckbox.check();
  }

  async uncheckRememberMe() {
    await this.rememberMeCheckbox.uncheck();
  }
}

module.exports = { LoginPage };
