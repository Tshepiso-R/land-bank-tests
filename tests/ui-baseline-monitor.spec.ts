// UI Baseline Monitor — detects structural changes across the entire CRM workflow.
// Monitors every page, tab, dialog, and form in both Individual and Entity flows.
// First run saves baselines; subsequent runs fail on differences.
// Trigger manually: npx playwright test tests/ui-baseline-monitor.spec.ts --project=chromium
// Update baselines: UPDATE_BASELINES=true npx playwright test tests/ui-baseline-monitor.spec.ts
import { test, expect, Page } from '@playwright/test';
import { login } from './utils/login';
import { snapshotPage } from './utils/ui-baseline/snapshotPage';
import { compareSnapshots } from './utils/ui-baseline/compareSnapshots';
import { loadBaseline, saveBaseline, baselineExists } from './utils/ui-baseline/baselineStore';

test.use({ browserName: 'chromium' });

// Helper: wait for tab panel content to load after clicking a tab
async function clickTabAndWait(page: Page, tabName: string): Promise<void> {
  await page.getByRole('tab', { name: tabName }).click();
  await page.getByRole('tabpanel', { name: tabName }).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
}

// Helper: open first opportunity from the table
async function openFirstOpportunity(page: Page): Promise<void> {
  await page.goto('/dynamic/LandBank.Crm/LBOpportunity-table');
  await page.getByRole('row', { name: 'Date Created Account' }).waitFor({ state: 'visible', timeout: 60000 });
  await page.getByRole('row').nth(1).getByRole('link', { name: 'search' }).click();
  await page.getByRole('tab', { name: 'Client Info' }).waitFor({ state: 'visible', timeout: 60000 });
}

interface MonitoredPage {
  name: string;
  navigate: (p: Page) => Promise<void>;
  scope?: string;
  cleanup?: (p: Page) => Promise<void>;
  // Allow N element differences for pages with data-dependent conditional fields
  tolerance?: number;
}

