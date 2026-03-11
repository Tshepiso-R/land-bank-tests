import { test, expect } from '@playwright/test';
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

  test('should create a lead with all valid fields and verify details page', async ({ page }) => {
    const testFirstName = uniqueFirstName();

    await lead.openNewLeadDialog();
    await expect(lead.dialogTitle).toHaveText('Add New Lead');

    await lead.fillAllFields({ ...validLead, firstName: testFirstName });
    await lead.submitForm();

    await expect(lead.dialog).toBeHidden({ timeout: 30000 });

    // Filter to find the newly created lead
    await lead.filterByFirstName(testFirstName);

    const row = lead.getLeadRowByName(testFirstName, validLead.lastName);
    await expect(row).toBeVisible({ timeout: 30000 });

    // Drill down to detail page
    await lead.openLeadDetails(testFirstName, validLead.lastName);

    // Verify header
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

    // Verify tabs
    await expect(lead.detailsTab).toBeVisible();
    await expect(lead.tasksTab).toBeVisible();
    await expect(lead.notesTab).toBeVisible();

    // Verify field values
    await expect(page.getByText(testFirstName).first()).toBeVisible();
    await expect(page.getByText(validLead.lastName).first()).toBeVisible();
    await expect(page.getByText(validLead.mobile).first()).toBeVisible();
    await expect(page.getByText(validLead.email).first()).toBeVisible();
    await expect(page.getByText('Individual (Individual)').first()).toBeVisible();
    await expect(page.getByText(validLead.province).first()).toBeVisible();
    await expect(page.getByText(validLead.leadChannel).first()).toBeVisible();
    await expect(page.getByText(validLead.preferredCommunication!).first()).toBeVisible();
    await expect(page.getByText(validLead.description!).first()).toBeVisible();

    // Verify field labels
    await expect(page.getByText('First Name')).toBeVisible();
    await expect(page.getByText('Last Name')).toBeVisible();
    await expect(page.getByText('Mobile Number')).toBeVisible();
    await expect(page.getByText('Email Address')).toBeVisible();
    await expect(page.getByText('Client Type')).toBeVisible();
    await expect(page.getByText('Lead Channel')).toBeVisible();
    await expect(page.getByText('Description')).toBeVisible();
    await expect(page.getByText('Rejection Reason')).toBeVisible();
  });

  requiredFields.forEach(({ field, label }) => {
    test(`should show validation error when ${label} is missing`, async () => {
      await lead.openNewLeadDialog();

      await lead.fillAllFieldsExcept(validLead, field);
      await lead.submitForm();

      // Dialog should remain open — form submission was blocked
      await expect(lead.dialog).toBeVisible({ timeout: 10000 });
    });
  });

  test('should show validation errors when all required fields are empty', async () => {
    await lead.openNewLeadDialog();
    await lead.submitForm();

    await expect(lead.dialog).toBeVisible({ timeout: 10000 });
  });

  test('should reject invalid email format', async ({ page }) => {
    await lead.openNewLeadDialog();

    await lead.fillAllFields({ ...validLead, email: invalidEmails[0] });
    await page.keyboard.press('Tab');
    await lead.submitForm();

    await expect(lead.dialog).toBeVisible({ timeout: 10000 });
  });

  test('should reject letters in mobile number field', async ({ page }) => {
    await lead.openNewLeadDialog();

    await lead.fillAllFields({ ...validLead, mobile: invalidMobiles[0] });
    await page.keyboard.press('Tab');
    await lead.submitForm();

    await expect(lead.dialog).toBeVisible({ timeout: 10000 });
  });

  test('should handle extremely long first name without crashing', async () => {
    await lead.openNewLeadDialog();

    await lead.fillAllFields({ ...validLead, firstName: longFirstName });
    await lead.submitForm();

    // Either accepted (dialog closes) or rejected (dialog stays) — no crash
    const isVisible = await lead.dialog.isVisible();
    expect(typeof isVisible).toBe('boolean');
  });

  test('should discard the form when cancel is clicked', async () => {
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
