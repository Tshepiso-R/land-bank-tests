import { test, expect, Browser, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { login } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { LoanLocators } from './utils/locators/loanLocators';
import { validLead, uniqueFirstName, clientInfoDetails, loanInfo, farmData, opportunityOwner } from './utils/testData';

test.describe('Smoke Tests — Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let lead: LeadLocators;
  let loan: LoanLocators;
  let testFirstName: string;

  test.beforeAll(async ({ browser }) => {
    testFirstName = uniqueFirstName();
    // Single login session shared across all tests
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

  test('should login and display the dashboard', async () => {
    await allure.allureId('S01');

    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Promise Raganya')).toBeVisible();
    console.log(`Dashboard: ${page.url()}`);
  });

  test('should navigate to Leads via sidebar', async () => {
    await allure.allureId('S02');

    await lead.navigateToLeads();
    await expect(lead.allLeadsHeading).toBeVisible();
    await expect(lead.tableHeaderRow).toBeVisible();
  });

  test('should create a new lead with valid data', async () => {
    await allure.allureId('S03');

    await lead.openNewLeadDialog();
    await expect(lead.dialogTitle).toHaveText('Add New Lead');

    await lead.fillAllFields({ ...validLead, firstName: testFirstName });
    await lead.submitForm();
    await expect(lead.dialog).toBeHidden({ timeout: 30000 });

    // Verify the lead appears in the table
    await lead.filterByFirstName(testFirstName);
    const row = lead.getLeadRowByName(testFirstName, validLead.lastName);
    await expect(row).toBeVisible({ timeout: 60000 });
  });

  test('should open lead details and verify NEW status', async () => {
    await allure.allureId('S04');

    await lead.openLeadDetails(testFirstName, validLead.lastName);

    await expect(lead.detailHeading).toBeVisible({ timeout: 30000 });
    await expect(lead.statusNew).toBeVisible();
    await expect(lead.editButton).toBeVisible();
    await expect(lead.initiatePreScreeningButton).toBeVisible();
    console.log(`Lead: ${page.url()}`);
  });

  test('should complete pre-screening and convert the lead', async () => {
    await allure.allureId('S05');

    // Lead detail page is still open from S04
    await lead.completePreScreeningToPass();

    await expect(lead.statusConverted).toBeVisible({ timeout: 60000 });
    await expect(lead.assessmentPassed).toBeVisible();
    await expect(lead.convertedToOpportunityLink).toBeVisible();
    await expect(lead.convertedToAccountLink).toBeVisible();
    console.log(`Lead converted — Account: ${testFirstName} ${validLead.lastName}`);
  });

  test('should navigate to the new Opportunity', async () => {
    await allure.allureId('S06');

    const accountName = `${testFirstName} ${validLead.lastName}`;
    await loan.navigateToOpportunities();
    await loan.filterByAccount(accountName);
    const row = loan.getOpportunityRowByAccount(accountName);
    await expect(row).toBeVisible({ timeout: 60000 });
  });

  test('should open Opportunity detail and verify Draft status', async () => {
    await allure.allureId('S07');

    const accountName = `${testFirstName} ${validLead.lastName}`;
    await loan.openOpportunityDetails(accountName);

    // Verify Draft status and Initiate button on fresh opportunity
    await expect(loan.initiateLoanApplicationButton).toBeVisible();

    // Top-level tabs
    await expect(loan.loanApplicationDetailsTab).toBeVisible();
    await expect(loan.tasksTab).toBeVisible();
    await expect(loan.notesTab).toBeVisible();

    // Sub-tabs
    await expect(loan.clientInfoTab).toBeVisible();
    await expect(loan.loanInfoTab).toBeVisible();
    await expect(loan.farmsTab).toBeVisible();
    console.log(`Opportunity: ${page.url()}`);
  });

  test('should fill all opportunity details and save', async () => {
    await allure.allureId('S08');

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

    // Verify saved values
    await loan.clientInfoTab.click();
    await expect(loan.page.getByText(clientInfoDetails.idNumber)).toBeVisible();

    await loan.loanInfoTab.click();
    await expect(loan.page.getByText(loanInfo.summary)).toBeVisible();

    await loan.farmsTab.click();
    await expect(loan.page.getByText(farmData.name, { exact: true }).first()).toBeVisible();
  });

  test('should initiate the loan application', async () => {
    await allure.allureId('S09');

    await loan.initiateLoanApplication();

    // Verify status changed and toast appeared
    await expect(loan.statusConsentPending).toBeVisible();
    await expect(loan.loanSubmittedToast).toBeVisible();
    console.log(`Loan initiated — Status: Consent Pending`);
    console.log(`Opportunity: ${page.url()}`);
  });
});