const monitoredPages: MonitoredPage[] = [
  // ── Dashboard ──
  {
    name: 'dashboard',
    navigate: async (p) => {
      await p.goto('/dynamic/user-dashboard');
      await p.getByRole('heading', { name: 'My Dashboard' }).waitFor({ state: 'visible', timeout: 60000 });
    },
  },

  // ── Leads Module ──
  {
    name: 'leads-list',
    navigate: async (p) => {
      await p.goto('/dynamic/LandBank.Crm/LBLead-table');
      await p.getByRole('row', { name: 'Date Created Client Type' }).waitFor({ state: 'visible', timeout: 60000 });
    },
  },
  {
    name: 'lead-create-dialog',
    navigate: async (p) => {
      await p.goto('/dynamic/LandBank.Crm/LBLead-table');
      await p.getByRole('row', { name: 'Date Created Client Type' }).waitFor({ state: 'visible', timeout: 60000 });
      await p.getByRole('button', { name: 'plus New Lead' }).click();
      const dialog = p.getByRole('dialog', { name: 'Add New Lead' });
      await dialog.waitFor({ state: 'visible', timeout: 30000 });
      await dialog.locator('.ant-select').first().waitFor({ state: 'visible', timeout: 10000 });
    },
    scope: '[role="dialog"]',
    cleanup: async (p) => {
      await p.keyboard.press('Escape');
    },
  },
  {
    name: 'lead-detail',
    navigate: async (p) => {
      await p.goto('/dynamic/LandBank.Crm/LBLead-table');
      await p.getByRole('row', { name: 'Date Created Client Type' }).waitFor({ state: 'visible', timeout: 60000 });
      // Open first lead in the table
      await p.getByRole('row').nth(1).getByRole('link').first().click();
      await p.getByText('Lead', { exact: true }).first().waitFor({ state: 'visible', timeout: 60000 });
    },
  },
  {
    name: 'lead-pre-screening-dialog',
    navigate: async (p) => {
      // Navigate to a lead that has "Initiate Pre-Screening" button (NEW status)
      await p.goto('/dynamic/LandBank.Crm/LBLead-table');
      await p.getByRole('row', { name: 'Date Created Client Type' }).waitFor({ state: 'visible', timeout: 60000 });
      await p.getByRole('row').nth(1).getByRole('link').first().click();
      await p.getByText('Lead', { exact: true }).first().waitFor({ state: 'visible', timeout: 60000 });
      const btn = p.getByRole('button', { name: /Initiate Pre-Screening/i });
      const hasBtn = await btn.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasBtn) {
        await btn.click();
        await p.getByRole('dialog', { name: /Pre-Screening/i }).waitFor({ state: 'visible', timeout: 30000 });
      }
    },
    scope: '[role="dialog"]',
    cleanup: async (p) => {
      const dialog = p.getByRole('dialog', { name: /Pre-Screening/i });
      if (await dialog.isVisible().catch(() => false)) {
        await p.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      }
    },
  },

  // ── Opportunities Module ──
  {
    name: 'opportunities-list',
    navigate: async (p) => {
      await p.goto('/dynamic/LandBank.Crm/LBOpportunity-table');
      await p.getByRole('row', { name: 'Date Created Account' }).waitFor({ state: 'visible', timeout: 60000 });
    },
  },
  {
    name: 'opportunity-client-info-tab',
    navigate: async (p) => {
      await openFirstOpportunity(p);
      await clickTabAndWait(p, 'Client Info');
    },
  },
  {
    name: 'opportunity-loan-info-tab',
    navigate: async (p) => {
      await clickTabAndWait(p, 'Loan Info');
    },
  },
  {
    name: 'opportunity-farms-tab',
    navigate: async (p) => {
      await clickTabAndWait(p, 'Farms');
    },
  },
  {
    name: 'opportunity-tasks-tab',
    navigate: async (p) => {
      await clickTabAndWait(p, 'Tasks');
    },
  },
  {
    name: 'opportunity-notes-tab',
    navigate: async (p) => {
      await clickTabAndWait(p, 'Notes');
    },
  },
  {
    name: 'opportunity-edit-mode',
    navigate: async (p) => {
      await openFirstOpportunity(p);
      const editBtn = p.getByRole('button', { name: 'edit Edit' });
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        await p.getByRole('button', { name: 'close Cancel' }).waitFor({ state: 'visible', timeout: 10000 });
      }
    },
    // Conditional fields (e.g. Marital Regime) depend on record data
    tolerance: 5,
    cleanup: async (p) => {
      const cancelBtn = p.getByRole('button', { name: 'close Cancel' });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
      }
    },
  },
  {
    name: 'opportunity-add-farm-dialog',
    navigate: async (p) => {
      await openFirstOpportunity(p);
      const editBtn = p.getByRole('button', { name: 'edit Edit' });
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        await p.getByRole('button', { name: 'close Cancel' }).waitFor({ state: 'visible', timeout: 10000 });
      }
      await clickTabAndWait(p, 'Farms');
      const addFarmBtn = p.getByRole('button', { name: /Add a Farm/i });
      if (await addFarmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addFarmBtn.click();
        await p.getByRole('dialog', { name: /Create a Farm/i }).waitFor({ state: 'visible', timeout: 30000 });
      }
    },
    scope: '[role="dialog"]',
    cleanup: async (p) => {
      // Close farm dialog first, then exit edit mode
      const farmDialog = p.getByRole('dialog', { name: /Create a Farm/i });
      if (await farmDialog.isVisible().catch(() => false)) {
        await p.keyboard.press('Escape');
        await farmDialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      }
      const cancelBtn = p.getByRole('button', { name: 'close Cancel' });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click({ force: true });
      }
    },
  },

  // ── Entity-specific: Director & Signatory dialogs ──
  // These require an Entity opportunity — we look for one in the table
  {
    name: 'entity-director-dialog',
    navigate: async (p) => {
      await openFirstOpportunity(p);
      const editBtn = p.getByRole('button', { name: 'edit Edit' });
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        await p.getByRole('button', { name: 'close Cancel' }).waitFor({ state: 'visible', timeout: 10000 });
      }
      const addDirBtn = p.getByRole('button', { name: 'plus-circle Add Director' });
      if (await addDirBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addDirBtn.click();
        await p.getByRole('dialog', { name: 'Create Director' }).waitFor({ state: 'visible', timeout: 30000 });
      } else {
        test.skip(true, 'No Add Director button — not an Entity opportunity');
      }
    },
    scope: '[role="dialog"]',
    cleanup: async (p) => {
      await p.keyboard.press('Escape');
      await p.getByRole('dialog', { name: 'Create Director' }).waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      const cancelBtn = p.getByRole('button', { name: 'close Cancel' });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
      }
    },
  },
  {
    name: 'entity-signatory-dialog',
    navigate: async (p) => {
      await openFirstOpportunity(p);
      const editBtn = p.getByRole('button', { name: 'edit Edit' });
      if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await editBtn.click();
        await p.getByRole('button', { name: 'close Cancel' }).waitFor({ state: 'visible', timeout: 10000 });
      }
      const addSigBtn = p.getByRole('button', { name: 'plus-circle Add Signatory' });
      if (await addSigBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addSigBtn.click();
        await p.getByRole('dialog', { name: 'Create Signatory' }).waitFor({ state: 'visible', timeout: 30000 });
      } else {
        test.skip(true, 'No Add Signatory button — not an Entity opportunity');
      }
    },
    scope: '[role="dialog"]',
    cleanup: async (p) => {
      await p.keyboard.press('Escape');
      await p.getByRole('dialog', { name: 'Create Signatory' }).waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      const cancelBtn = p.getByRole('button', { name: 'close Cancel' });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
      }
    },
  },

  // ── Verification Workflow ──
  {
    name: 'verification-inbox',
    navigate: async (p) => {
      await p.goto('/dynamic/Shesha.Workflow/workflows-inbox');
      await p.getByRole('heading', { name: 'Incoming Items' }).waitFor({ state: 'visible', timeout: 60000 });
    },
  },
  {
    name: 'verification-inbox-item',
    navigate: async (p) => {
      // Open the first verification inbox item
      const firstRow = p.getByRole('row').filter({ hasText: 'Confirm verification outcomes' }).first();
      const hasRow = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);
      if (hasRow) {
        await firstRow.getByRole('link', { name: 'search' }).click();
        await p.getByRole('heading', { name: /Confirm verification outcomes/ }).waitFor({ state: 'visible', timeout: 60000 });
      } else {
        test.skip(true, 'No verification inbox items available');
      }
    },
  },
  {
    name: 'verification-client-info',
    navigate: async (p) => {
      const tab = p.getByRole('tab', { name: 'Client Info' });
      if (await tab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await clickTabAndWait(p, 'Client Info');
      } else {
        test.skip(true, 'Not on verification item page');
      }
    },
  },
  {
    name: 'verification-loan-info',
    navigate: async (p) => {
      const tab = p.getByRole('tab', { name: 'Loan Info' });
      if (await tab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await clickTabAndWait(p, 'Loan Info');
      } else {
        test.skip(true, 'Not on verification item page');
      }
    },
  },
  {
    name: 'verification-farms',
    navigate: async (p) => {
      const tab = p.getByRole('tab', { name: 'Farms' });
      if (await tab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await clickTabAndWait(p, 'Farms');
      } else {
        test.skip(true, 'Not on verification item page');
      }
    },
  },
  {
    name: 'verification-dialog',
    navigate: async (p) => {
      const awaitingBtn = p.getByRole('button', { name: 'Awaiting Review' }).first();
      const hasBtn = await awaitingBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (hasBtn) {
        await awaitingBtn.click();
        await p.getByRole('dialog').waitFor({ state: 'visible', timeout: 30000 });
        // Wait for tabs to render
        await p.getByRole('dialog').getByRole('tab').first().waitFor({ state: 'visible', timeout: 10000 });
      } else {
        test.skip(true, 'No Awaiting Review buttons available');
      }
    },
    scope: '[role="dialog"]',
    cleanup: async (p) => {
      await p.keyboard.press('Escape');
      await p.getByRole('dialog').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    },
  },

  // ── Onboarding (if accessible) ──
  {
    name: 'onboarding-checklist',
    navigate: async (p) => {
      // Look for an onboarding item in the inbox
      await p.goto('/dynamic/Shesha.Workflow/workflows-inbox');
      await p.getByRole('heading', { name: 'Incoming Items' }).waitFor({ state: 'visible', timeout: 60000 });
      const onboardingRow = p.getByRole('row').filter({ hasText: 'Complete Onboarding Checklist' }).first();
      const hasRow = await onboardingRow.isVisible({ timeout: 10000 }).catch(() => false);
      if (hasRow) {
        await onboardingRow.getByRole('link', { name: 'search' }).click();
        await p.getByRole('heading', { name: /Complete Onboarding Checklist/ }).waitFor({ state: 'visible', timeout: 60000 });
      } else {
        test.skip(true, 'No onboarding checklist items in inbox');
      }
    },
  },
];

