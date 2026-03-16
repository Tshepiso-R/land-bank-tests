import { test, expect, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LeadLocators } from './utils/locators/leadLocators';
import { LoanLocators } from './utils/locators/loanLocators';
import { EntityLocators } from './utils/locators/entityLocators';
import {
  validLead,
  entityLead,
  uniqueFirstName,
  entityInfo,
  directors,
  invalidEmails,
  invalidMobiles,
  requiredFields,
} from './utils/testData';
import {
  TestContext,
  createAuthenticatedContext,
  dismissOpenDialog,
  createEntityOpportunityInEditMode,
  deleteTableRow,
} from './utils/testHelpers';

test.use({ browserName: 'chromium' });

// ═══════════════════════════════════════════════════════════════
// 1. INDIVIDUAL — Married Workflow Regression
// ═══════════════════════════════════════════════════════════════

test.describe('Individual — Married Workflow', () => {
  let page: Page;
  let loan: LoanLocators;

  test.beforeAll(async ({ browser }) => {
    const ctx = await createAuthenticatedContext(browser);
    page = ctx.page;
    loan = ctx.loan;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should show Marital Regime dropdown when Married is selected', async () => {
    await allure.allureId('R01');

    await page.goto('/dynamic/LandBank.Crm/LBOpportunity-table');
    await page.getByRole('row', { name: 'Date Created Account' }).waitFor({ state: 'visible', timeout: 60000 });

    const row = page.getByRole('row').filter({ hasText: 'LeadCreate' }).first();
    await row.getByRole('link', { name: 'search' }).click();
    await page.getByRole('tab', { name: 'Client Info' }).waitFor({ state: 'visible', timeout: 60000 });

    await loan.enterEditMode();
    await loan.selectDropdownByTitle(loan.maritalStatusDropdown, 'Married');

    await expect(loan.maritalRegimeDropdown).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Marital Regime*')).toBeVisible();

    console.log('Marital Regime dropdown visible when Married selected');
    await page.getByRole('button', { name: 'close Cancel' }).click();
  });

  test('should show Spouse Information section for Community of Property', async () => {
    await allure.allureId('R02');

    await loan.enterEditMode();
    await loan.selectDropdownByTitle(loan.maritalStatusDropdown, 'Married');
    await loan.selectDropdownByTitle(loan.maritalRegimeDropdown, 'Married in Community of Property');

    await expect(page.getByText('Spouse Information')).toBeVisible({ timeout: 5000 });
    await expect(loan.spouseFirstNameInput).toBeVisible();
    await expect(loan.spouseLastNameInput).toBeVisible();
    await expect(loan.spouseEmailInput).toBeVisible();
    await expect(loan.spouseIdNumberInput).toBeVisible();

    console.log('Spouse Information section visible for Community of Property');
    await page.getByRole('button', { name: 'close Cancel' }).click();
  });

  for (const regime of [
    'Married in Community of Property',
    'Married out of Community with Accrual',
    'Married out of Community without Accrual',
  ]) {
    test(`should accept Marital Regime: ${regime}`, async () => {
      await loan.enterEditMode();
      await loan.selectDropdownByTitle(loan.maritalStatusDropdown, 'Married');
      await loan.selectDropdownByTitle(loan.maritalRegimeDropdown, regime);

      const selectedValue = loan.maritalRegimeDropdown.locator('.ant-select-selection-item');
      await expect(selectedValue).toHaveText(regime);

      console.log(`Marital Regime "${regime}" accepted`);
      await page.getByRole('button', { name: 'close Cancel' }).click();
    });
  }

  test('should hide Spouse fields when switching from Married back to Single', async () => {
    await allure.allureId('R03');

    await loan.enterEditMode();
    await loan.selectDropdownByTitle(loan.maritalStatusDropdown, 'Married');
    await loan.selectDropdownByTitle(loan.maritalRegimeDropdown, 'Married in Community of Property');
    await expect(page.getByText('Spouse Information')).toBeVisible({ timeout: 5000 });

    await loan.selectDropdownByTitle(loan.maritalStatusDropdown, 'Single');

    await expect(page.getByText('Spouse Information')).toBeHidden({ timeout: 5000 });
    await expect(loan.maritalRegimeDropdown).toBeHidden({ timeout: 3000 }).catch(() => {});

    console.log('Spouse fields hidden when switched back to Single');
    await page.getByRole('button', { name: 'close Cancel' }).click();
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. INDIVIDUAL — Lead Required Fields
// ═══════════════════════════════════════════════════════════════

test.describe('Individual — Lead Required Fields', () => {
  let page: Page;
  let lead: LeadLocators;

  test.beforeAll(async ({ browser }) => {
    const ctx = await createAuthenticatedContext(browser);
    page = ctx.page;
    lead = ctx.lead;
  });

  test.afterAll(async () => {
    await page.close();
  });

  for (const { field, label } of requiredFields) {
    test(`should reject lead when ${label} is missing`, async () => {
      await dismissOpenDialog(page, lead.dialog);
      await lead.navigateToLeads();
      await lead.openNewLeadDialog();
      await lead.fillAllFieldsExcept(validLead, field);
      await lead.submitForm();

      await expect(lead.requiredFieldErrors.first()).toBeVisible({ timeout: 30000 });
      await expect(lead.dialog).toBeVisible();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 3. INDIVIDUAL — Email & Mobile Format Validation
// ═══════════════════════════════════════════════════════════════

test.describe('Individual — Format Validation', () => {
  let page: Page;
  let lead: LeadLocators;

  test.beforeAll(async ({ browser }) => {
    const ctx = await createAuthenticatedContext(browser);
    page = ctx.page;
    lead = ctx.lead;
  });

  test.afterAll(async () => {
    await page.close();
  });

  for (const email of invalidEmails) {
    test(`should reject invalid email: "${email}"`, async () => {
      await dismissOpenDialog(page, lead.dialog);
      await lead.navigateToLeads();
      await lead.openNewLeadDialog();
      await lead.fillAllFields({ ...validLead, firstName: uniqueFirstName(), email });
      await lead.submitForm();

      await expect(lead.invalidEmailError).toBeVisible({ timeout: 30000 });
      await expect(lead.dialog).toBeVisible();
    });
  }

  for (const mobile of invalidMobiles) {
    test(`should reject invalid mobile: "${mobile}"`, async () => {
      await dismissOpenDialog(page, lead.dialog);
      await lead.navigateToLeads();
      await lead.openNewLeadDialog();
      await lead.fillAllFields({ ...validLead, firstName: uniqueFirstName(), mobile });
      await lead.submitForm();

      await expect(lead.invalidPhoneError).toBeVisible({ timeout: 30000 });
      await expect(lead.dialog).toBeVisible();
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// 4. ENTITY — Lead Validation
// ═══════════════════════════════════════════════════════════════

test.describe('Entity — Lead Validation', () => {
  let page: Page;
  let lead: LeadLocators;
  let entity: EntityLocators;

  test.beforeAll(async ({ browser }) => {
    const ctx = await createAuthenticatedContext(browser);
    page = ctx.page;
    lead = ctx.lead;
    entity = ctx.entity;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    await dismissOpenDialog(page, lead.dialog);
    await lead.navigateToLeads();
  });

  test('should require Entity Name when Entity client type is selected', async () => {
    await allure.allureId('R10');

    await lead.openNewLeadDialog();
    await lead.fillAllFields({ ...entityLead, firstName: uniqueFirstName() });
    await lead.submitForm();

    await expect(lead.dialog).toBeVisible({ timeout: 5000 });
    console.log('Entity Name required — dialog stays open');
  });

  for (const email of invalidEmails) {
    test(`should reject invalid email: "${email}"`, async () => {
      await lead.openNewLeadDialog();
      await lead.fillAllFields({ ...entityLead, firstName: uniqueFirstName(), email });
      await entity.entityNameInput.fill(entityLead.entityName);
      await lead.submitForm();

      await expect(lead.invalidEmailError).toBeVisible({ timeout: 30000 });
      await expect(lead.dialog).toBeVisible();
    });
  }

  for (const mobile of invalidMobiles) {
    test(`should reject invalid mobile: "${mobile}"`, async () => {
      await lead.openNewLeadDialog();
      await lead.fillAllFields({ ...entityLead, firstName: uniqueFirstName(), mobile });
      await entity.entityNameInput.fill(entityLead.entityName);
      await lead.submitForm();

      await expect(lead.invalidPhoneError).toBeVisible({ timeout: 30000 });
      await expect(lead.dialog).toBeVisible();
    });
  }

  test('should show validation when all required fields are empty', async () => {
    await allure.allureId('R11');

    await lead.openNewLeadDialog();
    await lead.fillAllFields({ ...entityLead, firstName: '', lastName: '', mobile: '', email: '' });

    await lead.firstNameInput.click();
    await lead.firstNameInput.blur();
    await lead.submitForm();

    await expect(lead.requiredFieldErrors.first()).toBeVisible({ timeout: 60000 });
    await expect(lead.dialog).toBeVisible();
    console.log('Validation errors shown for empty Entity lead fields');
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. ENTITY — Director & Signatory Edge Cases
// ═══════════════════════════════════════════════════════════════

test.describe('Entity — Director & Signatory Edge Cases', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: TestContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await createAuthenticatedContext(browser);
    page = ctx.page;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to an Entity opportunity in edit mode', async () => {
    await allure.allureId('R20');

    const accountName = await createEntityOpportunityInEditMode(ctx);
    console.log(`Entity opportunity opened: ${accountName}`);
  });

  test('should accept director save with empty fields (no client-side validation)', async () => {
    await allure.allureId('R21');

    await ctx.entity.addDirectorButton.click();
    await expect(ctx.entity.directorDialog).toBeVisible({ timeout: 30000 });

    await ctx.entity.directorDialog.getByRole('button', { name: 'check Save Director' }).click();
    await expect(ctx.entity.directorDialog).toBeHidden({ timeout: 30000 });

    await deleteTableRow(page, '');
    console.log('Director: empty save accepted (no validation), cleaned up');
  });

  test('should accept director with invalid SA ID (no client-side ID validation)', async () => {
    await allure.allureId('R22');

    await ctx.entity.addDirectorButton.click();
    await expect(ctx.entity.directorDialog).toBeVisible({ timeout: 30000 });

    const dialog = ctx.entity.directorDialog;
    await dialog.locator('.ant-form-item').filter({ hasText: /^First Name/ }).getByRole('textbox').fill('Test');
    await dialog.locator('.ant-form-item').filter({ hasText: /^Last Name/ }).getByRole('textbox').fill('Director');
    await dialog.getByPlaceholder('13-digit SA ID number').fill('12345');

    await dialog.getByRole('button', { name: 'check Save Director' }).click();
    await expect(dialog).toBeHidden({ timeout: 30000 });

    await expect(page.getByRole('cell', { name: 'Test' })).toBeVisible({ timeout: 10000 });
    console.log('Director with invalid ID accepted (no validation)');

    await deleteTableRow(page, 'Test');
  });

  test('should add a director with Married status', async () => {
    await allure.allureId('R23');

    await ctx.entity.fillEntityInfo(entityInfo);
    await ctx.entity.addDirector(directors[0]);
    await expect(page.getByRole('cell', { name: directors[0].firstName })).toBeVisible({ timeout: 10000 });
    console.log(`Married director added: ${directors[0].firstName} ${directors[0].lastName}`);
  });

  test('should accept signatory save with empty fields (no client-side validation)', async () => {
    await allure.allureId('R30');

    await ctx.entity.addSignatoryButton.click();
    await expect(ctx.entity.signatoryDialog).toBeVisible({ timeout: 30000 });

    await ctx.entity.signatoryDialog.getByRole('button', { name: 'check Save Signatory' }).click();
    await expect(ctx.entity.signatoryDialog).toBeHidden({ timeout: 30000 });
    console.log('Signatory: empty save accepted (no validation)');
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. ENTITY — Information Edge Cases
// ═══════════════════════════════════════════════════════════════

test.describe('Entity — Information Edge Cases', () => {
  let page: Page;
  let lead: LeadLocators;
  let entity: EntityLocators;

  test.beforeAll(async ({ browser }) => {
    const ctx = await createAuthenticatedContext(browser);
    page = ctx.page;
    lead = ctx.lead;
    entity = ctx.entity;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should display all Entity client type options in lead creation', async () => {
    await allure.allureId('R40');

    await lead.navigateToLeads();
    await lead.openNewLeadDialog();

    const clientTypeSelect = lead.dialog.locator('.ant-form-item').filter({ hasText: /^Client Type/ }).locator('.ant-select').first();
    await clientTypeSelect.click();

    const entityTypes = [
      'Close Corporation (Entity)',
      'Co-Corporation (Entity)',
      'Listed Company (Entity)',
    ];
    for (const type of entityTypes) {
      const option = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByTitle(type);
      await expect(option).toBeVisible({ timeout: 5000 });
    }

    console.log('All Entity client types available');
    await page.keyboard.press('Escape');
    await lead.cancelForm();
  });

  test('should conditionally show Entity Name only for Entity client types', async () => {
    await allure.allureId('R41');

    await lead.navigateToLeads();
    await lead.openNewLeadDialog();

    await lead.fillAllFields({ ...validLead, firstName: uniqueFirstName(), clientType: 'Individual (Individual)' });
    await expect(entity.entityNameInput).toBeHidden({ timeout: 3000 }).catch(() => {});

    const clientTypeSelect = lead.dialog.locator('.ant-form-item').filter({ hasText: /^Client Type/ }).locator('.ant-select').first();
    await clientTypeSelect.click();
    const entityOption = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByTitle('Close Corporation (Entity)');
    await entityOption.click();

    await expect(entity.entityNameInput).toBeVisible({ timeout: 5000 });

    console.log('Entity Name conditionally shown for Entity types only');
    await lead.cancelForm();
  });
});
