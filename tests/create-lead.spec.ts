import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { loginAsDefaultUser } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { validLead, uniqueFirstName, requiredFields, invalidEmails, invalidMobiles } from './utils/testData';

test.describe('Create a Lead', () => {
  let lead: LeadLocators;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    lead = new LeadLocators(page);
    await lead.navigateToLeads();
  });

  test.describe('1 - Happy Path', () => {
    test('should create a lead with all valid fields and verify details page', async () => {
      await allure.allureId('014');
      const testFirstName = uniqueFirstName();

      await lead.openNewLeadDialog();
      await expect(lead.dialogTitle).toHaveText('Add New Lead');

      await lead.fillAllFields({ ...validLead, firstName: testFirstName });
      await lead.submitForm();

      await expect(lead.dialog).toBeHidden({ timeout: 60000 });

      // Reload and filter to find the newly created lead
      await lead.page.reload({ waitUntil: 'networkidle' });
      await expect(lead.tableHeaderRow).toBeVisible({ timeout: 60000 });
      await lead.filterByFirstName(testFirstName);

      const row = lead.getLeadRowByName(testFirstName, validLead.lastName);
      await expect(row).toBeVisible({ timeout: 60000 });

      // Drill down to detail page
      await lead.openLeadDetails(testFirstName, validLead.lastName);

      // Verify header
      await expect(lead.detailHeadingName(validLead.lastName, testFirstName)).toBeVisible({ timeout: 30000 });
      await expect(lead.detailHeading).toBeVisible();
      await expect(lead.statusNew).toBeVisible();

      // Verify action buttons are visible and enabled
      await expect(lead.editButton).toBeVisible();
      await expect(lead.editButton).toBeEnabled();
      await expect(lead.disqualifyButton).toBeVisible();
      await expect(lead.disqualifyButton).toBeEnabled();
      await expect(lead.auditLogButton).toBeVisible();
      await expect(lead.auditLogButton).toBeEnabled();
      await expect(lead.initiatePreScreeningButton).toBeVisible();
      await expect(lead.initiatePreScreeningButton).toBeEnabled();

      // Verify tabs
      await expect(lead.detailsTab).toBeVisible();
      await expect(lead.tasksTab).toBeVisible();
      await expect(lead.notesTab).toBeVisible();

      // Verify field values
      await expect(lead.detailFieldValue(testFirstName)).toBeVisible();
      await expect(lead.detailFieldValue(validLead.lastName)).toBeVisible();
      await expect(lead.detailFieldValue(validLead.mobile)).toBeVisible();
      await expect(lead.detailFieldValue(validLead.email)).toBeVisible();
      await expect(lead.detailFieldValue(validLead.clientType)).toBeVisible();
      await expect(lead.detailFieldValue(validLead.province)).toBeVisible();
      await expect(lead.detailFieldValue(validLead.leadChannel)).toBeVisible();
      await expect(lead.detailFieldValue(validLead.preferredCommunication!)).toBeVisible();
      await expect(lead.detailFieldValue(validLead.description!)).toBeVisible();
    });
  });

  test.describe('2 - Required Field Validation', () => {
    test('should show validation errors when all required fields are empty', async () => {
      await allure.allureId('015');
      await lead.openNewLeadDialog();

      // Touch a field and clear it to ensure client-side validation triggers
      await lead.firstNameInput.click();
      await lead.firstNameInput.blur();
      await lead.submitForm();

      // Wait for validation errors to appear
      await expect(lead.requiredFieldErrors.first()).toBeVisible({ timeout: 60000 });

      // Dialog stays open
      await expect(lead.dialog).toBeVisible();

      // All 9 required fields should show "This field is required"
      await expect(lead.requiredFieldErrors).toHaveCount(9);

      // Mobile and Email also show format errors
      await expect(lead.invalidPhoneError).toBeVisible();
      await expect(lead.invalidEmailError).toBeVisible();
    });

    for (const [i, { field, label }] of requiredFields.entries()) {
      test(`should show validation error when ${label} is missing`, async () => {
        await allure.allureId(String(16 + i).padStart(3, '0'));
        await lead.openNewLeadDialog();

        await lead.fillAllFieldsExcept(validLead, field);
        await lead.submitForm();

        // Wait for validation error to appear
        await expect(lead.requiredFieldErrors.first()).toBeVisible({ timeout: 30000 });

        // Dialog stays open
        await expect(lead.dialog).toBeVisible();
      });
    }
  });

  test.describe('3 - Format Validation', () => {
    for (const [i, email] of invalidEmails.entries()) {
      test(`should reject invalid email: "${email}"`, async () => {
        await allure.allureId(String(25 + i).padStart(3, '0'));
        await lead.openNewLeadDialog();

        await lead.fillAllFields({ ...validLead, email });
        await lead.submitForm();

        // Dialog stays open with email validation error
        await expect(lead.invalidEmailError).toBeVisible({ timeout: 30000 });
        await expect(lead.dialog).toBeVisible();
      });
    }

    for (const [i, mobile] of invalidMobiles.entries()) {
      test(`should reject invalid mobile: "${mobile}"`, async () => {
        await allure.allureId(String(29 + i).padStart(3, '0'));
        await lead.openNewLeadDialog();

        await lead.fillAllFields({ ...validLead, mobile });
        await lead.submitForm();

        // Dialog stays open with phone validation error
        await expect(lead.invalidPhoneError).toBeVisible({ timeout: 30000 });
        await expect(lead.dialog).toBeVisible();
      });
    }
  });

  test.describe('4 - Cancel Workflow', () => {
    test('should discard the form when cancel is clicked', async () => {
      await allure.allureId('032');
      const testFirstName = uniqueFirstName();

      await lead.openNewLeadDialog();
      await lead.fillAllFields({ ...validLead, firstName: testFirstName });
      await lead.cancelForm();

      // Dialog should close
      await expect(lead.dialog).toBeHidden({ timeout: 15000 });

      // Lead should not exist in the table
      await lead.filterByFirstName(testFirstName);
      const row = lead.getLeadRowByName(testFirstName, validLead.lastName);
      await expect(row).toBeHidden({ timeout: 10000 });
    });
  });
});
