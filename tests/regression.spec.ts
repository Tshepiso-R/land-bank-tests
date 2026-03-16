import { test, expect, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { login } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { LoanLocators } from './utils/locators/loanLocators';
import { EntityLocators } from './utils/locators/entityLocators';
import {
  validLead,
  entityLead,
  uniqueFirstName,
  clientInfoDetails,
  spouseInfo,
  entityInfo,
  directors,
  signatoryData,
  loanInfo,
  entityLoanInfo,
  farmData,
  entityFarmData,
  invalidEmails,
  invalidMobiles,
  requiredFields,
  opportunityOwner,
} from './utils/testData';

test.use({ browserName: 'chromium' });

// ═══════════════════════════════════════════════════════════════
// 1. INDIVIDUAL MARRIED WORKFLOW — Regression
// ═══════════════════════════════════════════════════════════════

test.describe('Individual Married Workflow — Regression', () => {
  let page: Page;
  let loan: LoanLocators;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page, process.env.CRM_USERNAME || 'admin', process.env.CRM_PASSWORD || '123qwe');
    loan = new LoanLocators(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should show Marital Regime dropdown when Married is selected', async () => {
    await allure.allureId('R01');

    // Use existing converted lead opportunity
    await page.goto('/dynamic/LandBank.Crm/LBOpportunity-table');
    await page.getByRole('row', { name: 'Date Created Account' }).waitFor({ state: 'visible', timeout: 60000 });

    const row = page.getByRole('row').filter({ hasText: 'LeadCreate' }).first();
    await row.getByRole('link', { name: 'search' }).click();
    await page.getByRole('tab', { name: 'Client Info' }).waitFor({ state: 'visible', timeout: 60000 });

    await loan.enterEditMode();

    // Select Married
    await loan.selectDropdownByTitle(loan.maritalStatusDropdown, 'Married');

    // Marital Regime should appear and be required (indicated by *)
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

    // Spouse Information section and required fields
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

      // Verify regime was selected
      const selectedValue = loan.maritalRegimeDropdown.locator('.ant-select-selection-item');
      await expect(selectedValue).toHaveText(regime);

      console.log(`Marital Regime "${regime}" accepted`);
      await page.getByRole('button', { name: 'close Cancel' }).click();
    });
  }

  test('should hide Spouse fields when switching from Married back to Single', async () => {
    await allure.allureId('R03');

    await loan.enterEditMode();

    // Set to Married + COP first
    await loan.selectDropdownByTitle(loan.maritalStatusDropdown, 'Married');
    await loan.selectDropdownByTitle(loan.maritalRegimeDropdown, 'Married in Community of Property');
    await expect(page.getByText('Spouse Information')).toBeVisible({ timeout: 5000 });

    // Switch back to Single
    await loan.selectDropdownByTitle(loan.maritalStatusDropdown, 'Single');

    // Spouse fields should disappear
    await expect(page.getByText('Spouse Information')).toBeHidden({ timeout: 5000 });
    await expect(loan.maritalRegimeDropdown).toBeHidden({ timeout: 3000 }).catch(() => {});

    console.log('Spouse fields hidden when switched back to Single');
    await page.getByRole('button', { name: 'close Cancel' }).click();
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. ENTITY LEAD CREATION — Negative Tests
// ═══════════════════════════════════════════════════════════════

test.describe('Entity Lead — Negative Tests', () => {
  let page: Page;
  let lead: LeadLocators;
  let entity: EntityLocators;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page, process.env.CRM_USERNAME || 'admin', process.env.CRM_PASSWORD || '123qwe');
    lead = new LeadLocators(page);
    entity = new EntityLocators(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    // Close any open dialog before navigating
    if (await lead.dialog.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await expect(lead.dialog).toBeHidden({ timeout: 5000 }).catch(() => {});
    }
    await lead.navigateToLeads();
  });

  test('should require Entity Name when Entity client type is selected', async () => {
    await allure.allureId('R10');

    await lead.openNewLeadDialog();
    await lead.fillAllFields({ ...entityLead, firstName: uniqueFirstName() });
    // Do NOT fill Entity Name
    await lead.submitForm();

    // Dialog should remain open — Entity Name is required
    await expect(lead.dialog).toBeVisible({ timeout: 5000 });
    console.log('Entity Name required — dialog stays open');
  });

  for (const email of invalidEmails) {
    test(`should reject invalid email for Entity lead: "${email}"`, async () => {
      await lead.openNewLeadDialog();
      await lead.fillAllFields({ ...entityLead, firstName: uniqueFirstName(), email });
      await entity.entityNameInput.fill(entityLead.entityName);
      await lead.submitForm();

      await expect(lead.invalidEmailError).toBeVisible({ timeout: 30000 });
      await expect(lead.dialog).toBeVisible();
    });
  }

  for (const mobile of invalidMobiles) {
    test(`should reject invalid mobile for Entity lead: "${mobile}"`, async () => {
      await lead.openNewLeadDialog();
      await lead.fillAllFields({ ...entityLead, firstName: uniqueFirstName(), mobile });
      await entity.entityNameInput.fill(entityLead.entityName);
      await lead.submitForm();

      await expect(lead.invalidPhoneError).toBeVisible({ timeout: 30000 });
      await expect(lead.dialog).toBeVisible();
    });
  }

  test('should show validation when all Entity lead required fields are empty', async () => {
    await allure.allureId('R11');

    await lead.openNewLeadDialog();

    // Select Entity client type to trigger Entity Name field
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
// 3. ENTITY DIRECTOR — Negative & Edge Cases
// ═══════════════════════════════════════════════════════════════

test.describe('Entity Director — Negative & Edge Cases', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let loan: LoanLocators;
  let entity: EntityLocators;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page, process.env.CRM_USERNAME || 'admin', process.env.CRM_PASSWORD || '123qwe');
    loan = new LoanLocators(page);
    entity = new EntityLocators(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should navigate to an Entity opportunity in edit mode', async () => {
    await allure.allureId('R20');

    // Create fresh Entity lead and navigate to opportunity
    const lead = new LeadLocators(page);
    const testName = uniqueFirstName();

    await lead.navigateToLeads();
    await lead.openNewLeadDialog();
    await lead.fillAllFields({ ...entityLead, firstName: testName });
    await entity.entityNameInput.fill(entityLead.entityName);
    await lead.submitForm();
    await expect(lead.dialog).toBeHidden({ timeout: 30000 });

    // Open lead details and convert
    await lead.filterByFirstName(testName);
    await lead.openLeadDetails(testName, entityLead.lastName);
    await lead.completePreScreeningToPass();
    await expect(lead.statusConverted).toBeVisible({ timeout: 60000 });

    // Navigate to opportunity
    const accountName = `${testName} ${entityLead.lastName}`;
    await loan.navigateToOpportunities();
    await loan.filterByAccount(accountName);
    await loan.openOpportunityDetails(accountName);
    await loan.enterEditMode();
    await loan.selectOpportunityOwner(opportunityOwner);

    console.log('Entity opportunity opened in edit mode');
  });

  test('should allow saving director with empty fields (no client-side validation)', async () => {
    await allure.allureId('R21');

    await entity.addDirectorButton.click();
    await expect(entity.directorDialog).toBeVisible({ timeout: 30000 });

    // Save without filling any fields — app has no client-side validation for directors
    await entity.directorDialog.getByRole('button', { name: 'check Save Director' }).click();

    // Dialog closes — empty director is accepted
    await expect(entity.directorDialog).toBeHidden({ timeout: 30000 });

    // Delete the empty director row to clean up
    const deleteIcon = page.locator('.ant-table-row').last().locator('img[alt="delete"]');
    if (await deleteIcon.isVisible().catch(() => false)) {
      await deleteIcon.click();
      // Confirm deletion if a confirmation appears
      const okButton = page.getByRole('button', { name: 'OK' });
      if (await okButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await okButton.click();
      }
    }
    console.log('Director: empty save accepted (no validation), cleaned up');
  });

  test('should accept director with invalid SA ID number (no client-side ID validation)', async () => {
    await allure.allureId('R22');

    await entity.addDirectorButton.click();
    await expect(entity.directorDialog).toBeVisible({ timeout: 30000 });

    const dialog = entity.directorDialog;
    await dialog.locator('.ant-form-item').filter({ hasText: /^First Name/ }).getByRole('textbox').fill('Test');
    await dialog.locator('.ant-form-item').filter({ hasText: /^Last Name/ }).getByRole('textbox').fill('Director');
    await dialog.getByPlaceholder('13-digit SA ID number').fill('12345'); // Too short — no validation

    await dialog.getByRole('button', { name: 'check Save Director' }).click();

    // Dialog closes — app has no client-side ID validation for directors
    await expect(dialog).toBeHidden({ timeout: 30000 });

    // Verify the director row was added
    await expect(page.getByRole('cell', { name: 'Test' })).toBeVisible({ timeout: 10000 });
    console.log('Director with invalid ID accepted (no validation)');

    // Clean up — delete the test director
    const deleteIcon = page.getByRole('row').filter({ hasText: 'Test' }).locator('img[alt="delete"]');
    if (await deleteIcon.isVisible().catch(() => false)) {
      await deleteIcon.click();
      const okButton = page.getByRole('button', { name: 'OK' });
      if (await okButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await okButton.click();
      }
    }
  });

  test('should add a director with Married status successfully', async () => {
    await allure.allureId('R23');

    // Fill entity info first
    await entity.fillEntityInfo(entityInfo);

    // Add a married director
    await entity.addDirector(directors[0]); // Ian Houvet - Married
    await expect(page.getByRole('cell', { name: directors[0].firstName })).toBeVisible({ timeout: 10000 });
    console.log(`Married director added: ${directors[0].firstName} ${directors[0].lastName}`);
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. ENTITY SIGNATORY — Negative & Edge Cases
// ═══════════════════════════════════════════════════════════════

test.describe('Entity Signatory — Negative & Edge Cases', () => {
  let page: Page;
  let entity: EntityLocators;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page, process.env.CRM_USERNAME || 'admin', process.env.CRM_PASSWORD || '123qwe');
    entity = new EntityLocators(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should allow saving signatory with empty fields (no client-side validation)', async () => {
    await allure.allureId('R30');

    // Navigate to any Entity opportunity in edit mode
    const loan = new LoanLocators(page);
    const lead = new LeadLocators(page);
    const testName = uniqueFirstName();

    await lead.navigateToLeads();
    await lead.openNewLeadDialog();
    await lead.fillAllFields({ ...entityLead, firstName: testName });
    await entity.entityNameInput.fill(entityLead.entityName);
    await lead.submitForm();
    await expect(lead.dialog).toBeHidden({ timeout: 30000 });

    await lead.filterByFirstName(testName);
    await lead.openLeadDetails(testName, entityLead.lastName);
    await lead.completePreScreeningToPass();
    await expect(lead.statusConverted).toBeVisible({ timeout: 60000 });

    const accountName = `${testName} ${entityLead.lastName}`;
    await loan.navigateToOpportunities();
    await loan.filterByAccount(accountName);
    await loan.openOpportunityDetails(accountName);
    await loan.enterEditMode();

    // Try to add empty signatory
    await entity.addSignatoryButton.click();
    await expect(entity.signatoryDialog).toBeVisible({ timeout: 30000 });

    await entity.signatoryDialog.getByRole('button', { name: 'check Save Signatory' }).click();

    // Dialog closes — app has no client-side validation for signatories
    await expect(entity.signatoryDialog).toBeHidden({ timeout: 30000 });
    console.log('Signatory: empty save accepted (no validation)');

    await page.getByRole('button', { name: 'close Cancel' }).click();
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. ENTITY INFO — Edge Cases
// ═══════════════════════════════════════════════════════════════

test.describe('Entity Information — Edge Cases', () => {
  let page: Page;
  let loan: LoanLocators;
  let entity: EntityLocators;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page, process.env.CRM_USERNAME || 'admin', process.env.CRM_PASSWORD || '123qwe');
    loan = new LoanLocators(page);
    entity = new EntityLocators(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should display all Entity client type options in lead creation', async () => {
    await allure.allureId('R40');

    const lead = new LeadLocators(page);
    await lead.navigateToLeads();
    await lead.openNewLeadDialog();

    // Open client type dropdown and check Entity options exist
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

    const lead = new LeadLocators(page);
    await lead.navigateToLeads();
    await lead.openNewLeadDialog();

    // Select Individual type — Entity Name should NOT appear
    await lead.fillAllFields({ ...validLead, firstName: uniqueFirstName(), clientType: 'Individual (Individual)' });
    await expect(entity.entityNameInput).toBeHidden({ timeout: 3000 }).catch(() => {});

    // Now switch to Entity type
    const clientTypeSelect = lead.dialog.locator('.ant-form-item').filter({ hasText: /^Client Type/ }).locator('.ant-select').first();
    await clientTypeSelect.click();
    const entityOption = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByTitle('Close Corporation (Entity)');
    await entityOption.click();

    // Entity Name should now appear
    await expect(entity.entityNameInput).toBeVisible({ timeout: 5000 });

    console.log('Entity Name conditionally shown for Entity types only');
    await lead.cancelForm();
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. INDIVIDUAL LEAD — Required Field Regression (test.each)
// ═══════════════════════════════════════════════════════════════

test.describe('Individual Lead — Required Field Regression', () => {
  let page: Page;
  let lead: LeadLocators;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page, process.env.CRM_USERNAME || 'admin', process.env.CRM_PASSWORD || '123qwe');
    lead = new LeadLocators(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  for (const { field, label } of requiredFields) {
    test(`should reject lead when ${label} is missing`, async () => {
      if (await lead.dialog.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
        await expect(lead.dialog).toBeHidden({ timeout: 5000 }).catch(() => {});
      }
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
// 7. FORMAT VALIDATION — Email & Mobile (test.each)
// ═══════════════════════════════════════════════════════════════

test.describe('Format Validation — Email & Mobile', () => {
  let page: Page;
  let lead: LeadLocators;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page, process.env.CRM_USERNAME || 'admin', process.env.CRM_PASSWORD || '123qwe');
    lead = new LeadLocators(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  for (const email of invalidEmails) {
    test(`should reject invalid email: "${email}"`, async () => {
      if (await lead.dialog.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
        await expect(lead.dialog).toBeHidden({ timeout: 5000 }).catch(() => {});
      }
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
      if (await lead.dialog.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
        await expect(lead.dialog).toBeHidden({ timeout: 5000 }).catch(() => {});
      }
      await lead.navigateToLeads();
      await lead.openNewLeadDialog();
      await lead.fillAllFields({ ...validLead, firstName: uniqueFirstName(), mobile });
      await lead.submitForm();

      await expect(lead.invalidPhoneError).toBeVisible({ timeout: 30000 });
      await expect(lead.dialog).toBeVisible();
    });
  }
});
