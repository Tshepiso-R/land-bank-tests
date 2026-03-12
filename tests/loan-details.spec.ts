import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { loginAsDefaultUser } from './utils/login';
import { LoanLocators } from './utils/locators/loanLocators';
import { convertedLead, loanInfo, farmData } from './utils/testData';

test.describe('Loan Details Workflow', () => {
  // Sequential workflow: each test continues where the previous one left off
  test.describe.configure({ mode: 'serial' });

  let loan: LoanLocators;

  test.beforeEach(async ({ page }) => {
    await loginAsDefaultUser(page);
    loan = new LoanLocators(page);
  });

  /** Navigate via sidebar → Opportunities → filter by Account → open detail */
  async function navigateToOpportunity(loan: LoanLocators): Promise<void> {
    await loan.navigateToOpportunities();
    await loan.filterByAccount(convertedLead.accountName);
    const row = loan.getOpportunityRowByAccount(convertedLead.accountName);
    await expect(row).toBeVisible({ timeout: 60000 });
    await loan.openOpportunityDetails(convertedLead.accountName);
  }

  test('should navigate to the Opportunity via sidebar and display all tabs', async () => {
    await allure.allureId('035');

    await navigateToOpportunity(loan);

    // Verify top-level tabs
    await expect(loan.loanApplicationDetailsTab).toBeVisible();
    await expect(loan.tasksTab).toBeVisible();
    await expect(loan.notesTab).toBeVisible();

    // Verify sub-tabs under Loan Application Details
    await expect(loan.clientInfoTab).toBeVisible();
    await expect(loan.loanInfoTab).toBeVisible();
    await expect(loan.farmsTab).toBeVisible();
  });

  test('should enter edit mode and verify Client Info fields', async () => {
    await allure.allureId('036');

    await navigateToOpportunity(loan);
    await loan.enterEditMode();

    // Wait for form to fully load with existing data
    await expect(loan.clientNameInput).toBeVisible({ timeout: 30000 });
    await expect(loan.clientNameInput).not.toHaveValue('', { timeout: 10000 });

    // Verify all Client Info fields are visible and editable
    await expect(loan.clientIdNumberInput).toBeVisible();
    await expect(loan.clientSurnameInput).toBeVisible();
    await expect(loan.emailAddressInput).toBeVisible();
    await expect(loan.mobileNumberInput).toBeVisible();

    // Verify the existing lead data matches (Link Test)
    await expect(loan.clientNameInput).toHaveValue(convertedLead.firstName);
    await expect(loan.clientSurnameInput).toHaveValue(convertedLead.lastName);

    // Cancel to reset
    await loan.cancelButton.click();
    await expect(loan.editButton).toBeVisible({ timeout: 30000 });
  });

  test('should fill Loan Info fields', async () => {
    await allure.allureId('037');

    await navigateToOpportunity(loan);
    await loan.enterEditMode();
    await loan.loanInfoTab.click();
    await expect(loan.loanInfoPanel).toBeVisible();

    await loan.fillLoanInfo(loanInfo);

    // Verify the summary was filled
    await expect(loan.businessSummaryTextarea).toHaveValue(loanInfo.summary);

    // Cancel
    await loan.cancelButton.click();
    await expect(loan.editButton).toBeVisible({ timeout: 30000 });
  });

  test('should add a farm with details', async () => {
    await allure.allureId('038');

    await navigateToOpportunity(loan);
    await loan.enterEditMode();
    await loan.farmsTab.click();

    await loan.addFarm(farmData);

    // Farm dialog should close after submission
    await expect(loan.createFarmDialog).toBeHidden({ timeout: 30000 });

    // Cancel
    await loan.cancelButton.click();
    await expect(loan.editButton).toBeVisible({ timeout: 30000 });
  });

  test('should verify edit and cancel workflow', async () => {
    await allure.allureId('039');

    await navigateToOpportunity(loan);

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