test.describe('UI Baseline Monitor', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    const username = process.env.CRM_USERNAME || 'admin';
    const password = process.env.CRM_PASSWORD || '123qwe';
    await login(page, username, password);
  });

  test.afterAll(async () => {
    await page.close();
  });

  for (const config of monitoredPages) {
    test(`baseline: ${config.name}`, async () => {
      // Skip comparison tests when updating baselines (handled by the update test)
      test.skip(!!process.env.UPDATE_BASELINES, 'Skipped during baseline update');

      await config.navigate(page);

      const snapshot = await snapshotPage(page, config.scope);

      if (!baselineExists(config.name)) {
        saveBaseline(config.name, snapshot);
        console.log(`Baseline saved for ${config.name} (${snapshot.elements.length} elements)`);
      } else {
        const baseline = loadBaseline(config.name)!;
        const diff = compareSnapshots(baseline, snapshot);

        if (diff.added.length || diff.removed.length) {
          saveBaseline(`${config.name}.current`, snapshot);
          console.log(`UI changes detected on ${config.name}:\n${diff.summary}`);
        }

        const maxDiff = config.tolerance || 0;
        expect(diff.added.length, `New elements on ${config.name}:\n${diff.summary}`).toBeLessThanOrEqual(maxDiff);
        expect(diff.removed.length, `Missing elements on ${config.name}:\n${diff.summary}`).toBeLessThanOrEqual(maxDiff);
      }

      if (config.cleanup) {
        await config.cleanup(page);
      }
    });
  }

  test('update all baselines (manual)', async () => {
    test.skip(!process.env.UPDATE_BASELINES, 'Set UPDATE_BASELINES=true to regenerate all baselines');

    for (const config of monitoredPages) {
      await config.navigate(page);
      const snapshot = await snapshotPage(page, config.scope);
      saveBaseline(config.name, snapshot);
      console.log(`Updated: ${config.name} (${snapshot.elements.length} elements)`);
      if (config.cleanup) await config.cleanup(page);
    }
  });
});
