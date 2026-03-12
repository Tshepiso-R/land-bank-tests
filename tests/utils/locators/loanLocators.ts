import { Page, Locator, expect } from '@playwright/test';

export class LoanLocators {
  readonly page: Page;

  // Sidebar
  readonly sidebarTrigger: Locator;
  readonly opportunitiesLink: Locator;

  // Opportunities table
  readonly tableHeaderRow: Locator;

  // Opportunity detail page — top-level tabs
  readonly loanApplicationDetailsTab: Locator;
  readonly tasksTab: Locator;
  readonly notesTab: Locator;

  // Sub-tabs nested under Loan Application Details
  readonly clientInfoTab: Locator;
  readonly loanInfoTab: Locator;
  readonly farmsTab: Locator;

  // Top-level tab panels
  readonly loanApplicationDetailsPanel: Locator;

  // Action buttons (header bar)
  readonly editButton: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;
  readonly auditLogButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sidebar
    this.sidebarTrigger = page.getByRole('img', { name: /menu-unfold|menu/ }).first();
    this.opportunitiesLink = page.getByRole('link', { name: 'Opportunities' });

    // Opportunities table
    this.tableHeaderRow = page.getByRole('row', { name: 'Date Created Account' });

    // Top-level tabs
    this.loanApplicationDetailsTab = page.getByRole('tab', { name: 'Loan Application Details' });
    this.tasksTab = page.getByRole('tab', { name: 'Tasks' });
    this.notesTab = page.getByRole('tab', { name: 'Notes' });

    // Sub-tabs (under Loan Application Details)
    this.clientInfoTab = page.getByRole('tab', { name: 'Client Info' });
    this.loanInfoTab = page.getByRole('tab', { name: 'Loan Info' });
    this.farmsTab = page.getByRole('tab', { name: 'Farms' });

    // The main panel that confirms the Opportunity page loaded
    this.loanApplicationDetailsPanel = page.getByText('Loan Application Details').first();

