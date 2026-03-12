import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly dashboardHeading: Locator;
  readonly dashboardSubtext: Locator;
  readonly userDisplayName: Locator;
  readonly totalApplications: Locator;
  readonly pendingReview: Locator;
  readonly approved: Locator;
  readonly totalClients: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly sidebarDashboardUser: Locator;
  readonly sidebarDashboardMgmt: Locator;
  readonly sidebarInbox: Locator;
  readonly sidebarLeads: Locator;
  readonly sidebarOpportunities: Locator;
  readonly sidebarCases: Locator;
  readonly sidebarReports: Locator;

  constructor(page: Page) {
    super(page);

    this.dashboardHeading = page.getByRole('heading', { name: 'My Dashboard' });
    this.dashboardSubtext = page.getByText('Overview of loan applications and key metrics');
    this.userDisplayName = page.getByText('Promise Raganya');
    this.totalApplications = page.getByText('Total Applications');
    this.pendingReview = page.getByText('Pending Review');
    this.approved = page.getByText('Approved');
    this.totalClients = page.getByText('Total Clients');
    this.startDateInput = page.getByRole('textbox', { name: 'Start date' });
    this.endDateInput = page.getByRole('textbox', { name: 'End date' });
    this.sidebarDashboardUser = page.getByRole('link', { name: 'Dashboard (User)' });
    this.sidebarDashboardMgmt = page.getByRole('link', { name: 'Dashboard (Management)' });
    this.sidebarInbox = page.getByRole('link', { name: 'Inbox' });
    this.sidebarLeads = page.getByRole('link', { name: 'Leads' });
    this.sidebarOpportunities = page.getByRole('link', { name: 'Opportunities' });
    this.sidebarCases = page.getByRole('link', { name: 'Cases' });
    this.sidebarReports = page.getByRole('link', { name: 'Reports' });
  }

  async waitForDashboard(): Promise<void> {
    await this.dashboardHeading.waitFor({ state: 'visible', timeout: 60000 });
  }
}
