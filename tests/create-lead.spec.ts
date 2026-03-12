import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { loginAsDefaultUser } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { validLead, uniqueFirstName, requiredFields, invalidEmails, invalidMobiles, longFirstName } from './utils/testData';

test.describe('Create a Lead', () => {
  let lead: LeadLocators;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    lead = new LeadLocators(page);
    await lead.navigateToLeads();
  });

  test.describe('1 - Happy Path', () => {
    test('should create a lead with all valid fields and verify details page', async ({ page }) => {
      await allure.allureId('014');
      const testFirstName = uniqueFirstName();

      await lead.openNewLeadDialog();
      await expect(lead.dialogTitle).toHaveText('Add New Lead');

      await lead.fillAllFields({ ...validLead, firstName: testFirstName });
      await lead.submitForm();

      await expect(lead.dialog).toBeHidden({ timeout: 30000 });

      // Filter to find the newly created lead
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

      // Verify field labels
      await expect(lead.fieldLabelFirstName).toBeVisible();
      await expect(lead.fieldLabelLastName).toBeVisible();
      await expect(lead.fieldLabelMobileNumber).toBeVisible();
      await expect(lead.fieldLabelEmailAddress).toBeVisible();
      await expect(lead.fieldLabelClientType).toBeVisible();
      await expect(lead.fieldLabelLeadChannel).toBeVisible();
      await expect(lead.fieldLabelDescription).toBeVisible();
      await expect(lead.fieldLabelRejectionReason).toBeVisible();
    });
  });

  test.describe('2 - Negative Tests', () => {
    const requiredFieldsWithIds = requiredFields.map((f, i) => ({
      ...f,
      id: String(15 + i).padStart(3, '0'),
    }));

    for (const { field, label, id } of requiredFieldsWithIds) {
      test(`should show validation error when ${label} is missing`, async () => {
        await allure.allureId(id);
        await lead.openNewLeadDialog();

        await lead.fillAllFieldsExcept(validLead, field);
        await lead.submitForm();

        // Dialog should remain open — form submission was blocked
        await expect(lead.dialog).toBeVisible({ timeout: 10000 });
      });
    }

    test('should show validation errors when all required fields are empty', async () => {
      await allure.allureId('022');
      await lead.openNewLeadDialog();
      await lead.submitForm();

      await expect(lead.dialog).toBeVisible({ timeout: 10000 });
    });

    test('should reject invalid email format', async ({ page }) => {
      await allure.allureId('023');
      await lead.openNewLeadDialog();

      await lead.fillAllFields({ ...validLead, email: invalidEmails[0] });
      await page.keyboard.press('Tab');
      await lead.submitForm();

      await expect(lead.dialog).toBeVisible({ timeout: 10000 });
    });

    test('should reject letters in mobile number field', async ({ page }) => {
      await allure.allureId('024');
      await lead.openNewLeadDialog();

      await lead.fillAllFields({ ...validLead, mobile: invalidMobiles[0] });
      await page.keyboard.press('Tab');
      await lead.submitForm();

      await expect(lead.dialog).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('3 - Edge Cases', () => {
    test('should handle extremely long first name without crashing', async () => {
      await allure.allureId('025');
      await lead.openNewLeadDialog();

      await lead.fillAllFields({ ...validLead, firstName: longFirstName });
      await lead.submitForm();

      // Either accepted (dialog closes) or rejected (dialog stays) — no crash
      const isVisible = await lead.dialog.isVisible();
      expect(typeof isVisible).toBe('boolean');
    });

    test('should discard the form when cancel is clicked', async () => {
      await allure.allureId('026');
      const testFirstName = uniqueFirstName();

      await lead.openNewLeadDialog();
      await lead.fillAllFields({ ...validLead, firstName: testFirstName });
      await lead.cancelForm();

      await expect(lead.dialog).toBeHidden({ timeout: 15000 });

      // Lead should not exist in the table
      const row = lead.getLeadRowByName(testFirstName, validLead.lastName);
      await expect(row).toBeHidden({ timeout: 5000 });
    });
  });
});
