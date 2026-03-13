import { Page, Locator, expect } from '@playwright/test';

export class VerificationLocators {
  readonly page: Page;

  // Sidebar
  readonly inboxLink: Locator;

  // Inbox table
  readonly inboxHeading: Locator;
  readonly inboxSearchInput: Locator;
  readonly inboxSearchButton: Locator;
  readonly inboxTable: Locator;

  // Inbox item detail — header
  readonly confirmVerificationHeading: Locator;

  // Loan application sub-tabs (inside inbox item)
  readonly clientInfoTab: Locator;
  readonly loanInfoTab: Locator;
  readonly farmsTab: Locator;

  // Individual Verifications section
  readonly awaitingReviewButton: Locator;

  // Action buttons
  readonly finaliseVerificationButton: Locator;
  readonly flagHighRiskButton: Locator;

  // Verification dialog tabs
  readonly overviewTab: Locator;
  readonly idVerificationTab: Locator;
  readonly kycVerificationTab: Locator;
  readonly complianceTab: Locator;
  readonly closeDialogButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sidebar
    this.inboxLink = page.getByRole('link', { name: 'Inbox' });

    // Inbox table
    this.inboxHeading = page.getByRole('heading', { name: 'Incoming Items' });
    this.inboxSearchInput = page.locator('.ant-input-group').getByRole('textbox');
    this.inboxSearchButton = page.getByRole('button', { name: 'search' }).first();
    this.inboxTable = page.getByRole('table');

    // Inbox item detail
    this.confirmVerificationHeading = page.getByRole('heading', { name: /Confirm verification outcomes/ });

    // Loan application sub-tabs
    this.clientInfoTab = page.getByRole('tab', { name: 'Client Info' });
    this.loanInfoTab = page.getByRole('tab', { name: 'Loan Info' });
    this.farmsTab = page.getByRole('tab', { name: 'Farms' });

    // Individual Verifications
    this.awaitingReviewButton = page.getByRole('button', { name: 'Awaiting Review' });

    // Action buttons
    this.finaliseVerificationButton = page.getByRole('button', { name: 'Finalise Verification Outcomes' });
    this.flagHighRiskButton = page.getByRole('button', { name: 'Flag As High Risk' });

    // Verification dialog tabs
    this.overviewTab = page.getByRole('tab', { name: 'Overview' });
    this.idVerificationTab = page.getByRole('tab', { name: 'ID Verification' });
    this.kycVerificationTab = page.getByRole('tab', { name: 'KYC Verification' });
    this.complianceTab = page.getByRole('tab', { name: 'Compliance' });
    this.closeDialogButton = page.getByRole('dialog').getByLabel('Close', { exact: true });
  }

  // --- Navigation ---

  async navigateToInbox(): Promise<void> {
    // Navigate directly via URL (sidebar may not have Inbox link for all roles)
    await this.page.goto('/dynamic/Shesha.Workflow/workflows-inbox');
    await expect(this.inboxHeading).toBeVisible({ timeout: 60000 });
  }

  async searchByRefNo(refNo: string): Promise<void> {
    await this.inboxSearchInput.fill(refNo);
    await this.inboxSearchButton.click();
    // Wait for table to filter
    await expect(this.page.getByText(`1-1 of 1 items`)).toBeVisible({ timeout: 30000 });
  }

  getInboxRowByRefNo(refNo: string): Locator {
    return this.page.getByRole('row').filter({ hasText: refNo });
  }

  async openInboxItem(refNo: string): Promise<void> {
    const row = this.getInboxRowByRefNo(refNo);
    const detailLink = row.getByRole('link', { name: 'search' });
    await detailLink.click();
    await expect(this.confirmVerificationHeading).toBeVisible({ timeout: 60000 });
  }

  // --- Verification dialog helpers ---

  async openVerificationDialog(): Promise<void> {
    await this.awaitingReviewButton.click();
    await expect(this.overviewTab).toBeVisible({ timeout: 30000 });
  }

  async closeVerificationDialog(): Promise<void> {
    // Use Escape key to close — the X button can be intercepted by scrolled content
    await this.page.keyboard.press('Escape');
    await expect(this.page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
  }

  // --- Read-only field value helpers ---

  fieldValue(label: string): Locator {
    return this.page.getByText(label).locator('..').locator('..').last();
  }

  dialogFieldValue(label: string): Locator {
    return this.page.getByRole('dialog').getByText(label).locator('..').locator('..').last();
  }
}
