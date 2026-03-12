import { test, expect, Browser, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { login } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { LoanLocators } from './utils/locators/loanLocators';
import { validLead, uniqueFirstName, clientInfoDetails, loanInfo, farmData, opportunityOwner, testmailAddress, testmailApiKey, testmailNamespace } from './utils/testData';

test.use({ browserName: 'chromium' });

test.describe('Smoke Tests — Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let lead: LeadLocators;
  let loan: LoanLocators;
  let testFirstName: string;
  let emailTag: string;
  let testEmail: string;
  let consentUrl: string;
  let opportunityUrl: string;

  test.beforeAll(async ({ browser }) => {
    testFirstName = uniqueFirstName();
    emailTag = `consent-${Date.now()}`;
    testEmail = testmailAddress(emailTag);
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
    await loan.fillClientInfo({ ...clientInfoDetails, email: testEmail });

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
    opportunityUrl = page.url();
    console.log(`Loan initiated — Status: Consent Pending`);
    console.log(`Opportunity: ${opportunityUrl}`);
  });

  test('should receive consent email after initiation', async () => {
    await allure.allureId('S10');

    // Poll testmail API for the consent email (wait up to 60s)
    const apiUrl = `https://api.testmail.app/api/json?apikey=${testmailApiKey}&namespace=${testmailNamespace}&tag=${emailTag}&livequery=true&timeout=60000`;

    const response = await page.request.get(apiUrl);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log(`Testmail response — count: ${data.count}`);

    // Verify at least one email was received
    expect(data.count).toBeGreaterThan(0);

    const email = data.emails[0];
    console.log(`Email subject: ${email.subject}`);
    console.log(`Email from: ${email.from}`);
    console.log(`Email to: ${email.to}`);

    // Verify email content
    expect(email.subject).toContain('Action Required: Provide Consent');
    expect(email.from).toBe('notifications@smartgov.co.za');
    expect(email.html || email.text).toBeTruthy();

    // Extract consent link from email
    const htmlBody: string = email.html;
    const linkMatch = htmlBody.match(/href="(https:\/\/[^"]*individual-application-consent[^"]*)"/);
    expect(linkMatch).toBeTruthy();
    consentUrl = linkMatch![1];
    console.log(`Consent URL: ${consentUrl}`);
  });

  test('should open consent page and complete OTP signing', async () => {
    await allure.allureId('S11');

    expect(consentUrl).toBeTruthy();
    await page.goto(consentUrl);
    await page.waitForLoadState('networkidle');

    // Verify consent form loaded
    await expect(loan.consentFormHeading).toBeVisible({ timeout: 30000 });
    console.log(`Consent page: ${page.url()}`);

    // Record timestamp before requesting OTP so we can query only newer emails
    const otpRequestedAt = Date.now();

    // Request OTP
    await loan.requestOtpButton.click();
    await expect(loan.otpSentToast).toBeVisible({ timeout: 30000 });

    // Fetch OTP email from testmail using livequery (waits for new emails after timestamp)
    const otpApiUrl = `https://api.testmail.app/api/json?apikey=${testmailApiKey}&namespace=${testmailNamespace}&tag=${emailTag}&livequery=true&timeout=60000&timestamp_from=${otpRequestedAt}`;
    const otpResponse = await page.request.get(otpApiUrl);
    expect(otpResponse.ok()).toBeTruthy();

    const otpData = await otpResponse.json();
    const otpEmail = otpData.emails?.find((e: { subject: string }) => e.subject === 'One-Time-Pin');
    expect(otpEmail).toBeTruthy();

    const otpMatch = otpEmail.text.match(/Your One-Time-Pin is (\d+)/);
    expect(otpMatch).toBeTruthy();
    const otp = otpMatch![1];
    console.log(`OTP received: ${otp}`);

    // Enter OTP and submit
    await loan.otpInput.fill(otp);
    await loan.submitOtpButton.click();

    // Confirm the consent submission dialog
    await expect(loan.submitConsentConfirmButton).toBeVisible({ timeout: 10000 });
    await loan.submitConsentConfirmButton.click();

    // Verify success
    await expect(loan.consentSuccessToast).toBeVisible({ timeout: 30000 });
    await expect(loan.consentSuccessMessage).toBeVisible();
    console.log('Consent signed successfully');
  });

  test('should show Verification In Progress after consent', async () => {
    await allure.allureId('S12');

    // Navigate back to the opportunity detail page
    await page.goto(opportunityUrl);
    await page.waitForLoadState('networkidle');

    await expect(loan.statusVerificationInProgress).toBeVisible({ timeout: 60000 });
    console.log('Status: Verification In Progress');
  });
});
