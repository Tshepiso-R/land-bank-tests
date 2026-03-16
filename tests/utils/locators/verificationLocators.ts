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
    await this.awaitingReviewButton.first().click();
    await expect(this.overviewTab).toBeVisible({ timeout: 30000 });
  }

  async closeVerificationDialog(): Promise<void> {
    // Use Escape key to close — the X button can be intercepted by scrolled content
    await this.page.keyboard.press('Escape');
    await expect(this.page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
  }

  // --- Review / Approval helpers ---

  /** Approve ID Verification: select "Approve" from Review Decision dropdown and click Submit */
  async approveIdVerification(): Promise<void> {
    const dialog = this.page.getByRole('dialog');
    await this.idVerificationTab.click();
    await expect(dialog.getByText('ID Verification Details')).toBeVisible({ timeout: 5000 });

    // Scroll to bottom of dialog to reveal Review Decision dropdown
    const modalBody = dialog.locator('.ant-modal-body');
    await modalBody.evaluate(el => el.scrollTo(0, el.scrollHeight));

    // Select "Approve" from Review Decision dropdown — scope to ID Verification label
    const reviewDecisionDropdown = dialog.locator('.ant-form-item').filter({ hasText: /Id Verification Review Decision|Review Decision/ }).locator('.ant-select').first();
    await reviewDecisionDropdown.scrollIntoViewIfNeeded();
    // Check if "Approve" is already selected
    const alreadyApproved = await reviewDecisionDropdown.getByTitle('Approve').isVisible().catch(() => false);
    if (!alreadyApproved) {
      await reviewDecisionDropdown.click();
      const dropdownPopup = this.page.locator('.ant-select-dropdown:visible');
      const approveOption = dropdownPopup.locator('.ant-select-item-option').filter({ hasText: 'Approve' }).first();
      await expect(approveOption).toBeVisible({ timeout: 5000 });
      await approveOption.click();
    } else {
      console.log('ID Verification: Already approved — skipping dropdown selection');
    }

    // Click Submit
    const submitButton = dialog.getByRole('button', { name: 'Submit' });
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click();

    // Wait for success indication (toast or status change)
    await this.page.waitForLoadState('networkidle');
    console.log('ID Verification: Approved');
  }

  /** Approve KYC Verification: select "Approve" from First Name Review Decision dropdown */
  async approveKycVerification(): Promise<void> {
    const dialog = this.page.getByRole('dialog');
    await this.kycVerificationTab.click();
    await expect(dialog.getByText('KYC Verification Details')).toBeVisible({ timeout: 5000 });

    // Scroll all scrollable ancestors of the Review Decision section to reveal the dropdown
    await dialog.evaluate((dlg) => {
      const el = Array.from(dlg.querySelectorAll('*')).find(e => e.textContent?.includes('Review Decision') && e.querySelector('.ant-select'));
      if (el) {
        let parent = el.parentElement;
        while (parent && parent !== dlg) {
          if (parent.scrollHeight > parent.clientHeight) {
            parent.scrollTop = parent.scrollHeight;
          }
          parent = parent.parentElement;
        }
        el.scrollIntoView({ block: 'center' });
      }
    });

    // Click the KYC Review Decision dropdown — scope to the specific KYC label to avoid matching hidden ID tab's dropdown
    const reviewDecisionDropdown = dialog.locator('.ant-form-item').filter({ hasText: /Kyc Verification First Name/ }).locator('.ant-select').first();
    await expect(reviewDecisionDropdown).toBeVisible({ timeout: 5000 });

    // Check if "Approve" is already selected
    const alreadyApproved = await reviewDecisionDropdown.getByTitle('Approve').isVisible().catch(() => false);
    if (!alreadyApproved) {
      await reviewDecisionDropdown.click();
      const dropdownPopup = this.page.locator('.ant-select-dropdown:visible');
      const approveOption = dropdownPopup.locator('.ant-select-item-option').filter({ hasText: 'Approve' }).first();
      await expect(approveOption).toBeVisible({ timeout: 5000 });
      await approveOption.click();
    } else {
      console.log('KYC Verification: Already approved — skipping dropdown selection');
    }

    await this.page.waitForLoadState('networkidle');
    console.log('KYC Verification: Approved');
  }

  /** Approve Compliance if tab is present */
  async approveComplianceIfPresent(): Promise<void> {
    const compTabVisible = await this.complianceTab.isVisible().catch(() => false);
    if (!compTabVisible) {
      console.log('Compliance tab not present — skipping approval');
      return;
    }

    const dialog = this.page.getByRole('dialog');
    await this.complianceTab.click();
    await expect(dialog.getByText('Compliance Verification Details')).toBeVisible({ timeout: 5000 });

    // Scroll to bottom of dialog to reveal Review Decision dropdowns
    const modalBody = dialog.locator('.ant-modal-body');
    await modalBody.evaluate(el => el.scrollTo(0, el.scrollHeight));

    // Look for visible review decision dropdowns on Compliance tab and approve them
    // Use the active tab pane to avoid matching hidden dropdowns from other tabs
    const activePane = dialog.locator('.ant-tabs-tabpane-active').first();
    const reviewDropdowns = activePane.locator('.ant-form-item').filter({ hasText: /Review Decision/ }).locator('.ant-select');
    const count = await reviewDropdowns.count();
    for (let i = 0; i < count; i++) {
      const dropdown = reviewDropdowns.nth(i);
      await dropdown.scrollIntoViewIfNeeded();
      // Skip if already approved
      const alreadyApproved = await dropdown.getByTitle('Approve').isVisible().catch(() => false);
      if (alreadyApproved) continue;
      await dropdown.click();
      const dropdownPopup = this.page.locator('.ant-select-dropdown:visible');
      const approveOption = dropdownPopup.locator('.ant-select-item-option').filter({ hasText: 'Approve' }).first();
      if (await approveOption.isVisible().catch(() => false)) {
        await approveOption.click();
      }
    }

    await this.page.waitForLoadState('networkidle');
    console.log('Compliance: Approved');
  }

  /** Finalise verification outcomes — clicks the button and waits for status change */
  async finaliseVerification(): Promise<void> {
    await this.finaliseVerificationButton.click();
    // The page auto-navigates to the next workflow step — caller should wait for the new heading
  }

  // --- Read-only field value helpers ---

  fieldValue(label: string): Locator {
    return this.page.getByText(label).locator('..').locator('..').last();
  }

  dialogFieldValue(label: string): Locator {
    return this.page.getByRole('dialog').getByText(label).locator('..').locator('..').last();
  }
}
