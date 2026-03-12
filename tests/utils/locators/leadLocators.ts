import { Page, Locator, expect } from '@playwright/test';
import { preScreeningPassYes, preScreeningPassNo } from '../testData';

export class LeadLocators {
  readonly page: Page;

  // Sidebar
  readonly sidebarTrigger: Locator;
  readonly leadsLink: Locator;

  // Leads table
  readonly allLeadsHeading: Locator;
  readonly tableHeaderRow: Locator;
  readonly newLeadButton: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  // Add New Lead dialog
  readonly dialog: Locator;
  readonly dialogTitle: Locator;

  // Form fields inside dialog
  readonly titleDropdown: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly mobileInput: Locator;
  readonly emailInput: Locator;
  readonly clientTypeDropdown: Locator;
  readonly provinceDropdown: Locator;
  readonly preferredCommunicationDropdown: Locator;
  readonly leadChannelDropdown: Locator;
  readonly descriptionTextarea: Locator;

  // Dialog buttons
  readonly okButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sidebar
    // Sidebar trigger uses aria-label from Ant Design's icon
    this.sidebarTrigger = page.getByRole('img', { name: /menu-unfold|menu/ }).first();
    this.leadsLink = page.getByRole('link', { name: 'Leads' });

    // Leads table
    this.allLeadsHeading = page.getByRole('heading', { name: 'All Leads' });
    this.tableHeaderRow = page.getByRole('row', { name: 'Date Created Client Type' });
    this.newLeadButton = page.getByRole('button', { name: 'plus New Lead' });
    this.searchInput = page.getByRole('textbox').first();
    this.searchButton = page.getByRole('button', { name: 'search' });

    // Dialog
    this.dialog = page.getByRole('dialog', { name: 'Add New Lead' });
    this.dialogTitle = this.dialog.getByText('Add New Lead');

    // Form fields — Shesha/Ant Design renders labels separately from inputs
    // without proper for/id associations, so getByLabel doesn't work.
    // CSS class selectors (.ant-form-item, .ant-select) are used here as a
    // necessary exception — Ant Design components expose no data-testid, stable
    // id, or ARIA label on these elements.
    this.titleDropdown = this.dialog.locator('.ant-form-item').filter({ hasText: /^Title/ }).locator('.ant-select');
    this.firstNameInput = this.dialog.getByRole('textbox').nth(0);
    this.lastNameInput = this.dialog.getByRole('textbox').nth(1);
    this.mobileInput = this.dialog.getByRole('textbox').nth(2);
    this.emailInput = this.dialog.getByRole('textbox').nth(3);
    this.clientTypeDropdown = this.dialog.locator('.ant-form-item').filter({ hasText: /^Client Type/ }).locator('.ant-select');
    this.provinceDropdown = this.dialog.locator('.ant-form-item').filter({ hasText: /^Province/ }).locator('.ant-select');
    this.preferredCommunicationDropdown = this.dialog.locator('.ant-form-item').filter({ hasText: /^Preferred/ }).locator('.ant-select');
    this.leadChannelDropdown = this.dialog.locator('.ant-form-item').filter({ hasText: /^Lead Channel/ }).locator('.ant-select');
    this.descriptionTextarea = this.dialog.locator('textarea');

