// Locators and helpers for the Leads module: list, create dialog, detail page, pre-screening.
import { Page, Locator, expect } from '@playwright/test';

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
    // Navigate directly via URL (sidebar may not have Leads link for all roles)
    await this.page.goto('/dynamic/LandBank.Crm/LBLead-table');
    await this.tableHeaderRow.waitFor({ state: 'visible', timeout: 60000 });
  }

  async openNewLeadDialog(): Promise<void> {
    await this.newLeadButton.click();
    await expect(this.dialog).toBeVisible({ timeout: 30000 });
  }

  async selectTitle(title: string): Promise<void> {
    await this.titleDropdown.click();
    const combobox = this.titleDropdown.getByRole('combobox');
    await combobox.pressSequentially(title, { delay: 50 });
    const option = this.page.locator('.ant-select-item-option').filter({ hasText: title }).first();
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
    await expect(option).toBeHidden({ timeout: 2000 }).catch(() => {});
  }

  async selectClientType(clientType: string): Promise<void> {
    await this.clientTypeDropdown.click();
    const option = this.page.getByTitle(clientType);
    await expect(option.first()).toBeVisible({ timeout: 30000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 2000 }).catch(() => {});
  }

  async selectProvince(province: string): Promise<void> {
    await this.provinceDropdown.click();
    const option = this.page.getByRole('option', { name: province }).or(
      this.page.getByTitle(province)
    );
    await expect(option.first()).toBeVisible({ timeout: 30000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 2000 }).catch(() => {});
  }

  async selectPreferredCommunication(comm: string): Promise<void> {
    await this.preferredCommunicationDropdown.click();
    const option = this.page.getByTitle(comm, { exact: true });
    await expect(option.first()).toBeVisible({ timeout: 30000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 2000 }).catch(() => {});
  }

  async selectLeadChannel(channel: string): Promise<void> {
    await this.leadChannelDropdown.click();
    // Type to filter the dropdown and avoid viewport scrolling issues
    const combobox = this.leadChannelDropdown.getByRole('combobox');
    await combobox.pressSequentially(channel.substring(0, 4), { delay: 50 });
    const option = this.page.getByTitle(channel, { exact: true });
    await expect(option.first()).toBeVisible({ timeout: 30000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 2000 }).catch(() => {});
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

  /** Get all validation error messages visible in the dialog */
  get validationErrors(): Locator {
    return this.dialog.getByRole('alert');
  }

  /** Get the specific "This field is required" error messages */
  get requiredFieldErrors(): Locator {
    return this.dialog.getByText('This field is required');
  }

  /** Get the email format validation error */
  get invalidEmailError(): Locator {
    return this.dialog.getByText('Please enter a valid email address');
  }

  /** Get the phone format validation error */
  get invalidPhoneError(): Locator {
    return this.dialog.getByText('Please enter a valid phone number');
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
   * Questions appear in fixed order; each has a Yes and No radio.
   * We use .nth(index) because Ant Design radios lack unique ARIA labels
   * or radiogroup roles — positional indexing is the only reliable approach.
   */
  async completePreScreeningToPass(): Promise<void> {
    await this.initiatePreScreeningButton.click();
    const dialog = this.page.getByRole('dialog', { name: /Pre-Screening/i });
    await expect(dialog).toBeVisible({ timeout: 30000 });

    // Each question's passing answer, in the order they appear in the dialog
    const passingAnswers: ('Yes' | 'No')[] = [
      'Yes', // Is the applicant a South African citizen?
      'Yes', // Is the farming land located in South Africa?
      'Yes', // Do the intended farming activities fall within the Land Bank mandate?
      'No',  // Is the client blacklisted?
      'No',  // Is the client currently under debt review?
      'Yes', // Is the client's current Country of Residence South Africa?
      'Yes', // Does the client currently have access to suitable land for farming activities?
    ];

    for (let i = 0; i < passingAnswers.length; i++) {
      await dialog.getByRole('radio', { name: passingAnswers[i] }).nth(i).check();
    }

    // Check the confirmation checkbox to enable Submit
    await dialog.getByRole('checkbox').check();

    // Submit the questionnaire
    await dialog.getByRole('button', { name: /Submit/i }).click();

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

  /** Remove all existing filter tags before applying a new filter */
  async clearExistingFilters(): Promise<void> {
    // Close any open filter panel first
    const closeIcons = this.page.locator('.ant-tag .anticon-close, .ant-tag-close-icon');
    let count = await closeIcons.count();
    while (count > 0) {
      await closeIcons.first().click();
      // Wait for the tag to disappear
      const spinner = this.page.locator('.ant-spin-spinning');
      await spinner.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      await spinner.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      count = await closeIcons.count();
    }
  }

  async filterByFirstName(firstName: string): Promise<void> {
    // Clear any pre-existing filters from previous tests
    await this.clearExistingFilters();

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
