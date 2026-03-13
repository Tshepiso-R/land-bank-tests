import { test, expect, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { login } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { LoanLocators } from './utils/locators/loanLocators';
import { validLead, uniqueFirstName, clientInfoDetails, loanInfo, farmData, opportunityOwner, testmailAddress, testmailApiKey, testmailNamespace } from './utils/testData';

test.use({ browserName: 'chromium' });

/**
 * Consent & OTP flow tests.
 *
 * Creates a lead → converts → fills opportunity (with Auto Verify OFF) →
 * initiates loan → receives consent email → completes OTP signing →
 * verifies status changes to "Verification In Progress".
 *
 * Requires testmail.app for email/OTP retrieval.
 */
test.describe('Consent & OTP Flow', () => {
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

  test('should create lead, convert, and fill opportunity', async () => {
    await allure.allureId('C01');

    // Create lead
    await lead.navigateToLeads();
    await lead.openNewLeadDialog();
    await lead.fillAllFields({ ...validLead, firstName: testFirstName });
    await lead.submitForm();
    await expect(lead.dialog).toBeHidden({ timeout: 30000 });

    await lead.filterByFirstName(testFirstName);
    const row = lead.getLeadRowByName(testFirstName, validLead.lastName);
    await expect(row).toBeVisible({ timeout: 60000 });

    // Convert lead
    await lead.openLeadDetails(testFirstName, validLead.lastName);
    await lead.completePreScreeningToPass();
    await expect(lead.statusConverted).toBeVisible({ timeout: 60000 });

    // Navigate to opportunity
    const accountName = `${testFirstName} ${validLead.lastName}`;
    await loan.navigateToOpportunities();
    await loan.filterByAccount(accountName);
    await loan.openOpportunityDetails(accountName);

    // Fill opportunity details (Auto Verify will be unchecked manually)
    await loan.enterEditMode();
    await loan.selectOpportunityOwner(opportunityOwner);

    // Uncheck Auto Verify for consent flow
    if (await loan.autoVerifyCheckbox.isChecked()) {
      await loan.autoVerifyCheckbox.uncheck();
    }

    await expect(loan.clientNameInput).toBeVisible({ timeout: 30000 });
    await expect(loan.clientNameInput).not.toHaveValue('', { timeout: 10000 });
    await loan.clientIdNumberInput.fill(clientInfoDetails.idNumber);
    await loan.clientNameInput.fill(clientInfoDetails.firstName);
    await loan.clientSurnameInput.fill(clientInfoDetails.lastName);
    await loan.emailAddressInput.fill(testEmail);

    if (clientInfoDetails.countryOfResidence) {
      await loan.selectDropdownOption(loan.countryOfResidenceDropdown, clientInfoDetails.countryOfResidence.substring(0, 5), clientInfoDetails.countryOfResidence);
    }
    if (clientInfoDetails.citizenship) {
      await loan.selectDropdownOption(loan.citizenshipDropdown, clientInfoDetails.citizenship.substring(0, 5), clientInfoDetails.citizenship);
    }
    if (clientInfoDetails.countryOfOrigin) {
      await loan.selectDropdownOption(loan.countryOfOriginDropdown, clientInfoDetails.countryOfOrigin.substring(0, 5), clientInfoDetails.countryOfOrigin);
    }
    if (clientInfoDetails.clientClassification) {
      await loan.selectDropdownByTitle(loan.clientClassificationDropdown, clientInfoDetails.clientClassification);
    }
    if (clientInfoDetails.maritalStatus) {
      await loan.selectDropdownByTitle(loan.maritalStatusDropdown, clientInfoDetails.maritalStatus);
    }

    await loan.loanInfoTab.click();
    await expect(loan.loanInfoPanel).toBeVisible();
    await loan.fillLoanInfo(loanInfo);

    await loan.farmsTab.click();
    await loan.addFarm(farmData);
    await expect(loan.createFarmDialog).toBeHidden({ timeout: 30000 });

    await loan.save();
    console.log('Opportunity filled and saved');
  });

  test('should initiate the loan application', async () => {
    await allure.allureId('C02');

    await loan.initiateLoanApplication();
    await expect(loan.statusConsentPending).toBeVisible();
    await expect(loan.loanSubmittedToast).toBeVisible();
    opportunityUrl = page.url();
    console.log(`Loan initiated — Status: Consent Pending`);
  });

  test('should receive consent email after initiation', async () => {
    await allure.allureId('C03');

    const apiUrl = `https://api.testmail.app/api/json?apikey=${testmailApiKey}&namespace=${testmailNamespace}&tag=${emailTag}&livequery=true&timeout=60000`;

    const response = await page.request.get(apiUrl);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log(`Testmail response — count: ${data.count}`);
    expect(data.count).toBeGreaterThan(0);

    const email = data.emails[0];
    console.log(`Email subject: ${email.subject}`);

    expect(email.subject).toContain('Action Required: Provide Consent');
    expect(email.from).toBe('notifications@smartgov.co.za');
    expect(email.html || email.text).toBeTruthy();

    const htmlBody: string = email.html;
    const linkMatch = htmlBody.match(/href="(https:\/\/[^"]*individual-application-consent[^"]*)"/);
    expect(linkMatch).toBeTruthy();
    consentUrl = linkMatch![1];
    console.log(`Consent URL: ${consentUrl}`);
  });

  test('should open consent page and complete OTP signing', async () => {
    await allure.allureId('C04');

    expect(consentUrl).toBeTruthy();
    await page.goto(consentUrl);
    await page.waitForLoadState('networkidle');

    await expect(loan.consentFormHeading).toBeVisible({ timeout: 30000 });
    console.log(`Consent page: ${page.url()}`);

    const otpRequestedAt = Date.now();

    await loan.requestOtpButton.click();
    await expect(loan.otpSentToast).toBeVisible({ timeout: 30000 });

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

    await loan.otpInput.fill(otp);
    await loan.submitOtpButton.click();

    await expect(loan.submitConsentConfirmButton).toBeVisible({ timeout: 10000 });
    await loan.submitConsentConfirmButton.click();

    await expect(loan.consentSuccessToast).toBeVisible({ timeout: 30000 });
    await expect(loan.consentSuccessMessage).toBeVisible();
    console.log('Consent signed successfully');
  });

  test('should show Verification In Progress after consent', async () => {
    await allure.allureId('C05');

    await page.goto(opportunityUrl);
    await page.waitForLoadState('networkidle');

    await expect(loan.statusVerificationInProgress).toBeVisible({ timeout: 60000 });
    console.log('Status: Verification In Progress');
  });
});
