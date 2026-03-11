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
    await this.page.getByRole('option', { name: title }).or(
      this.page.getByText(title, { exact: true }).last()
    ).click();
  }

  async selectClientType(clientType: string): Promise<void> {
    await this.clientTypeDropdown.click();
    await this.page.getByTitle(clientType).click();
  }

  async selectProvince(province: string): Promise<void> {
    await this.provinceDropdown.click();
    await this.page.getByRole('option', { name: province }).or(
      this.page.getByTitle(province)
    ).click();
  }

  async selectPreferredCommunication(comm: string): Promise<void> {
    await this.preferredCommunicationDropdown.click();
    await this.page.getByTitle(comm, { exact: true }).click();
  }

  async selectLeadChannel(channel: string): Promise<void> {
    await this.leadChannelDropdown.click();
    await this.page.getByTitle(channel, { exact: true }).click();
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
    await row.locator('[aria-label="search"]').click();
    await expect(this.page.getByText('Lead', { exact: true }).first()).toBeVisible({ timeout: 30000 });
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

  // --- Filter panel ---

  async openFilterPanel(): Promise<void> {
    await this.page.locator('[aria-label="filter"]').click();
    await expect(this.page.getByText('Filter by')).toBeVisible({ timeout: 10000 });
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

    // Apply
    await this.page.getByRole('button', { name: 'Apply' }).click();

    // Wait for table to update
    await expect(this.tableHeaderRow).toBeVisible({ timeout: 10000 });
  }
}
