import { test, expect } from '../fixtures/fixtures';
import * as allure from 'allure-js-commons';

test.describe('Dashboard', () => {
  test('should display dashboard with metric cards', async ({ authenticatedPage }) => {
    await allure.id('009');
    await expect(authenticatedPage.dashboardHeading).toHaveText('My Dashboard');
    await expect(authenticatedPage.dashboardSubtext).toBeVisible();
    await expect(authenticatedPage.totalApplications).toBeVisible();
    await expect(authenticatedPage.pendingReview).toBeVisible();
    await expect(authenticatedPage.approved).toBeVisible();
    await expect(authenticatedPage.totalClients).toBeVisible();
  });

  test('should display date range picker with default values', async ({ authenticatedPage }) => {
    await allure.id('010');
    await expect(authenticatedPage.startDateInput).toBeVisible();
    await expect(authenticatedPage.endDateInput).toBeVisible();
    expect(await authenticatedPage.startDateInput.inputValue()).toBeTruthy();
    expect(await authenticatedPage.endDateInput.inputValue()).toBeTruthy();
  });

  test('should display sidebar navigation links', async ({ authenticatedPage }) => {
    await allure.id('011');
    await expect(authenticatedPage.sidebarDashboardUser).toBeVisible();
    await expect(authenticatedPage.sidebarDashboardMgmt).toBeVisible();
    await expect(authenticatedPage.sidebarInbox).toBeVisible();
    await expect(authenticatedPage.sidebarLeads).toBeVisible();
    await expect(authenticatedPage.sidebarOpportunities).toBeVisible();
    await expect(authenticatedPage.sidebarCases).toBeVisible();
    await expect(authenticatedPage.sidebarReports).toBeVisible();
  });

  test('should navigate to Leads page from sidebar', async ({ authenticatedPage }) => {
    await allure.id('012');
    await authenticatedPage.sidebarLeads.click();
    await expect(authenticatedPage.page).toHaveURL(/\/dynamic\/LandBank\.Crm\/LBLead-table/);
  });

  test('should navigate to Management Dashboard from sidebar', async ({ authenticatedPage }) => {
    await allure.id('013');
    await authenticatedPage.sidebarDashboardMgmt.click();
    await expect(authenticatedPage.page).toHaveURL(/\/dynamic\/management-dashboard/);
  });
});
