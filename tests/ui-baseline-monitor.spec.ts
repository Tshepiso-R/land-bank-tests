// UI Baseline Monitor — detects structural changes to key CRM pages.
// Compares current page DOM against stored JSON baselines.
// First run saves baselines; subsequent runs fail on differences.
// Only runs on schedule and manual dispatch (not push/PR).
import { test, expect, Page } from '@playwright/test';
import { login } from './utils/login';
import { snapshotPage } from './utils/ui-baseline/snapshotPage';
import { compareSnapshots } from './utils/ui-baseline/compareSnapshots';
import { loadBaseline, saveBaseline, baselineExists } from './utils/ui-baseline/baselineStore';

test.use({ browserName: 'chromium' });

test.describe('UI Baseline Monitor', () => {
  // Serial: shares one browser session, navigates pages sequentially
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

  const monitoredPages = [
    {
      name: 'dashboard',
      navigate: async (p: Page) => {
        await p.goto('/dynamic/user-dashboard');
        await p.getByRole('heading', { name: 'My Dashboard' }).waitFor({ state: 'visible', timeout: 60000 });
      },
    },
    {
      name: 'leads-list',
      navigate: async (p: Page) => {
        await p.goto('/dynamic/LandBank.Crm/LBLead-table');
        await p.getByRole('row', { name: 'Date Created Client Type' }).waitFor({ state: 'visible', timeout: 60000 });
      },
    },
    {
      name: 'lead-create-dialog',
      navigate: async (p: Page) => {
        await p.goto('/dynamic/LandBank.Crm/LBLead-table');
        await p.getByRole('row', { name: 'Date Created Client Type' }).waitFor({ state: 'visible', timeout: 60000 });
        await p.getByRole('button', { name: 'plus New Lead' }).click();
        const dialog = p.getByRole('dialog', { name: 'Add New Lead' });
        await dialog.waitFor({ state: 'visible', timeout: 30000 });
        // Wait for form fields to render inside the dialog
        await dialog.locator('.ant-select').first().waitFor({ state: 'visible', timeout: 10000 });
      },
      scope: '[role="dialog"]',
      cleanup: async (p: Page) => {
        await p.keyboard.press('Escape');
      },
    },
    {
      name: 'opportunities-list',
      navigate: async (p: Page) => {
        await p.goto('/dynamic/LandBank.Crm/LBOpportunity-table');
        await p.getByRole('row', { name: 'Date Created Account' }).waitFor({ state: 'visible', timeout: 60000 });
      },
    },
    {
      name: 'opportunity-detail',
      navigate: async (p: Page) => {
        await p.goto('/dynamic/LandBank.Crm/LBOpportunity-table');
        await p.getByRole('row', { name: 'Date Created Account' }).waitFor({ state: 'visible', timeout: 60000 });
        // Open the first opportunity in the table
        const firstLink = p.getByRole('row').nth(1).getByRole('link', { name: 'search' });
        await firstLink.click();
        await p.getByRole('tab', { name: 'Client Info' }).waitFor({ state: 'visible', timeout: 60000 });
      },
    },
    {
      name: 'verification-inbox',
      navigate: async (p: Page) => {
        await p.goto('/dynamic/Shesha.Workflow/workflows-inbox');
        await p.getByRole('heading', { name: 'Incoming Items' }).waitFor({ state: 'visible', timeout: 60000 });
      },
    },
  ];

  for (const config of monitoredPages) {
    test(`baseline check: ${config.name}`, async () => {
      await config.navigate(page);

      const snapshot = await snapshotPage(page, (config as any).scope);

      if (!baselineExists(config.name)) {
        // First run — save current as baseline
        saveBaseline(config.name, snapshot);
        console.log(`Baseline saved for ${config.name} (${snapshot.elements.length} elements)`);
      } else {
        const baseline = loadBaseline(config.name)!;
        const diff = compareSnapshots(baseline, snapshot);

        if (diff.added.length || diff.removed.length) {
          // Save current snapshot for inspection
          saveBaseline(`${config.name}.current`, snapshot);
          console.log(`UI changes detected on ${config.name}:\n${diff.summary}`);
        }

        expect(diff.added, `New elements on ${config.name}:\n${diff.summary}`).toHaveLength(0);
        expect(diff.removed, `Missing elements on ${config.name}:\n${diff.summary}`).toHaveLength(0);
      }

      // Cleanup (e.g. close dialog)
      if ((config as any).cleanup) {
        await (config as any).cleanup(page);
      }
    });
  }

  test('update baselines (manual only)', async () => {
    test.skip(!process.env.UPDATE_BASELINES, 'Set UPDATE_BASELINES=true to regenerate baselines');

    for (const config of monitoredPages) {
      await config.navigate(page);
      const snapshot = await snapshotPage(page, (config as any).scope);
      saveBaseline(config.name, snapshot);
      console.log(`Updated baseline: ${config.name} (${snapshot.elements.length} elements)`);
      if ((config as any).cleanup) await (config as any).cleanup(page);
    }
  });
});
