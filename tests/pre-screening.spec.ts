import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { loginAsDefaultUser } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { validLead, uniqueFirstName, convertedLead } from './utils/testData';

test.describe('Pre-Screening', () => {
  let lead: LeadLocators;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    lead = new LeadLocators(page);
  });

  test.describe('1 - New Lead Detail Page', () => {
    let testFirstName: string;

    test.beforeEach(async () => {
      // Create a fresh lead and navigate to its detail page
      testFirstName = uniqueFirstName();
      await lead.navigateToLeads();
      await lead.openNewLeadDialog();
      await lead.fillAllFields({ ...validLead, firstName: testFirstName });
      await lead.submitForm();
      await expect(lead.dialog).toBeHidden({ timeout: 30000 });

      // Filter and open the detail page
      await lead.filterByFirstName(testFirstName);
      const row = lead.getLeadRowByName(testFirstName, validLead.lastName);
      await expect(row).toBeVisible({ timeout: 60000 });
      await lead.openLeadDetails(testFirstName, validLead.lastName);
    });

    test('should display Initiate Pre-Screening button on a New lead', async () => {
      await allure.allureId('027');

      await expect(lead.initiatePreScreeningButton).toBeVisible();
      await expect(lead.initiatePreScreeningButton).toBeEnabled();

      // Status should be NEW
      await expect(lead.statusNew).toBeVisible();

      // Assessment column should be empty for a New lead
      await expect(lead.assessmentPassed).toBeHidden();
      await expect(lead.assessmentFailed).toBeHidden();
    });

    test('should show all action buttons on a New lead', async () => {
      await allure.allureId('028');

      await expect(lead.editButton).toBeVisible();
      await expect(lead.editButton).toBeEnabled();
      await expect(lead.disqualifyButton).toBeVisible();
      await expect(lead.disqualifyButton).toBeEnabled();
      await expect(lead.auditLogButton).toBeVisible();
      await expect(lead.auditLogButton).toBeEnabled();
      await expect(lead.initiatePreScreeningButton).toBeVisible();
      await expect(lead.initiatePreScreeningButton).toBeEnabled();
    });
  });

  test.describe('2 - Converted Lead Detail Page', () => {
    test.beforeEach(async () => {
      // Navigate to an existing Converted/Passed lead to avoid creating new data
      await lead.navigateToLeads();
      await lead.filterByFirstName(convertedLead.firstName);
      const row = lead.getLeadRowByName(convertedLead.firstName, convertedLead.lastName);
      await expect(row).toBeVisible({ timeout: 30000 });
      await lead.openLeadDetails(convertedLead.firstName, convertedLead.lastName);
    });

    test('should show Converted status and Passed assessment', async () => {
      await allure.allureId('029');

      await expect(lead.statusConverted).toBeVisible({ timeout: 30000 });
      await expect(lead.assessmentPassed).toBeVisible();
    });

    test('should only show Audit Log button on a Converted lead', async () => {
      await allure.allureId('030');

      await expect(lead.auditLogButton).toBeVisible();
      await expect(lead.auditLogButton).toBeEnabled();

      // These buttons should NOT be visible on a Converted lead
      await expect(lead.editButton).toBeHidden();
      await expect(lead.disqualifyButton).toBeHidden();
      await expect(lead.initiatePreScreeningButton).toBeHidden();
    });

    test('should display Converted To section with Opportunity and Account links', async () => {
      await allure.allureId('031');

      await expect(lead.convertedToHeading).toBeVisible();
      await expect(lead.convertedToOpportunityLink).toBeVisible();
      await expect(lead.convertedToAccountLink).toBeVisible();
    });

    test('should have valid Opportunity link in Converted To section', async ({ page }) => {
      await allure.allureId('032');

      const opportunityLink = lead.convertedToOpportunityLink;
      await expect(opportunityLink).toBeVisible();

      const href = await opportunityLink.getAttribute('href');
      expect(href).toContain('/dynamic/LandBank.Crm/LBOpportunity-details?id=');
    });

    test('should have valid Account link in Converted To section', async ({ page }) => {
      await allure.allureId('033');

      const accountLink = lead.convertedToAccountLink;
      await expect(accountLink).toBeVisible();

      const href = await accountLink.getAttribute('href');
      expect(href).toContain('/dynamic/LandBank.Crm/LBAccount-details?id=');
    });

    test('should still display Details, Tasks, and Notes tabs', async () => {
      await allure.allureId('034');

      await expect(lead.detailsTab).toBeVisible();
      await expect(lead.tasksTab).toBeVisible();
      await expect(lead.notesTab).toBeVisible();
    });
  });
});
