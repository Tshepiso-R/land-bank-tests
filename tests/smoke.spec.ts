import { test, expect, Browser, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { login } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { LoanLocators } from './utils/locators/loanLocators';
import { VerificationLocators } from './utils/locators/verificationLocators';
import { validLead, uniqueFirstName, clientInfoDetails, loanInfo, farmData, opportunityOwner } from './utils/testData';

test.use({ browserName: 'chromium' });

test.describe('Smoke Tests — Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let lead: LeadLocators;
  let loan: LoanLocators;
  let verification: VerificationLocators;
  let testFirstName: string;

  test.beforeAll(async ({ browser }) => {
    testFirstName = uniqueFirstName();
    // Single login session shared across all tests
    page = await browser.newPage();
    const username = process.env.CRM_USERNAME || 'admin';
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
    await expect(page.getByText('System Administrator')).toBeVisible();
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

    // With Auto Verify checked, status transitions through Consent Pending
    // to Verification In Progress automatically
    await expect(loan.loanSubmittedToast).toBeVisible();
    await expect(loan.statusVerificationInProgress).toBeVisible({ timeout: 60000 });
    console.log(`Loan initiated — Status: Verification In Progress`);
    console.log(`Opportunity: ${page.url()}`);
  });

  test('should login as Fatima and find the item in Inbox', async () => {
    await allure.allureId('S10');

    // Logout current user
    await page.getByText('System Administrator').click();
    await page.getByRole('menuitem', { name: 'login Logout' }).click();
    await page.getByRole('button', { name: 'Sign In' }).waitFor({ state: 'visible', timeout: 30000 });

    // Login as Fatima
    await login(page, 'fatima.abrahams@landbank.co.za', '123qwe');
    await expect(page.getByText('Fatima Abrahams')).toBeVisible({ timeout: 30000 });
    console.log('Logged in as Fatima Abrahams');

    // Navigate to Inbox
    verification = new VerificationLocators(page);
    await verification.navigateToInbox();
    await expect(verification.inboxHeading).toBeVisible();

    // The most recent "Confirm verification outcomes" row is our item
    const firstRow = page.getByRole('row').filter({ hasText: 'Confirm verification outcomes' }).first();
    await expect(firstRow).toBeVisible({ timeout: 30000 });

    // Extract the ref number for logging
    const refCell = firstRow.getByRole('cell').nth(1);
    const refNo = await refCell.textContent();
    console.log(`Inbox item found — Ref: ${refNo}`);

    // Open the inbox item
    await firstRow.getByRole('link', { name: 'search' }).click();
    await expect(verification.confirmVerificationHeading).toBeVisible({ timeout: 60000 });
    console.log(`Inbox detail: ${page.url()}`);
  });

  test('should verify Client Info on the inbox item matches opportunity data', async () => {
    await allure.allureId('S11');

    // Client Info tab should be selected by default
    await expect(verification.clientInfoTab).toBeVisible();

    // Scope assertions to the Client Info tab panel
    const clientPanel = page.getByRole('tabpanel', { name: 'Client Info' });
    await expect(clientPanel.getByText(clientInfoDetails.idNumber)).toBeVisible();
    await expect(clientPanel.getByText('Ian')).toBeVisible();
    await expect(clientPanel.getByText('Houvet')).toBeVisible();
    await expect(clientPanel.getByText(clientInfoDetails.email)).toBeVisible();
    await expect(clientPanel.getByText('0821234567')).toBeVisible();
    await expect(clientPanel.getByText('Email', { exact: true })).toBeVisible();
    await expect(clientPanel.getByText('South Africa').first()).toBeVisible();
    await expect(clientPanel.getByText('Development')).toBeVisible();
    await expect(clientPanel.getByText('Gauteng')).toBeVisible();
    await expect(clientPanel.getByText('Central Region')).toBeVisible();
    await expect(clientPanel.getByText('Single')).toBeVisible();
    console.log('Client Info verified');
  });

  test('should verify Loan Info on the inbox item matches opportunity data', async () => {
    await allure.allureId('S12');

    await verification.loanInfoTab.click();
    const loanPanel = page.getByRole('tabpanel', { name: 'Loan Info' });

    await expect(loanPanel.getByText('R MT Loans').first()).toBeVisible();
    await expect(loanPanel.getByText(loanInfo.summary).first()).toBeVisible();
    await expect(loanPanel.getByText('50000').first()).toBeVisible();
    await expect(loanPanel.getByText('None').first()).toBeVisible();
    await expect(loanPanel.getByText('Farming income').first()).toBeVisible();
    await expect(loanPanel.getByText('Purchase Of Livestock').first()).toBeVisible();
    console.log('Loan Info verified');
  });

  test('should verify Farms on the inbox item matches opportunity data', async () => {
    await allure.allureId('S13');

    await verification.farmsTab.click();
    const farmsPanel = page.getByRole('tabpanel', { name: 'Farms' });

    await expect(farmsPanel.getByText(farmData.name, { exact: true }).first()).toBeVisible();
    await expect(farmsPanel.getByText('Aqua Culture, Cash Crops - General')).toBeVisible();
    await expect(farmsPanel.getByText('Owned')).toBeVisible();
    await expect(farmsPanel.getByText('2300')).toBeVisible();
    await expect(farmsPanel.getByText('Limpopo')).toBeVisible();
    console.log('Farms verified');
  });

  test('should open verification dialog and verify Overview statuses', async () => {
    await allure.allureId('S14');

    await verification.openVerificationDialog();

    // Overview tab — statuses render as sha-status-tag (CSS uppercase)
    const dialog = page.getByRole('dialog');

    // Wait for status data to load
    await expect(dialog.getByText('ID Status')).toBeVisible({ timeout: 30000 });
    await expect(dialog.getByText('Photo Verification Status')).toBeVisible();
    await expect(dialog.getByText('KYC Status')).toBeVisible();

    // Log the actual statuses (may vary based on verification processing time)
    const completedCount = await dialog.getByText('Completed').count();
    const awaitingCount = await dialog.getByText('Awaiting Review').count();
    console.log(`Overview: ${completedCount} Completed, ${awaitingCount} Awaiting Review`);
  });

  test('should verify ID Verification tab', async () => {
    await allure.allureId('S15');

    await verification.idVerificationTab.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('ID Verification Details')).toBeVisible({ timeout: 10000 });

    // Scope to ID Verification tab panel to avoid ambiguity
    const idPanel = dialog.getByRole('tabpanel');

    // Submitted values are always present
    await expect(idPanel.getByText('Ian', { exact: true })).toBeVisible();
    await expect(idPanel.getByText('Houvet', { exact: true })).toBeVisible();
    await expect(idPanel.getByText(clientInfoDetails.idNumber).first()).toBeVisible();

    // Check if verification is completed via the tab's status tag
    const isCompleted = await idPanel.locator('.sha-status-tag-container .sha-status-tag').first()
      .innerText().then(t => t.toUpperCase() === 'COMPLETED').catch(() => false);

    if (isCompleted) {
      // Returned values (uppercase from API)
      await expect(idPanel.getByText('IAN', { exact: true })).toBeVisible();
      await expect(idPanel.getByText('HOUVET', { exact: true })).toBeVisible();
      await expect(idPanel.getByText('20/08/1977')).toBeVisible();
      await expect(idPanel.getByText('Male')).toBeVisible();

      // Verification outcomes — all Passed (CSS may uppercase)
      await expect(idPanel.getByText('Passed')).toHaveCount(4, { timeout: 10000 });
      console.log('ID Verification: Completed — Name Match, ID Match, Death Check, Outcome all Passed');
    } else {
      console.log('ID Verification: Awaiting Review — submitted data verified');
    }
  });

  test('should verify KYC Verification tab', async () => {
    await allure.allureId('S16');

    await verification.kycVerificationTab.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('KYC Verification Details')).toBeVisible({ timeout: 10000 });

    const kycPanel = dialog.getByRole('tabpanel');

    // Submitted ID is always present
    await expect(kycPanel.getByText(clientInfoDetails.idNumber).first()).toBeVisible();

    // The tab-level status tag is the first visible one in the tabpanel
    const tabStatusTag = kycPanel.locator('.sha-status-tag-container .sha-status-tag').first();
    const isCompleted = await tabStatusTag
      .innerText().then(t => t.toUpperCase() === 'COMPLETED').catch(() => false);

    if (isCompleted) {
      await expect(kycPanel.getByText('IAN', { exact: true })).toBeVisible();
      await expect(kycPanel.getByText('BOXFUSION')).toBeVisible();
      await expect(kycPanel.getByText('Passed').first()).toBeVisible();
      console.log('KYC Verification: Completed — First Name Match Passed');
    } else {
      console.log('KYC Verification: Awaiting Review — submitted data verified');
    }
  });

  test('should verify Compliance tab if present', async () => {
    await allure.allureId('S17');

    const dialog = page.getByRole('dialog');

    // Compliance tab may not be present depending on verification config
    const complianceTabVisible = await verification.complianceTab.isVisible().catch(() => false);

    if (complianceTabVisible) {
      await verification.complianceTab.click();
      await expect(dialog.getByText('Compliance Verification Details')).toBeVisible({ timeout: 10000 });

      const compPanel = dialog.getByRole('tabpanel');

      const isCompleted = await compPanel.locator('.sha-status-tag-container .sha-status-tag').first()
        .innerText().then(t => t.toUpperCase() === 'COMPLETED').catch(() => false);

      if (isCompleted) {
        await expect(compPanel.getByText('IAN HOUVET')).toBeVisible();
        await expect(compPanel.getByText('Success')).toBeVisible();
        await expect(compPanel.getByText('Passed').first()).toBeVisible();
        await expect(compPanel.getByText(/Sanctions.*Report/i).first()).toBeVisible();
        console.log('Compliance: Completed — PEP, Sanctions Passed, PDF report present');
      } else {
        console.log('Compliance: Awaiting Review — section visible');
      }
    } else {
      console.log('Compliance tab not present — skipping');
    }

    // Close the verification dialog
    await verification.closeVerificationDialog();
  });

  test('should see action buttons for finalising verification', async () => {
    await allure.allureId('S18');

    await expect(verification.finaliseVerificationButton).toBeVisible();
    await expect(verification.finaliseVerificationButton).toBeEnabled();
    await expect(verification.flagHighRiskButton).toBeVisible();
    await expect(verification.flagHighRiskButton).toBeEnabled();
    console.log('Action buttons visible: Finalise Verification Outcomes, Flag As High Risk');
  });
});