    // Action buttons
    this.editButton = page.getByRole('button', { name: 'edit Edit' });
    this.cancelButton = page.getByRole('button', { name: 'close Cancel' });
    this.saveButton = page.getByRole('button', { name: 'check Save' }).first();
    this.auditLogButton = page.getByRole('button', { name: 'Audit Log' });
  }

  // --- Navigation ---

  async navigateToOpportunities(): Promise<void> {
    // Expand sidebar if collapsed (menu-unfold visible means sidebar is collapsed)
    const menuUnfold = this.page.getByRole('img', { name: 'menu-unfold' });
    if (await menuUnfold.isVisible().catch(() => false)) {
      await menuUnfold.click();
      await this.page.getByRole('img', { name: 'menu-fold' }).waitFor({ state: 'visible', timeout: 10000 });
    }
    await this.opportunitiesLink.click();
    await this.tableHeaderRow.waitFor({ state: 'visible', timeout: 60000 });
  }

  // --- Filter panel ---

  async openFilterPanel(): Promise<void> {
    await this.page.locator('[aria-label="filter"]').click();
    await expect(this.page.getByText('Filter by')).toBeVisible({ timeout: 30000 });
  }

  /** Remove all existing filter tags before applying a new filter */
  async clearExistingFilters(): Promise<void> {
    const closeIcons = this.page.locator('.ant-tag .anticon-close, .ant-tag-close-icon');
    let count = await closeIcons.count();
    while (count > 0) {
      await closeIcons.first().click();
      const spinner = this.page.locator('.ant-spin-spinning');
      await spinner.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      await spinner.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      count = await closeIcons.count();
    }
  }

  async filterByAccount(accountName: string): Promise<void> {
    // Clear any pre-existing filters from previous tests
    await this.clearExistingFilters();

    await this.openFilterPanel();

    // Click the "Filter by" dropdown
    const filterSelect = this.page.getByText('Filter by').locator('..').locator('.ant-select');
    await filterSelect.click();

    // Select "Account" — target the dropdown popup option specifically
    const accountOption = this.page.locator('.ant-select-item-option').filter({ hasText: 'Account' }).first();
    await expect(accountOption).toBeVisible({ timeout: 10000 });
    await accountOption.click();

    // Close the filter-by dropdown if still open
    await this.page.keyboard.press('Escape');

    // Account filter is an Ant Design searchable select
    const accountSelect = this.page.locator('.ant-select').filter({ hasText: 'Type to search' });
    await accountSelect.click();
    const searchInput = accountSelect.locator('input');
    await searchInput.fill(accountName);
    // Select the matching option from search results
    const searchOption = this.page.locator('.ant-select-item-option').filter({ hasText: accountName });
    await expect(searchOption.first()).toBeVisible({ timeout: 10000 });
    await searchOption.first().click();

    // Apply the filter
    await this.page.getByRole('button', { name: 'Apply' }).click();

    // Wait for table loading
    const spinner = this.page.locator('.ant-spin-spinning');
    await spinner.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await spinner.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await expect(this.tableHeaderRow).toBeVisible({ timeout: 15000 });
  }

  getOpportunityRowByAccount(accountName: string): Locator {
    return this.page.getByRole('row').filter({ hasText: accountName });
  }

  async openOpportunityDetails(accountName: string): Promise<void> {
    const row = this.getOpportunityRowByAccount(accountName);
    const detailLink = row.getByRole('link', { name: 'search' });
    await detailLink.click();
    await expect(this.clientInfoTab).toBeVisible({ timeout: 60000 });
  }

  // --- Edit mode ---

  async enterEditMode(): Promise<void> {
    await this.editButton.click();
    await expect(this.cancelButton).toBeVisible({ timeout: 30000 });
  }

  async save(): Promise<void> {
    await this.saveButton.click();
    // Wait for save to complete — edit button reappears
    await expect(this.editButton).toBeVisible({ timeout: 60000 });
  }

  // --- Form item helpers (Ant Design pattern) ---

  private formItem(labelPattern: RegExp): Locator {
    return this.page.locator('.ant-form-item').filter({ hasText: labelPattern });
  }

  private formItemSelect(labelPattern: RegExp): Locator {
    return this.formItem(labelPattern).locator('.ant-select').first();
  }

  // --- Client Info tab field locators ---

  get clientIdNumberInput(): Locator {
    return this.formItem(/^Client ID Number/).getByRole('textbox');
  }

  get clientNameInput(): Locator {
    return this.formItem(/^Client Name/).getByRole('textbox');
  }

  get clientSurnameInput(): Locator {
    return this.formItem(/^Client Surname/).getByRole('textbox');
  }

  get emailAddressInput(): Locator {
    return this.formItem(/^Email Address/).getByRole('textbox');
  }

  get mobileNumberInput(): Locator {
    return this.formItem(/^Mobile Number/).getByRole('textbox');
  }

  get clientTitleDropdown(): Locator {
    return this.formItemSelect(/^Client Title/);
  }

  get countryOfOriginDropdown(): Locator {
    return this.formItemSelect(/^Country Of Origin/);
  }

  get clientClassificationDropdown(): Locator {
    return this.formItemSelect(/^Client Classification/);
  }

  get provinceDropdown(): Locator {
    return this.formItemSelect(/^Province/);
  }

  get regionDropdown(): Locator {
    return this.formItemSelect(/^Region/);
  }

  get provincialOfficeDropdown(): Locator {
    return this.formItemSelect(/^Provincial Office/);
  }

  // --- Dropdown helpers (reusable for all Ant selects) ---

  async selectDropdownOption(dropdown: Locator, searchText: string, optionText: string): Promise<void> {
    await dropdown.click();
    // If it's a searchable dropdown, type to filter
    const searchInput = dropdown.locator('input[type="search"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(searchText);
    }
    const option = this.page.getByText(optionText, { exact: false });
    await expect(option.first()).toBeVisible({ timeout: 10000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 5000 }).catch(() => {});
  }

  async selectDropdownByTitle(dropdown: Locator, optionTitle: string): Promise<void> {
    await dropdown.click();
    const option = this.page.getByTitle(optionTitle);
    await expect(option.first()).toBeVisible({ timeout: 10000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 5000 }).catch(() => {});
  }

  async fillClientInfo(data: {
    idNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    countryOfOrigin?: string;
    clientClassification?: string;
    province?: string;
    region?: string;
    provincialOffice?: string;
  }): Promise<void> {
    await this.clientIdNumberInput.fill(data.idNumber);
    await this.clientNameInput.fill(data.firstName);
    await this.clientSurnameInput.fill(data.lastName);
    await this.emailAddressInput.fill(data.email);
    if (data.countryOfOrigin) {
      await this.selectDropdownOption(this.countryOfOriginDropdown, data.countryOfOrigin.substring(0, 5), data.countryOfOrigin);
    }
    if (data.clientClassification) {
      await this.selectDropdownByTitle(this.clientClassificationDropdown, data.clientClassification);
    }
    if (data.province) {
      await this.selectDropdownByTitle(this.provinceDropdown, data.province);
    }
    if (data.region) {
      await this.selectDropdownByTitle(this.regionDropdown, data.region);
    }
    if (data.provincialOffice) {
      await this.selectDropdownByTitle(this.provincialOfficeDropdown, data.provincialOffice);
    }
  }

  // --- Loan Info sub-tab helpers ---

  get loanInfoPanel(): Locator {
    return this.page.getByText('Loan Information').first();
  }

  get productsDropdown(): Locator {
    return this.formItem(/^Products/).locator('.ant-select').first();
  }

  get businessSummaryTextarea(): Locator {
    return this.formItem(/^Business Summary/).locator('textarea');
  }

  get requestedAmountInput(): Locator {
    return this.formItem(/^Requested Amount/).getByRole('textbox');
  }

  get existingRelationshipDropdown(): Locator {
    return this.formItemSelect(/^Existing Relationship/);
  }

  get sourcesOfIncomeDropdown(): Locator {
    return this.formItemSelect(/^Sources Of Income/);
  }

  async fillLoanInfo(data: {
    summary: string;
    amount: string;
    existingRelationship?: string;
  }): Promise<void> {
    await this.businessSummaryTextarea.fill(data.summary);
    await this.requestedAmountInput.fill(data.amount);
    if (data.existingRelationship) {
      await this.selectDropdownByTitle(this.existingRelationshipDropdown, data.existingRelationship);
    }
  }

  // --- Farms sub-tab helpers ---

  get addFarmButton(): Locator {
    return this.page.getByRole('button', { name: /Add a Farm/i });
  }

  get createFarmDialog(): Locator {
    return this.page.getByRole('dialog', { name: /Create a Farm/i });
  }

  get farmNameInput(): Locator {
    return this.createFarmDialog.locator('.ant-form-item').filter({ hasText: /^Farm Name/ }).getByRole('textbox');
  }

  get landSizeHectaresInput(): Locator {
    return this.createFarmDialog.locator('.ant-form-item').filter({ hasText: /^Land Size Hectares/ }).locator('input');
  }

  get farmDialogOkButton(): Locator {
    return this.createFarmDialog.getByRole('button', { name: 'OK' });
  }

  private farmFormSelect(labelPattern: RegExp): Locator {
    return this.createFarmDialog.locator('.ant-form-item').filter({ hasText: labelPattern }).locator('.ant-select').first();
  }

  get landTenureStatusDropdown(): Locator {
    return this.farmFormSelect(/^Land Tenure Status/);
  }

  get typesOfFarmingDropdown(): Locator {
    return this.farmFormSelect(/^Types Of Farming/);
  }

  get farmProvinceDropdown(): Locator {
    return this.farmFormSelect(/^Province/);
  }

  get farmRegionDropdown(): Locator {
    return this.farmFormSelect(/^Region/);
  }

  async addFarm(data: {
    name: string;
    landTenureStatus: string;
    typesOfFarming: string[];
    size: string;
    province: string;
    region: string;
  }): Promise<void> {
    await this.addFarmButton.click();
    await expect(this.createFarmDialog).toBeVisible({ timeout: 30000 });

    await this.farmNameInput.fill(data.name);
    await this.selectDropdownByTitle(this.landTenureStatusDropdown, data.landTenureStatus);

    // Types of farming — multi-select; use search input to find each option
    for (const type of data.typesOfFarming) {
      await this.typesOfFarmingDropdown.click();
      // Type in the search input to filter options
      const searchInput = this.typesOfFarmingDropdown.locator('input');
      await searchInput.fill(type.substring(0, 6));
      const option = this.page.getByTitle(type);
      await expect(option.first()).toBeVisible({ timeout: 10000 });
      await option.first().click();
    }
    // Close the dropdown by pressing Escape
    await this.page.keyboard.press('Escape');

    await this.landSizeHectaresInput.fill(data.size);

    // Province and Region inside farm dialog
    await this.farmProvinceDropdown.click();
    const provOption = this.page.locator('.ant-select-item-option').filter({ hasText: data.province });
    await expect(provOption.first()).toBeVisible({ timeout: 10000 });
    await provOption.first().click();
    await expect(provOption.first()).toBeHidden({ timeout: 5000 }).catch(() => {});

    await this.farmRegionDropdown.click();
    const regOption = this.page.locator('.ant-select-item-option').filter({ hasText: data.region });
    await expect(regOption.first()).toBeVisible({ timeout: 10000 });
    await regOption.first().click();
    await expect(regOption.first()).toBeHidden({ timeout: 5000 }).catch(() => {});

    await this.farmDialogOkButton.click();
    await expect(this.createFarmDialog).toBeHidden({ timeout: 30000 });
  }

  // --- Opportunity header locators ---

  get opportunityHeading(): Locator {
    return this.page.getByText('Opportunity').first();
  }

  get assignedToDropdown(): Locator {
    return this.formItemSelect(/^Assigned To/);
  }

  async assignTo(name: string): Promise<void> {
    await this.selectDropdownOption(this.assignedToDropdown, name.split(' ')[0], name);
  }
}
