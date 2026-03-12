import { test, expect, Browser, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { login } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { LoanLocators } from './utils/locators/loanLocators';
import { validLead, uniqueFirstName, convertedLead } from './utils/testData';

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
  });

  test('should view a converted lead with Passed assessment', async () => {
    await allure.allureId('S05');

    await lead.navigateToLeads();
    await lead.filterByFirstName(convertedLead.firstName);
    await lead.openLeadDetails(convertedLead.firstName, convertedLead.lastName);

    await expect(lead.statusConverted).toBeVisible({ timeout: 30000 });
    await expect(lead.assessmentPassed).toBeVisible();
    await expect(lead.convertedToOpportunityLink).toBeVisible();
    await expect(lead.convertedToAccountLink).toBeVisible();
  });

  test('should navigate to Opportunities and find the converted lead', async () => {
    await allure.allureId('S06');

    await loan.navigateToOpportunities();
    await loan.filterByAccount(convertedLead.accountName);
    const row = loan.getOpportunityRowByAccount(convertedLead.accountName);
    await expect(row).toBeVisible({ timeout: 60000 });
  });

  test('should open Opportunity detail and verify all tabs', async () => {
    await allure.allureId('S07');

    await loan.openOpportunityDetails(convertedLead.accountName);

    // Top-level tabs
    await expect(loan.loanApplicationDetailsTab).toBeVisible();
    await expect(loan.tasksTab).toBeVisible();
    await expect(loan.notesTab).toBeVisible();

    // Sub-tabs
    await expect(loan.clientInfoTab).toBeVisible();
    await expect(loan.loanInfoTab).toBeVisible();
    await expect(loan.farmsTab).toBeVisible();
  });

  test('should enter edit mode on Opportunity and verify Client Info', async () => {
    await allure.allureId('S08');

    await loan.enterEditMode();

    await expect(loan.clientNameInput).toBeVisible({ timeout: 30000 });
    await expect(loan.clientNameInput).toHaveValue(convertedLead.firstName);
    await expect(loan.clientSurnameInput).toHaveValue(convertedLead.lastName);

    await loan.cancelButton.click();
    await expect(loan.editButton).toBeVisible({ timeout: 30000 });
  });
});
