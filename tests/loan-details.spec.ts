import { test, expect, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { login } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { LoanLocators } from './utils/locators/loanLocators';
import { validLead, uniqueFirstName, clientInfoDetails, loanInfo, farmData, opportunityOwner } from './utils/testData';

test.describe('Loan Details Workflow', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let lead: LeadLocators;
  let loan: LoanLocators;
  let testFirstName: string;
  let accountName: string;

  test.beforeAll(async ({ browser }) => {
    testFirstName = uniqueFirstName();
    accountName = `${testFirstName} ${validLead.lastName}`;
    page = await browser.newPage();
    const username = process.env.CRM_USERNAME || 'promise';
    const password = process.env.CRM_PASSWORD || '123qwe';
    await login(page, username, password);
    lead = new LeadLocators(page);
    loan = new LoanLocators(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should create a lead and convert it via pre-screening', async () => {
    await allure.allureId('035');

    // Create lead
    await lead.navigateToLeads();
    await lead.openNewLeadDialog();
    await lead.fillAllFields({ ...validLead, firstName: testFirstName });
    await lead.submitForm();
    await expect(lead.dialog).toBeHidden({ timeout: 30000 });

    // Filter and open detail
    await lead.filterByFirstName(testFirstName);
    const row = lead.getLeadRowByName(testFirstName, validLead.lastName);
    await expect(row).toBeVisible({ timeout: 60000 });
    await lead.openLeadDetails(testFirstName, validLead.lastName);

    // Pre-screen to convert
    await lead.completePreScreeningToPass();
    await expect(lead.statusConverted).toBeVisible({ timeout: 60000 });
    await expect(lead.convertedToOpportunityLink).toBeVisible();
  });

  test('should navigate to the new Opportunity and display all tabs', async () => {
    await allure.allureId('036');

    await loan.navigateToOpportunities();
    await loan.filterByAccount(accountName);
    const row = loan.getOpportunityRowByAccount(accountName);
    await expect(row).toBeVisible({ timeout: 60000 });
    await loan.openOpportunityDetails(accountName);

    // Verify Draft status and Initiate button
    await expect(loan.initiateLoanApplicationButton).toBeVisible();

    // Verify top-level tabs
    await expect(loan.loanApplicationDetailsTab).toBeVisible();
    await expect(loan.tasksTab).toBeVisible();
    await expect(loan.notesTab).toBeVisible();

    // Verify sub-tabs under Loan Application Details
    await expect(loan.clientInfoTab).toBeVisible();
    await expect(loan.loanInfoTab).toBeVisible();
    await expect(loan.farmsTab).toBeVisible();
  });

  test('should fill all opportunity details and save', async () => {
    await allure.allureId('037');

    await loan.enterEditMode();

    // Fill Opportunity Owner in header section
    await loan.selectOpportunityOwner(opportunityOwner);

    // Client Info tab
    await expect(loan.clientNameInput).toBeVisible({ timeout: 30000 });
    await expect(loan.clientNameInput).not.toHaveValue('', { timeout: 10000 });
    await loan.fillClientInfo(clientInfoDetails);

    // Loan Info tab
    await loan.loanInfoTab.click();
    await expect(loan.loanInfoPanel).toBeVisible();
    await loan.fillLoanInfo(loanInfo);

    // Farms tab
    await loan.farmsTab.click();
    await loan.addFarm(farmData);
    await expect(loan.createFarmDialog).toBeHidden({ timeout: 30000 });

    // Save once
    await loan.save();

    // Verify saved values across all tabs
    await loan.clientInfoTab.click();
    await expect(loan.page.getByText(clientInfoDetails.idNumber)).toBeVisible();
    await expect(loan.page.getByText(clientInfoDetails.countryOfResidence!).first()).toBeVisible();

    await loan.loanInfoTab.click();
    await expect(loan.page.getByText(loanInfo.summary)).toBeVisible();

    await loan.farmsTab.click();
    await expect(loan.page.getByText(farmData.name, { exact: true }).first()).toBeVisible();
  });

  test('should initiate the loan application', async () => {
    await allure.allureId('038');

    await loan.initiateLoanApplication();

    // Verify status changed and toast appeared
    await expect(loan.statusConsentPending).toBeVisible();
    await expect(loan.loanSubmittedToast).toBeVisible();
  });

  test('should verify edit and cancel workflow', async () => {
    await allure.allureId('039');

    // Verify read-only mode shows Edit button
    await expect(loan.editButton).toBeVisible();

    await loan.enterEditMode();

    // Verify edit mode shows Save and Cancel
    await expect(loan.saveButton).toBeVisible();
    await expect(loan.cancelButton).toBeVisible();

    // Cancel returns to read-only mode
    await loan.cancelButton.click();
    await expect(loan.editButton).toBeVisible({ timeout: 30000 });
  });
});