    // Dialog buttons
    this.okButton = this.dialog.getByRole('button', { name: 'OK' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  // --- Helper methods ---

  async navigateToLeads(): Promise<void> {
    await this.sidebarTrigger.click();
    await this.page.getByRole('img', { name: 'menu-fold' }).waitFor({ state: 'visible', timeout: 10000 });
    await this.leadsLink.click();
    await this.tableHeaderRow.waitFor({ state: 'visible', timeout: 60000 });
  }

  async openNewLeadDialog(): Promise<void> {
    await this.newLeadButton.click();
    await expect(this.dialog).toBeVisible({ timeout: 30000 });
  }

  async selectTitle(title: string): Promise<void> {
    await this.titleDropdown.click();
    const option = this.page.getByRole('option', { name: title }).or(
      this.page.getByText(title, { exact: true }).last()
    );
    await expect(option.first()).toBeVisible({ timeout: 10000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 5000 }).catch(() => {});
  }

  async selectClientType(clientType: string): Promise<void> {
    await this.clientTypeDropdown.click();
    const option = this.page.getByTitle(clientType);
    await expect(option.first()).toBeVisible({ timeout: 10000 });
    await option.first().click();
    // Wait for the dropdown to close before interacting with the next field
    await expect(option.first()).toBeHidden({ timeout: 5000 }).catch(() => {});
  }

  async selectProvince(province: string): Promise<void> {
    await this.provinceDropdown.click();
    const option = this.page.getByRole('option', { name: province }).or(
      this.page.getByTitle(province)
    );
    await expect(option.first()).toBeVisible({ timeout: 10000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 5000 }).catch(() => {});
  }

  async selectPreferredCommunication(comm: string): Promise<void> {
    await this.preferredCommunicationDropdown.click();
    const option = this.page.getByTitle(comm, { exact: true });
    await expect(option.first()).toBeVisible({ timeout: 10000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 5000 }).catch(() => {});
  }

  async selectLeadChannel(channel: string): Promise<void> {
    await this.leadChannelDropdown.click();
    const option = this.page.getByTitle(channel, { exact: true });
    await expect(option.first()).toBeVisible({ timeout: 10000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 5000 }).catch(() => {});
  }

  async fillAllFields(data: {
    title?: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
    clientType: string;
    province: string;
    preferredCommunication?: string;
    leadChannel: string;
    description?: string;
  }): Promise<void> {
    if (data.title) {
      await this.selectTitle(data.title);
    }
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.mobileInput.fill(data.mobile);
    await this.emailInput.fill(data.email);
    await this.selectClientType(data.clientType);
    await this.selectProvince(data.province);
    if (data.preferredCommunication) {
      await this.selectPreferredCommunication(data.preferredCommunication);
    }
    await this.selectLeadChannel(data.leadChannel);
    if (data.description) {
      await this.descriptionTextarea.fill(data.description);
    }
  }

  async fillAllFieldsExcept(
    data: {
      title?: string;
      firstName: string;
      lastName: string;
      mobile: string;
      email: string;
      clientType: string;
      province: string;
      preferredCommunication?: string;
      leadChannel: string;
      description?: string;
    },
    skipField: string,
  ): Promise<void> {
    if (data.title && skipField !== 'title') {
      await this.selectTitle(data.title);
    }
    if (skipField !== 'firstName') await this.firstNameInput.fill(data.firstName);
    if (skipField !== 'lastName') await this.lastNameInput.fill(data.lastName);
    if (skipField !== 'mobile') await this.mobileInput.fill(data.mobile);
    if (skipField !== 'email') await this.emailInput.fill(data.email);
    if (skipField !== 'clientType') await this.selectClientType(data.clientType);
    if (skipField !== 'province') await this.selectProvince(data.province);
    if (data.preferredCommunication && skipField !== 'preferredCommunication') {
      await this.selectPreferredCommunication(data.preferredCommunication);
    }
    if (skipField !== 'leadChannel') await this.selectLeadChannel(data.leadChannel);
    if (data.description && skipField !== 'description') {
      await this.descriptionTextarea.fill(data.description);
    }
  }

  async submitForm(): Promise<void> {
    await this.okButton.click();
  }

  async cancelForm(): Promise<void> {
    await this.cancelButton.click();
  }

  getLeadRowByName(firstName: string, lastName: string): Locator {
    return this.page.getByRole('row').filter({ hasText: firstName }).filter({ hasText: lastName });
  }

  /** Check if the dialog has any fields with validation error state */
  async hasValidationErrors(): Promise<boolean> {
    const errorFields = this.dialog.locator('[aria-invalid="true"]');
    const count = await errorFields.count();
    return count > 0;
  }

  async getToastMessage(): Promise<string> {
    const toast = this.page.locator('[role="alert"]');
    await expect(toast.first()).toBeVisible({ timeout: 15000 });
    return await toast.first().textContent() || '';
  }

  // --- Detail Page helpers ---

  async openLeadDetails(firstName: string, lastName: string): Promise<void> {
    const row = this.getLeadRowByName(firstName, lastName);
    const detailLink = row.locator('a[href*="LBLead-details"]');
    await detailLink.click();
    await this.page.waitForURL(/LBLead-details/, { timeout: 60000 });
    await expect(this.page.getByText('Lead', { exact: true }).first()).toBeVisible({ timeout: 60000 });
  }

  // --- Detail Page locators ---

  get editButton(): Locator {
    return this.page.getByRole('button', { name: /edit Edit/i });
  }

  get disqualifyButton(): Locator {
    return this.page.getByRole('button', { name: /Disqualify/i });
  }

  get auditLogButton(): Locator {
    return this.page.getByRole('button', { name: /Audit Log/i });
  }

  get initiatePreScreeningButton(): Locator {
    return this.page.getByRole('button', { name: /Initiate Pre-Screening/i });
  }

  get detailsTab(): Locator {
    return this.page.getByRole('tab', { name: 'Details' });
  }

  get tasksTab(): Locator {
    return this.page.getByRole('tab', { name: 'Tasks' });
  }

  get notesTab(): Locator {
    return this.page.getByRole('tab', { name: 'Notes' });
  }

  // --- Pre-Screening Questionnaire ---

  get preScreeningDialog(): Locator {
    return this.page.getByText('Pre-Screening Questionnaire').locator('..');
  }

  get preScreeningQuestionnaireHeading(): Locator {
    return this.page.getByText('Pre-Screening Questionnaire');
  }

  /**
   * Answer all pre-screening questions to pass.
   * For passing: Yes to all positive questions, No to blacklisted & debt review.
   */
  async completePreScreeningToPass(): Promise<void> {
    await this.initiatePreScreeningButton.click();
    await expect(this.preScreeningQuestionnaireHeading).toBeVisible({ timeout: 30000 });

    for (const question of preScreeningPassYes) {
      const questionRow = this.page.getByText(question).locator('..');
      await questionRow.getByRole('radio', { name: 'Yes' }).click();
    }

    for (const question of preScreeningPassNo) {
      const questionRow = this.page.getByText(question).locator('..');
      await questionRow.getByRole('radio', { name: 'No' }).click();
    }

    // Submit the questionnaire — look for a Submit/OK button
    const submitBtn = this.page.getByRole('button', { name: /Submit|OK|Save/i });
    await submitBtn.click();

    // Wait for conversion
    await expect(this.statusConverted).toBeVisible({ timeout: 60000 });
  }

  // --- Detail Page header locators ---

  get detailHeading(): Locator {
    return this.page.getByText('Lead', { exact: true }).first();
  }

  get statusNew(): Locator {
    return this.page.getByText('NEW');
  }

  get statusConverted(): Locator {
    return this.page.getByText('Converted', { exact: true }).first();
  }

  get assessmentPassed(): Locator {
    return this.page.getByText('Passed', { exact: true }).first();
  }

  get assessmentFailed(): Locator {
    return this.page.getByText('Failed', { exact: true });
  }

  detailHeadingName(lastName: string, firstName: string): Locator {
    return this.page.getByText(`${lastName}, ${firstName}`);
  }

  // --- Detail Page field locators ---

  detailFieldValue(text: string): Locator {
    return this.page.getByText(text).first();
  }

  get fieldLabelFirstName(): Locator {
    return this.page.getByText('First Name');
  }

  get fieldLabelLastName(): Locator {
    return this.page.getByText('Last Name');
  }

  get fieldLabelMobileNumber(): Locator {
    return this.page.getByText('Mobile Number');
  }

  get fieldLabelEmailAddress(): Locator {
    return this.page.getByText('Email Address');
  }

  get fieldLabelClientType(): Locator {
    return this.page.getByText('Client Type');
  }

  get fieldLabelLeadChannel(): Locator {
    return this.page.getByText('Lead Channel');
  }

  get fieldLabelDescription(): Locator {
    return this.page.getByText('Description');
  }

  get fieldLabelRejectionReason(): Locator {
    return this.page.getByText('Rejection Reason');
  }

  // --- Converted To section ---
  // Shesha renders "Converted To Opportunity/Account" labels with a nested
  // button > link structure. The label text (e.g. "Converted To Opportunity :")
  // is in a sibling element, so we locate via the form-item that contains both.

  get convertedToHeading(): Locator {
    return this.page.getByText('Converted To', { exact: true });
  }

  get convertedToOpportunityLink(): Locator {
    return this.page.locator('a[href*="LBOpportunity-details"]');
  }

  get convertedToAccountLink(): Locator {
    return this.page.locator('a[href*="LBAccount-details"]');
  }

  // --- Filter panel ---

  async openFilterPanel(): Promise<void> {
    await this.page.locator('[aria-label="filter"]').click();
    await expect(this.page.getByText('Filter by')).toBeVisible({ timeout: 30000 });
  }

  async filterByFirstName(firstName: string): Promise<void> {
    await this.openFilterPanel();

    // Click the "Filter by" dropdown — it's the combobox/select near "Filter by" text
    const filterSelect = this.page.getByText('Filter by').locator('..').locator('.ant-select');
    await filterSelect.click();

    // Select "First Name" from the dropdown options (scoped to avoid matching column header)
    await this.page.getByRole('option', { name: 'First Name' }).or(
      this.page.locator('.ant-select-item-option-content').getByText('First Name', { exact: true })
    ).click();

    // Fill the filter input
    const filterInput = this.page.getByPlaceholder(/filter first/i);
    await expect(filterInput).toBeVisible({ timeout: 10000 });
    await filterInput.fill(firstName);

    // Apply the filter
    await this.page.getByRole('button', { name: 'Apply' }).click();

    // Wait for table loading to start and finish
    const spinner = this.page.locator('.ant-spin-spinning');
    await spinner.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await spinner.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await expect(this.tableHeaderRow).toBeVisible({ timeout: 15000 });
  }
}
