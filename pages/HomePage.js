const { BasePage } = require('./BasePage');

class HomePage extends BasePage {
  constructor(page) {
    super(page);

    // Dashboard elements
    this.dashboardHeading = page.getByRole('heading', { name: 'My Dashboard' });
    this.dashboardSubtext = page.getByText('Overview of loan applications and key metrics');
    this.userDisplayName = page.getByText('Promise Raganya');

    // Metric cards
    this.totalApplications = page.getByText('Total Applications');
    this.pendingReview = page.getByText('Pending Review');
    this.approved = page.getByText('Approved');
    this.totalClients = page.getByText('Total Clients');

    // Date range picker
    this.startDateInput = page.getByRole('textbox', { name: 'Start date' });
    this.endDateInput = page.getByRole('textbox', { name: 'End date' });

    // Sidebar navigation
    this.sidebarDashboardUser = page.getByRole('link', { name: 'Dashboard (User)' });
    this.sidebarDashboardMgmt = page.getByRole('link', { name: 'Dashboard (Management)' });
    this.sidebarInbox = page.getByRole('link', { name: 'Inbox' });
    this.sidebarLeads = page.getByRole('link', { name: 'Leads' });
    this.sidebarOpportunities = page.getByRole('link', { name: 'Opportunities' });
    this.sidebarCases = page.getByRole('link', { name: 'Cases' });
    this.sidebarReports = page.getByRole('link', { name: 'Reports' });
  }

  async waitForDashboard() {
    await this.dashboardHeading.waitFor({ state: 'visible', timeout: 30000 });
  }
}

module.exports = { HomePage };
