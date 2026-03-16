// Shared helpers for validation-and-edge-cases.spec.ts to reduce repetition.
import { Page, Browser, Locator, expect } from '@playwright/test';
import { login } from './login';
import { LeadLocators } from './locators/leadLocators';
import { LoanLocators } from './locators/loanLocators';
import { EntityLocators } from './locators/entityLocators';
import { entityLead, uniqueFirstName, opportunityOwner } from './testData';

export interface TestContext {
  page: Page;
  lead: LeadLocators;
  loan: LoanLocators;
  entity: EntityLocators;
}

/** Creates a new browser page, logs in as the default user, and returns all locator instances. */
export async function createAuthenticatedContext(browser: Browser): Promise<TestContext> {
  const page = await browser.newPage();
  const username = process.env.CRM_USERNAME || 'admin';
  const password = process.env.CRM_PASSWORD || '123qwe';
  await login(page, username, password);
  return {
    page,
    lead: new LeadLocators(page),
    loan: new LoanLocators(page),
    entity: new EntityLocators(page),
  };
}

// --- Dialog helpers ---

/** Safely dismiss any open dialog by pressing Escape. */
export async function dismissOpenDialog(page: Page, dialog: Locator): Promise<void> {
  if (await dialog.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 5000 }).catch(() => {});
  }
}

// --- Entity lead → opportunity helper ---

/**
 * Creates a fresh Entity lead, converts it via pre-screening,
 * navigates to the resulting opportunity, and enters edit mode.
 * Returns the generated account name.
 */
export async function createEntityOpportunityInEditMode(ctx: TestContext): Promise<string> {
  const { page, lead, loan, entity } = ctx;
  const testName = uniqueFirstName();

  await lead.navigateToLeads();
  await lead.openNewLeadDialog();
  await lead.fillAllFields({ ...entityLead, firstName: testName });
  await entity.entityNameInput.fill(entityLead.entityName);
  await lead.submitForm();
  await expect(lead.dialog).toBeHidden({ timeout: 30000 });

  await lead.filterByFirstName(testName);
  await lead.openLeadDetails(testName, entityLead.lastName);
  await lead.completePreScreeningToPass();
  await expect(lead.statusConverted).toBeVisible({ timeout: 60000 });

  const accountName = `${testName} ${entityLead.lastName}`;
  await loan.navigateToOpportunities();
  await loan.filterByAccount(accountName);
  await loan.openOpportunityDetails(accountName);
  await loan.enterEditMode();
  await loan.selectOpportunityOwner(opportunityOwner);

  return accountName;
}

// --- Table row cleanup ---

/** Delete a table row matching the given text (clicks delete icon, confirms OK). */
export async function deleteTableRow(page: Page, filterText: string): Promise<void> {
  const deleteIcon = page.getByRole('row').filter({ hasText: filterText }).locator('img[alt="delete"]');
  if (await deleteIcon.isVisible().catch(() => false)) {
    await deleteIcon.click();
    const okButton = page.getByRole('button', { name: 'OK' });
    if (await okButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await okButton.click();
    }
  }
}
