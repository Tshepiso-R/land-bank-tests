// Locators and helpers for Entity-specific UI: Entity Name, Entity Info, Directors, Signatories.
import { Page, Locator, expect } from '@playwright/test';

export class EntityLocators {
  readonly page: Page;

  // Lead dialog — Entity Name (appears when Entity client type is selected)
  readonly entityNameInput: Locator;

  // Opportunity — Entity Information section
  readonly entityInfoSection: Locator;

  // Director section
  readonly addDirectorButton: Locator;
  readonly directorDialog: Locator;

  // Signatory section
  readonly addSignatoryButton: Locator;
  readonly signatoryDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    // Lead dialog — Entity Name field appears conditionally
    const leadDialog = page.getByRole('dialog', { name: 'Add New Lead' });
    this.entityNameInput = leadDialog.locator('.ant-form-item').filter({ hasText: /^Entity Name/ }).getByRole('textbox');

    // Opportunity — Entity Information
    this.entityInfoSection = page.getByText('Entity Information');

    // Director section
    this.addDirectorButton = page.getByRole('button', { name: 'plus-circle Add Director' });
    this.directorDialog = page.getByRole('dialog', { name: 'Create Director' });

    // Signatory section
    this.addSignatoryButton = page.getByRole('button', { name: 'plus-circle Add Signatory' });
    this.signatoryDialog = page.getByRole('dialog', { name: 'Create Signatory' });
  }

  // --- Dropdown helpers ---

  private async selectDropdownOption(dropdown: Locator, searchText: string, optionText: string): Promise<void> {
    const currentValue = dropdown.locator('.ant-select-selection-item');
    if (await currentValue.isVisible().catch(() => false)) {
      const text = await currentValue.textContent();
      if (text?.trim() === optionText) return;
    }
    await dropdown.click();
    const searchInput = dropdown.locator('input[type="search"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(searchText);
    }
    const activePopup = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
    const option = activePopup.locator('.ant-select-item-option').filter({ hasText: optionText });
    await expect(option.first()).toBeVisible({ timeout: 10000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 2000 }).catch(() => {});
  }

  private async selectDropdownByTitle(dropdown: Locator, optionTitle: string): Promise<void> {
    const currentValue = dropdown.locator('.ant-select-selection-item');
    if (await currentValue.isVisible().catch(() => false)) {
      const text = await currentValue.textContent();
      if (text?.trim() === optionTitle) return;
    }
    await dropdown.click();
    const option = this.page.getByTitle(optionTitle);
    await expect(option.first()).toBeVisible({ timeout: 10000 });
    await option.first().click();
    await expect(option.first()).toBeHidden({ timeout: 2000 }).catch(() => {});
  }

  private formItem(labelPattern: RegExp): Locator {
    return this.page.locator('.ant-form-item').filter({ hasText: labelPattern });
  }

  private formItemSelect(labelPattern: RegExp): Locator {
    return this.formItem(labelPattern).locator('.ant-select').first();
  }

  // --- Entity Information helpers ---

  async fillEntityInfo(data: {
    entityName?: string;
    companyRegistrationNumber?: string;
    yearsInOperation?: number;
    entityOrgType?: string;
    clientClassification?: string;
    beeLevel?: string;
    countryOfResidence?: string;
    citizenship?: string;
  }): Promise<void> {
    // Check Auto Verify
    const autoVerify = this.page.getByText('Auto Verify').locator('..').locator('..').getByRole('checkbox');
    if (!(await autoVerify.isChecked())) {
      await autoVerify.check();
    }

    if (data.entityName) {
      await this.formItem(/^Entity Name/).getByRole('textbox').fill(data.entityName);
    }
    if (data.companyRegistrationNumber) {
      await this.formItem(/^Company Registration Number/).getByRole('textbox').fill(data.companyRegistrationNumber);
    }
    if (data.yearsInOperation !== undefined) {
      await this.formItem(/^Years In Operation/).getByRole('spinbutton').fill(String(data.yearsInOperation));
    }
    if (data.countryOfResidence) {
      await this.selectDropdownOption(this.formItemSelect(/^Country Of Residence/), data.countryOfResidence.substring(0, 5), data.countryOfResidence);
    }
    if (data.citizenship) {
      await this.selectDropdownOption(this.formItemSelect(/^Citizenship/), data.citizenship.substring(0, 5), data.citizenship);
    }
    if (data.entityOrgType) {
      await this.selectDropdownByTitle(this.formItemSelect(/^Entity Org Type/), data.entityOrgType);
    }
    if (data.clientClassification) {
      await this.selectDropdownByTitle(this.formItemSelect(/^Client Classification/), data.clientClassification);
    }
    if (data.beeLevel) {
      await this.selectDropdownByTitle(this.formItemSelect(/^BEEE Level/), data.beeLevel);
    }
  }

  // --- Director helpers ---

  async addDirector(data: {
    firstName: string;
    lastName: string;
    idNumber: string;
    email?: string;
    mobile?: string;
    citizenship: string;
    countryOfResidence: string;
    countryOfOrigin: string;
    maritalStatus: string;
  }): Promise<void> {
    await this.addDirectorButton.click();
    await expect(this.directorDialog).toBeVisible({ timeout: 30000 });

    const dialog = this.directorDialog;

    // Director Details
    await dialog.locator('.ant-form-item').filter({ hasText: /^First Name/ }).getByRole('textbox').fill(data.firstName);
    await dialog.locator('.ant-form-item').filter({ hasText: /^Last Name/ }).getByRole('textbox').fill(data.lastName);
    await dialog.getByPlaceholder('13-digit SA ID number').fill(data.idNumber);
    if (data.email) {
      await dialog.locator('.ant-form-item').filter({ hasText: /^Email Address/ }).getByRole('textbox').fill(data.email);
    }
    if (data.mobile) {
      await dialog.locator('.ant-form-item').filter({ hasText: /^Mobile Number/ }).getByRole('textbox').fill(data.mobile);
    }

    // Country & Citizenship
    const citizenshipDropdown = dialog.locator('.ant-form-item').filter({ hasText: /^Citizenship/ }).locator('.ant-select').first();
    await this.selectDropdownOption(citizenshipDropdown, data.citizenship.substring(0, 5), data.citizenship);

    const residenceDropdown = dialog.locator('.ant-form-item').filter({ hasText: /^Country Of Residence/ }).locator('.ant-select').first();
    await this.selectDropdownOption(residenceDropdown, data.countryOfResidence.substring(0, 5), data.countryOfResidence);

    const originDropdown = dialog.locator('.ant-form-item').filter({ hasText: /^Country Of Origin/ }).locator('.ant-select').first();
    await this.selectDropdownOption(originDropdown, data.countryOfOrigin.substring(0, 5), data.countryOfOrigin);

    // Marital Information
    const maritalDropdown = dialog.locator('.ant-form-item').filter({ hasText: /^Marital Status/ }).locator('.ant-select').first();
    await this.selectDropdownByTitle(maritalDropdown, data.maritalStatus);

    // Save
    await dialog.getByRole('button', { name: 'check Save Director' }).click();
    await expect(dialog).toBeHidden({ timeout: 30000 });
  }

  // --- Signatory helpers ---

  async addSignatory(data: {
    firstName: string;
    lastName: string;
    idNumber: string;
    email?: string;
    mobile?: string;
  }): Promise<void> {
    await this.addSignatoryButton.click();
    await expect(this.signatoryDialog).toBeVisible({ timeout: 30000 });

    const dialog = this.signatoryDialog;

    await dialog.getByPlaceholder('Enter first name').fill(data.firstName);
    await dialog.getByPlaceholder('Enter last name').fill(data.lastName);
    await dialog.getByPlaceholder('Enter 13-digit SA ID number').fill(data.idNumber);
    if (data.email) {
      await dialog.getByPlaceholder('Enter email address').fill(data.email);
    }
    if (data.mobile) {
      await dialog.getByPlaceholder('Enter mobile number').fill(data.mobile);
    }

    // Save
    await dialog.getByRole('button', { name: 'check Save Signatory' }).click();
    await expect(dialog).toBeHidden({ timeout: 30000 });
  }
}
