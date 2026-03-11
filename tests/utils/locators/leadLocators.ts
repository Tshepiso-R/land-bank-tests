import { Page, Locator } from '@playwright/test';

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
  readonly tableBody: Locator;

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
    this.sidebarTrigger = page.locator('.ant-layout-sider-trigger > span');
    this.leadsLink = page.getByRole('link', { name: 'Leads' });

    // Leads table
    this.allLeadsHeading = page.getByRole('heading', { name: 'All Leads' });
    this.tableHeaderRow = page.getByRole('row', { name: 'Date Created Client Type' });
    this.newLeadButton = page.getByRole('button', { name: 'plus New Lead' });
    this.searchInput = page.getByRole('textbox').first();
    this.searchButton = page.getByRole('button', { name: 'search' });
    this.tableBody = page.locator('tbody');

    // Dialog
    this.dialog = page.getByRole('dialog', { name: 'Add New Lead' });
    this.dialogTitle = this.dialog.locator('.ant-modal-title');

    // Form fields — use dialog scope to avoid ambiguity
    this.titleDropdown = this.dialog.locator('.ant-form-item').filter({ hasText: /^Title/ }).locator('.ant-select');
    // Owner field does NOT register as role=textbox, so: FirstName=0, LastName=1, Mobile=2, Email=3
    this.firstNameInput = this.dialog.getByRole('textbox').nth(0);
    this.lastNameInput = this.dialog.getByRole('textbox').nth(1);
    this.mobileInput = this.dialog.getByRole('textbox').nth(2);
    this.emailInput = this.dialog.getByRole('textbox').nth(3);
    // Use label-based locators for dropdowns to avoid fragile nth() indices
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
    await this.dialog.waitFor({ state: 'visible', timeout: 30000 });
  }

  async selectDropdownOption(dropdown: Locator, optionText: string): Promise<void> {
    await dropdown.click();
    await this.page.locator('.ant-select-item-option-content').getByText(optionText, { exact: true }).click();
  }

  async selectTitle(title: string): Promise<void> {
    await this.titleDropdown.click();
    await this.page.locator('.ant-select-item-option-content').getByText(title, { exact: true }).click();
  }

  async selectClientType(clientType: string): Promise<void> {
    await this.clientTypeDropdown.click();
    await this.page.getByTitle(clientType).click();
  }

  async selectProvince(province: string): Promise<void> {
    await this.provinceDropdown.click();
    await this.page.locator('.ant-select-item-option-content').getByText(province, { exact: true }).click();
  }

  async selectPreferredCommunication(comm: string): Promise<void> {
    await this.preferredCommunicationDropdown.click();
    await this.page.locator('.ant-select-item-option-content').getByText(comm, { exact: true }).click();
  }

  async selectLeadChannel(channel: string): Promise<void> {
    await this.leadChannelDropdown.click();
    await this.page.locator('.ant-select-item-option-content').getByText(channel).first().click();
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

  async getValidationErrors(): Promise<string[]> {
    const errors = this.dialog.locator('.ant-form-item-explain-error');
    await errors.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return await errors.allTextContents();
  }

  async hasValidationError(message: string): Promise<boolean> {
    const errors = await this.getValidationErrors();
    return errors.some((e) => e.toLowerCase().includes(message.toLowerCase()));
  }

  async getToastMessage(): Promise<string> {
    const toast = this.page.locator('.ant-message-notice, .ant-notification-notice');
    await toast.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    return await toast.first().textContent() || '';
  }

  // --- Detail Page helpers ---

  /**
   * Click the magnifying glass icon on a lead row to open the detail page.
   */
  async openLeadDetails(firstName: string, lastName: string): Promise<void> {
    const row = this.getLeadRowByName(firstName, lastName);
    await row.locator('[aria-label="search"]').click();
    // Wait for detail page to load — look for the "Lead" subtitle
    await this.page.getByText('Lead', { exact: true }).first().waitFor({ state: 'visible', timeout: 30000 });
  }

  // --- Detail Page locators (call after navigating to detail page) ---

  /** Header: "LastName, FirstName" — not a semantic heading, use text matching */
  detailHeadingContains(text: string): Locator {
    return this.page.getByText(text, { exact: false }).first();
  }

  /** Header badge cards */
  get detailStatus(): Locator {
    return this.page.getByText('Status').locator('..').locator('.ant-tag, span').last();
  }

  get detailAssessment(): Locator {
    return this.page.getByText('Assessment').locator('..');
  }

  get detailLeadOwner(): Locator {
    return this.page.getByText('Lead Owner').locator('..');
  }

  get detailHeaderProvince(): Locator {
    return this.page.getByText('Province').first().locator('..');
  }

  get detailRegion(): Locator {
    return this.page.getByText('Region').locator('..');
  }

  /** Action buttons — scoped to sha-toolbar-btn to avoid Shesha configurator duplicates */
  get editButton(): Locator {
    return this.page.locator('button.sha-toolbar-btn').filter({ hasText: 'Edit' });
  }

  get disqualifyButton(): Locator {
    return this.page.locator('button.sha-toolbar-btn').filter({ hasText: 'Disqualify' });
  }

  get auditLogButton(): Locator {
    return this.page.locator('button.sha-toolbar-btn').filter({ hasText: 'Audit Log' });
  }

  get initiatePreScreeningButton(): Locator {
    return this.page.locator('button.sha-toolbar-btn').filter({ hasText: 'Initiate Pre-Screening' });
  }

  /** Tabs */
  get detailsTab(): Locator {
    return this.page.getByRole('tab', { name: 'Details' });
  }

  get tasksTab(): Locator {
    return this.page.getByRole('tab', { name: 'Tasks' });
  }

  get notesTab(): Locator {
    return this.page.getByRole('tab', { name: 'Notes' });
  }

  /** Detail field values — text next to labels */
  getDetailFieldValue(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator('..').locator('span, div, p').last();
  }

  /**
   * Open the filter panel by clicking the filter icon on the table toolbar.
   */
  async openFilterPanel(): Promise<void> {
    await this.page.locator('[aria-label="filter"]').click();
    // Wait for the filter panel to appear (side panel with "Filter by")
    await this.page.getByText('Filter by').waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Filter leads by First Name using the filter panel.
   * Opens the panel, selects "First Name" column, enters the value, and applies.
   */
  async filterByFirstName(firstName: string): Promise<void> {
    await this.openFilterPanel();

    // Click the "Filter by" dropdown
    const filterSelect = this.page.getByText('Filter by').locator('..').locator('.ant-select');
    await filterSelect.click();

    // Select "First Name" from the dropdown options (scoped to avoid matching column header)
    await this.page.locator('.ant-select-item-option-content').getByText('First Name', { exact: true }).click();

    // The "First Name" label and filter input should now be visible below
    const filterInput = this.page.getByPlaceholder(/filter first/i);
    await filterInput.waitFor({ state: 'visible', timeout: 10000 });
    await filterInput.fill(firstName);

    // Click Apply
    await this.page.getByRole('button', { name: 'Apply' }).click();

    // Wait for table to refresh
    await this.page.waitForTimeout(3000);
  }
}
