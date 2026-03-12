import { test, expect, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { login } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { LoanLocators } from './utils/locators/loanLocators';
import { validLead, uniqueFirstName, clientInfoDetails, loanInfo, farmData } from './utils/testData';

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

  test('should fill all Client Info fields and save', async () => {
    await allure.allureId('037');

    await loan.enterEditMode();

    // Wait for form to fully load with existing data
    await expect(loan.clientNameInput).toBeVisible({ timeout: 30000 });
    await expect(loan.clientNameInput).not.toHaveValue('', { timeout: 10000 });

    // Fill all Client Info fields (including blank ones)
    await loan.fillClientInfo(clientInfoDetails);

    // Save and verify
    await loan.save();

    // Verify saved values in read-only mode
    await expect(loan.page.getByText(clientInfoDetails.idNumber)).toBeVisible();
    await expect(loan.page.getByText(clientInfoDetails.countryOfResidence!).first()).toBeVisible();
  });

  test('should fill Loan Info fields and save', async () => {
    await allure.allureId('038');

    await loan.enterEditMode();
    await loan.loanInfoTab.click();
    await expect(loan.loanInfoPanel).toBeVisible();

    await loan.fillLoanInfo(loanInfo);

    // Verify the summary was filled
    await expect(loan.businessSummaryTextarea).toHaveValue(loanInfo.summary);

    // Save and verify
    await loan.save();

    // Verify saved values in read-only mode on Loan Info tab
    await loan.loanInfoTab.click();
    await expect(loan.page.getByText(loanInfo.summary)).toBeVisible();
  });

  test('should add a farm with details and save', async () => {
    await allure.allureId('039');

    await loan.enterEditMode();
    await loan.farmsTab.click();

    await loan.addFarm(farmData);

    // Farm dialog should close after submission
    await expect(loan.createFarmDialog).toBeHidden({ timeout: 30000 });

    // Save and verify
    await loan.save();

    // Verify the farm appears in Farms tab
    await loan.farmsTab.click();
    await expect(loan.page.getByText(farmData.name, { exact: true }).first()).toBeVisible();
  });

  test('should initiate the loan application', async () => {
    await allure.allureId('040');

    await loan.initiateLoanApplication();

    // After initiation the status should no longer be Draft
    await expect(loan.page.getByText('Draft')).toBeHidden();
  });

  test('should verify edit and cancel workflow', async () => {
    await allure.allureId('041');

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
