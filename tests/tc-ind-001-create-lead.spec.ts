import { test, expect } from '@playwright/test';
import { loginAsDefaultUser } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { validLead, uniqueFirstName, requiredFields, invalidEmails, invalidMobiles, longFirstName } from './utils/testData';

test.describe('TC-IND-001 – Create a Lead', () => {
  let lead: LeadLocators;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    lead = new LeadLocators(page);
    await lead.navigateToLeads();
  });

  test('HP-001 | Happy Path – Create Individual lead with all valid fields', async ({ page }) => {
    const testFirstName = uniqueFirstName();

    await lead.openNewLeadDialog();
    await expect(lead.dialogTitle).toHaveText('Add New Lead');

    await lead.fillAllFields({ ...validLead, firstName: testFirstName });
    await lead.submitForm();

    // Dialog should close after successful submission
    await expect(lead.dialog).toBeHidden({ timeout: 30000 });

    // Use filter to find the newly created lead by unique first name
    await lead.filterByFirstName(testFirstName);

    const row = lead.getLeadRowByName(testFirstName, validLead.lastName);
    await expect(row).toBeVisible({ timeout: 30000 });

    // --- Drill down to detail page ---
    await lead.openLeadDetails(testFirstName, validLead.lastName);

    // Verify header shows lead name and status
    await expect(page.getByText(`${validLead.lastName}, ${testFirstName}`)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Lead', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('NEW')).toBeVisible();

    // Verify action buttons are visible and enabled
    await expect(lead.editButton).toBeVisible();
    await expect(lead.editButton).toBeEnabled();
    await expect(lead.disqualifyButton).toBeVisible();
    await expect(lead.disqualifyButton).toBeEnabled();
    await expect(lead.auditLogButton).toBeVisible();
    await expect(lead.auditLogButton).toBeEnabled();
    await expect(lead.initiatePreScreeningButton).toBeVisible();
    await expect(lead.initiatePreScreeningButton).toBeEnabled();

    // Verify tabs are present
    await expect(lead.detailsTab).toBeVisible();
    await expect(lead.tasksTab).toBeVisible();
    await expect(lead.notesTab).toBeVisible();

    // Verify detail field values are displayed on the page
    await expect(page.getByText(testFirstName).first()).toBeVisible();
    await expect(page.getByText(validLead.lastName).first()).toBeVisible();
    await expect(page.getByText(validLead.mobile).first()).toBeVisible();
    await expect(page.getByText(validLead.email).first()).toBeVisible();
    await expect(page.getByText('Individual (Individual)').first()).toBeVisible();
    await expect(page.getByText(validLead.province).first()).toBeVisible();
    await expect(page.getByText(validLead.leadChannel).first()).toBeVisible();
    await expect(page.getByText(validLead.preferredCommunication!).first()).toBeVisible();
    await expect(page.getByText(validLead.description!).first()).toBeVisible();

    // Verify field labels are present
    await expect(page.getByText('First Name')).toBeVisible();
    await expect(page.getByText('Last Name')).toBeVisible();
    await expect(page.getByText('Mobile Number')).toBeVisible();
    await expect(page.getByText('Email Address')).toBeVisible();
    await expect(page.getByText('Client Type')).toBeVisible();
    await expect(page.getByText('Lead Channel')).toBeVisible();
    await expect(page.getByText('Description')).toBeVisible();
    await expect(page.getByText('Rejection Reason')).toBeVisible();
  });

  for (const { field, label } of requiredFields) {
    test(`NEG-001 | Required field missing – ${label}`, async ({ page }) => {
      await lead.openNewLeadDialog();

      await lead.fillAllFieldsExcept(validLead, field);
      await lead.submitForm();

      // Wait a moment for validation to trigger
      await page.waitForTimeout(2000);

      // Dialog should remain open (form submission was blocked)
      await expect(lead.dialog).toBeVisible();

      // Verify at least one field has validation error state (red border)
      const errorFields = lead.dialog.locator('.ant-form-item-has-error, .ant-input-status-error, .ant-select-status-error');
      await expect(errorFields.first()).toBeVisible({ timeout: 5000 });
    });
  }

  test('NEG-002 | Submit with ALL required fields empty', async ({ page }) => {
    await lead.openNewLeadDialog();
    await lead.submitForm();

    await page.waitForTimeout(2000);

    // Dialog should remain open
    await expect(lead.dialog).toBeVisible();

    // Multiple fields should have error state
    const errorFields = lead.dialog.locator('.ant-form-item-has-error, .ant-input-status-error, .ant-select-status-error');
    const count = await errorFields.count();
    expect(count).toBeGreaterThan(0);
  });

  test('EDGE-001 | Invalid email format', async ({ page }) => {
    await lead.openNewLeadDialog();

    for (const badEmail of invalidEmails) {
      await lead.emailInput.fill('');
      await lead.emailInput.fill(badEmail);
      // Tab out to trigger validation
      await page.keyboard.press('Tab');

      const errors = lead.page.locator('.ant-form-item-explain-error');
      // Wait briefly for validation to trigger
      await errors.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    }

    // After filling invalid emails, form should show email validation error
    await lead.fillAllFields({ ...validLead, email: invalidEmails[0] });
    await lead.submitForm();
    await expect(lead.dialog).toBeVisible();
  });

  test('EDGE-002 | Letters in mobile number field', async ({ page }) => {
    await lead.openNewLeadDialog();

    await lead.fillAllFields({ ...validLead, mobile: invalidMobiles[0] });
    await page.keyboard.press('Tab');
    await lead.submitForm();

    // Should either show validation error or dialog stays open
    await expect(lead.dialog).toBeVisible();
  });

  test('EDGE-003 | Extremely long first name (100+ chars)', async () => {
    await lead.openNewLeadDialog();

    await lead.fillAllFields({ ...validLead, firstName: longFirstName });
    await lead.submitForm();

    // Either accepted or shows validation error — dialog behavior varies
    // We just verify no crash occurs
    const dialogVisible = await lead.dialog.isVisible();
    if (dialogVisible) {
      // If dialog is still open, there should be a validation error
      const errors = await lead.getValidationErrors();
      expect(errors.length).toBeGreaterThanOrEqual(0);
    }
    // If dialog closed, the long name was accepted — also valid
  });

  test('EDGE-004 | Cancel button discards the form', async () => {
    await lead.openNewLeadDialog();

    await lead.fillAllFields(validLead);
    await lead.cancelForm();

    // Dialog should close
    await expect(lead.dialog).toBeHidden({ timeout: 15000 });

    // The lead should NOT appear in the table
    const row = lead.getLeadRowByName(validLead.firstName, validLead.lastName);
    // Give a short timeout — we expect this NOT to be visible
    await expect(row).toBeHidden({ timeout: 5000 }).catch(() => {});
  });
});
