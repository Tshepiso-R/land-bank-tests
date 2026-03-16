// Entity (Close Corporation) happy-path smoke tests (19 serial tests, E01–E21).
// Workflow: Create Entity lead → Pre-screen → Opportunity → Directors/Signatory → Loan → Verify → Onboard.
// Entity verification: each director/signatory gets its own approval dialog.
import { test, expect, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { login } from './utils/login';
import { LeadLocators } from './utils/locators/leadLocators';
import { LoanLocators } from './utils/locators/loanLocators';
import { VerificationLocators } from './utils/locators/verificationLocators';
import { OnboardingLocators } from './utils/locators/onboardingLocators';
import { EntityLocators } from './utils/locators/entityLocators';
import {
  entityLead,
  uniqueFirstName,
  entityInfo,
  directors,
  signatoryData,
  entityLoanInfo,
  entityFarmData,
  opportunityOwner,
  onboardingChecklist,
} from './utils/testData';

test.use({ browserName: 'chromium' });

test.describe('Entity Loan Workflow — End to End', () => {
  // Serial mode: tests share browser state and must run in order
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let lead: LeadLocators;
  let loan: LoanLocators;
  let verification: VerificationLocators;
  let onboarding: OnboardingLocators;
  let entity: EntityLocators;
  let testFirstName: string;

  test.beforeAll(async ({ browser }) => {
    testFirstName = uniqueFirstName();
    page = await browser.newPage();
    const username = process.env.CRM_USERNAME || 'admin';
    const password = process.env.CRM_PASSWORD || '123qwe';
    await login(page, username, password);
    lead = new LeadLocators(page);
    loan = new LoanLocators(page);
    entity = new EntityLocators(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('should login and display the dashboard', async () => {
    await allure.allureId('E01');

    await expect(page.getByRole('heading', { name: 'My Dashboard' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('System Administrator')).toBeVisible();
    console.log(`Dashboard: ${page.url()}`);
  });

  test('should navigate to Leads via sidebar', async () => {
    await allure.allureId('E02');

    await lead.navigateToLeads();
    await expect(lead.allLeadsHeading).toBeVisible();
    await expect(lead.tableHeaderRow).toBeVisible();
  });

  test('should create a new Entity lead with valid data', async () => {
    await allure.allureId('E03');

    await lead.openNewLeadDialog();
    await expect(lead.dialogTitle).toHaveText('Add New Lead');

    // Fill standard fields (Client Type triggers Entity Name field to appear)
    await lead.fillAllFields({ ...entityLead, firstName: testFirstName });

    // Fill Entity Name (appears after selecting Entity client type)
    await expect(entity.entityNameInput).toBeVisible({ timeout: 5000 });
    await entity.entityNameInput.fill(entityLead.entityName);

    await lead.submitForm();
    await expect(lead.dialog).toBeHidden({ timeout: 30000 });

    // Verify the lead appears in the table
    await lead.filterByFirstName(testFirstName);
    const row = lead.getLeadRowByName(testFirstName, entityLead.lastName);
    await expect(row).toBeVisible({ timeout: 60000 });

    // Verify it's an Entity type
    await expect(row.getByText('Close Corporation (Entity)')).toBeVisible();
  });

  test('should open lead details and verify NEW status', async () => {
    await allure.allureId('E04');

    await lead.openLeadDetails(testFirstName, entityLead.lastName);

    await expect(lead.detailHeading).toBeVisible({ timeout: 30000 });
    await expect(lead.statusNew).toBeVisible();
    await expect(lead.editButton).toBeVisible();
    await expect(lead.initiatePreScreeningButton).toBeVisible();

    // Verify Entity client type on detail page
    await expect(page.getByText('Close Corporation (Entity)')).toBeVisible();
    console.log(`Entity Lead: ${page.url()}`);
  });

  test('should complete pre-screening and convert the lead', async () => {
    await allure.allureId('E05');

    await lead.completePreScreeningToPass();

    await expect(lead.statusConverted).toBeVisible({ timeout: 60000 });
    await expect(lead.assessmentPassed).toBeVisible();
    await expect(lead.convertedToOpportunityLink).toBeVisible();
    await expect(lead.convertedToAccountLink).toBeVisible();
    console.log(`Entity lead converted — Account: ${testFirstName} ${entityLead.lastName}`);
  });

  test('should navigate to the new Opportunity', async () => {
    await allure.allureId('E06');

    const accountName = `${testFirstName} ${entityLead.lastName}`;
    await loan.navigateToOpportunities();
    await loan.filterByAccount(accountName);
    const row = loan.getOpportunityRowByAccount(accountName);
    await expect(row).toBeVisible({ timeout: 60000 });
  });

  test('should open Opportunity detail and verify Entity type', async () => {
    await allure.allureId('E07');

    const accountName = `${testFirstName} ${entityLead.lastName}`;
    await loan.openOpportunityDetails(accountName);

    await expect(page.getByText('Entity', { exact: true }).first()).toBeVisible({ timeout: 30000 });
    await expect(loan.initiateLoanApplicationButton).toBeVisible();

    await expect(loan.clientInfoTab).toBeVisible();
    await expect(loan.loanInfoTab).toBeVisible();
    await expect(loan.farmsTab).toBeVisible();

    // Entity-specific sections
    await expect(entity.entityInfoSection).toBeVisible();
    await expect(page.getByText('Director', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Signatories', { exact: true }).first()).toBeVisible();

    console.log(`Entity Opportunity: ${page.url()}`);
  });

  test('should fill Entity Information and save', async () => {
    await allure.allureId('E08');

    await loan.enterEditMode();

    // Fill Opportunity Owner
    await loan.selectOpportunityOwner(opportunityOwner);

    // Fill Entity Information on Client Info tab
    await entity.fillEntityInfo(entityInfo);

    // Add all 3 Directors
    for (const director of directors) {
      await entity.addDirector(director);
      await expect(page.getByRole('cell', { name: director.firstName })).toBeVisible({ timeout: 10000 });
      console.log(`Director added: ${director.firstName} ${director.lastName}`);
    }

    // Add Signatory
    await entity.addSignatory(signatoryData);

    // Verify signatory appears in the Signatories table
    const signatoryTable = page.getByRole('tabpanel', { name: 'Signatories' });
    await expect(signatoryTable.getByRole('cell', { name: signatoryData.firstName })).toBeVisible({ timeout: 10000 });
    await expect(signatoryTable.getByRole('cell', { name: signatoryData.lastName })).toBeVisible();

    // Loan Info tab
    await loan.loanInfoTab.click();
    await expect(loan.loanInfoPanel).toBeVisible();
    await loan.fillLoanInfo(entityLoanInfo);

    // Farms tab
    await loan.farmsTab.click();
    await loan.addFarm(entityFarmData);
    await expect(loan.createFarmDialog).toBeHidden({ timeout: 30000 });

    // Save
    await loan.save();

    // Verify saved values
    await loan.clientInfoTab.click();
    await expect(page.getByText(entityInfo.entityName, { exact: true })).toBeVisible();

    await loan.loanInfoTab.click();
    await expect(page.getByText(entityLoanInfo.summary)).toBeVisible();

    await loan.farmsTab.click();
    await expect(page.getByText(entityFarmData.name, { exact: true }).first()).toBeVisible();

    console.log('Entity information, director, signatory, loan info, and farm saved');
  });

  test('should initiate the loan application', async () => {
    await allure.allureId('E09');

    await loan.initiateLoanApplication();

    await expect(loan.loanSubmittedToast).toBeVisible();
    await expect(loan.statusVerificationInProgress).toBeVisible({ timeout: 60000 });
    console.log('Entity loan initiated — Status: Verification In Progress');
    console.log(`Opportunity: ${page.url()}`);
  });

  test('should login as Fatima and find the item in Inbox', async () => {
    await allure.allureId('E10');

    // Switch to verifier role
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

    const firstRow = page.getByRole('row').filter({ hasText: 'Confirm verification outcomes' }).first();
    await expect(firstRow).toBeVisible({ timeout: 30000 });

    const refCell = firstRow.getByRole('cell').nth(1);
    const refNo = await refCell.textContent();
    console.log(`Inbox item found — Ref: ${refNo}`);

    // Open the inbox item
    await firstRow.getByRole('link', { name: 'search' }).click();
    await expect(verification.confirmVerificationHeading).toBeVisible({ timeout: 60000 });
    console.log(`Inbox detail: ${page.url()}`);
  });

  test('should verify Client Info shows Entity data', async () => {
    await allure.allureId('E11');

    await expect(verification.clientInfoTab).toBeVisible();

    const clientPanel = page.getByRole('tabpanel', { name: 'Client Info' });
    await expect(clientPanel.getByText(entityLead.entityName, { exact: true })).toBeVisible();
    await expect(clientPanel.getByText(testFirstName)).toBeVisible();
    await expect(clientPanel.getByText(entityLead.lastName, { exact: true }).first()).toBeVisible();
    await expect(clientPanel.getByText(entityLead.email)).toBeVisible();
    await expect(clientPanel.getByText(entityLead.mobile, { exact: true }).first()).toBeVisible();
    console.log('Entity Client Info verified on verification page');
  });

  test('should verify Loan Info on the inbox item', async () => {
    await allure.allureId('E12');

    await verification.loanInfoTab.click();
    const loanPanel = page.getByRole('tabpanel', { name: 'Loan Info' });

    await expect(loanPanel.getByText('R MT Loans').first()).toBeVisible();
    await expect(loanPanel.getByText(entityLoanInfo.summary).first()).toBeVisible();
    await expect(loanPanel.getByText(entityLoanInfo.amount).first()).toBeVisible();
    console.log('Entity Loan Info verified');
  });

  test('should verify Farms on the inbox item', async () => {
    await allure.allureId('E13');

    await verification.farmsTab.click();
    const farmsPanel = page.getByRole('tabpanel', { name: 'Farms' });

    await expect(farmsPanel.getByText(entityFarmData.name, { exact: true }).first()).toBeVisible();
    await expect(farmsPanel.getByText('Owned')).toBeVisible();
    await expect(farmsPanel.getByText(entityFarmData.size, { exact: true })).toBeVisible();
    console.log('Entity Farms verified');
  });

  test('should verify Entity Verifications section on the verification page', async () => {
    await allure.allureId('E14');

    // Entity verification page has Entity Verifications section (not the Individual dialog)
    await expect(page.getByText('Entity Verifications')).toBeVisible({ timeout: 30000 });

    // CIPC Status
    const cipcStatus = await page.getByText('CIPC Status:').locator('..').getByRole('button').first()
      .innerText().catch(() => 'unknown');
    console.log(`CIPC Status: ${cipcStatus}`);

    // Directors section in Entity Verifications
    await expect(page.locator('div').filter({ hasText: /^Directors$/ })).toBeVisible();

    // Signatories section in Entity Verifications
    await expect(page.locator('div').filter({ hasText: /^Signatories$/ })).toBeVisible();
    console.log('Entity Verifications section verified');
  });

  test('should approve director and signatory verifications', async () => {
    await allure.allureId('E15');

    // Scroll to Entity Verifications and wait for status buttons to load
    const entityVerifications = page.getByText('Entity Verifications').first();
    await entityVerifications.scrollIntoViewIfNeeded();
    await expect(entityVerifications).toBeVisible({ timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'Awaiting Review' }).first()).toBeVisible({ timeout: 60000 });

    // Approve all "Awaiting Review" items — KYC first, then ID + Submit, then refresh
    for (let pass = 1; pass <= 4; pass++) {
      const awaitingButtons = page.getByRole('button', { name: 'Awaiting Review' });
      const count = await awaitingButtons.count();
      if (count === 0) break;
      console.log(`Pass ${pass}: found ${count} Awaiting Review buttons`);

      for (let i = 0; i < count; i++) {
        // Always click the first enabled "Awaiting Review" button
        const btns = page.getByRole('button', { name: 'Awaiting Review' });
        const total = await btns.count();
        let clicked = false;
        for (let j = 0; j < total; j++) {
          const candidate = btns.nth(j);
          if (await candidate.isEnabled().catch(() => false)) {
            await candidate.click({ timeout: 30000 });
            clicked = true;
            break;
          }
        }
        if (!clicked) break;

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 30000 });

        // Wait for tabs to render
        const idTab = dialog.getByRole('tab', { name: 'ID Verification' });
        const cipcTab = dialog.getByRole('tab', { name: 'CIPC Verification' });
        await expect(idTab.or(cipcTab)).toBeVisible({ timeout: 10000 });

        const hasIdTab = await idTab.isVisible().catch(() => false);

        if (hasIdTab) {
          // Person dialog — KYC first, then ID + Submit
          await verification.approveKycVerification();
          console.log(`  KYC approved`);

          await verification.approveIdVerification();
          console.log(`  ID approved + submitted`);
        } else {
          // CIPC dialog
          await verification.approveCipcVerification();
          console.log(`  CIPC approved`);
        }

        // Refresh to close dialog and update statuses
        await page.reload({ waitUntil: 'networkidle' });
        await expect(page.getByText('Entity Verifications').first()).toBeVisible({ timeout: 30000 });
        console.log(`  Refreshed`);
      }
    }

    // Assert no enabled "Awaiting Review" buttons remain
    const allRemaining = page.getByRole('button', { name: 'Awaiting Review' });
    const remainingCount = await allRemaining.count();
    let enabledRemaining = 0;
    for (let j = 0; j < remainingCount; j++) {
      if (await allRemaining.nth(j).isEnabled().catch(() => false)) enabledRemaining++;
    }
    console.log(`After approvals: ${enabledRemaining} enabled / ${remainingCount} total Awaiting Review remaining`);
    expect(enabledRemaining, 'All approvable verifications should be completed').toBe(0);

    // Assert "Completed" statuses on the Entity Verifications landing
    const completedButtons = page.getByRole('button', { name: 'Completed' });
    const completedCount = await completedButtons.count();
    console.log(`Completed buttons: ${completedCount}`);
    expect(completedCount, 'At least one verification should show Completed').toBeGreaterThan(0);
  });

  test('should finalise verification outcomes and advance to onboarding', async () => {
    await allure.allureId('E18');

    await expect(verification.finaliseVerificationButton).toBeVisible();
    await expect(verification.finaliseVerificationButton).toBeEnabled();
    await verification.finaliseVerification();

    const onboardingHeading = page.getByRole('heading', { name: /Complete Onboarding Checklist/ });
    await expect(onboardingHeading).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('Pre-Onboarding Checklist')).toBeVisible({ timeout: 5000 });

    console.log('Verification finalised — workflow advanced to Complete Onboarding Checklist');

    onboarding = new OnboardingLocators(page);
  });

  test('should verify onboarding checklist page structure', async () => {
    await allure.allureId('E19');

    await expect(onboarding.onboardingHeading).toBeVisible();
    await expect(onboarding.statusInProgress).toBeVisible();
    await expect(onboarding.preOnboardingChecklistTitle).toBeVisible();
    await expect(onboarding.preOnboardingQuestionsSection).toBeVisible();

    await expect(page.getByRole('tab', { name: 'Client Info' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Loan Info' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Farms' })).toBeVisible();

    console.log('Entity onboarding checklist page verified');
  });

  test('should fill out the pre-onboarding checklist', async () => {
    await allure.allureId('E20');

    await onboarding.fillChecklist(onboardingChecklist);

    await expect(page.getByText(onboardingChecklist.yearsOfFarmingExperience).first()).toBeVisible();
    await expect(onboarding.waterUseRightsCheckbox).toBeChecked();
    await expect(onboarding.equipmentAccessCheckbox).toBeChecked();
    await expect(onboarding.taxClearanceCheckbox).toBeChecked();
    await expect(onboarding.marketAccessCheckbox).toBeChecked();
    await expect(onboarding.financialRecordsCheckbox).toBeChecked();
    await expect(onboarding.laborLawCompliantCheckbox).toBeChecked();
    await expect(onboarding.businessPlanSupportCheckbox).toBeChecked();
    await expect(onboarding.mentorEngagedCheckbox).toBeChecked();

    console.log('Entity pre-onboarding checklist filled');
  });

  test('should submit the onboarding checklist', async () => {
    await allure.allureId('E21');

    await expect(onboarding.submitButton).toBeVisible();
    await expect(onboarding.submitButton).toBeEnabled();
    await onboarding.submit();

    await expect(page.getByText('successfully')).toBeVisible({ timeout: 10000 });

    await page.waitForLoadState('networkidle');

    // If a second checklist assignment appears, submit it directly
    const secondSubmitVisible = await onboarding.submitButton
      .isVisible({ timeout: 10000 }).catch(() => false);

    if (secondSubmitVisible) {
      await onboarding.submit();
      await expect(page.getByText('successfully')).toBeVisible({ timeout: 10000 });
      await page.waitForLoadState('networkidle');
      console.log('Second onboarding checklist submitted');
    }

    // Entity flow may advance to Upload Resolution or show Completed
    const nextStep = await page.getByRole('heading', { name: /Upload Resolution/ })
      .isVisible({ timeout: 15000 }).catch(() => false);

    if (nextStep) {
      console.log('Workflow advanced to Upload Resolution');
    } else {
      await expect(page.getByText('Completed').first()).toBeVisible({ timeout: 30000 });
      console.log('Entity workflow completed');
    }
  });
});
