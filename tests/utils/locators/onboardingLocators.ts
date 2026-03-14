import { Page, Locator, expect } from '@playwright/test';

export class OnboardingLocators {
  readonly page: Page;

  // Page header
  readonly onboardingHeading: Locator;
  readonly statusInProgress: Locator;

  // Pre-Onboarding Checklist section
  readonly preOnboardingChecklistTitle: Locator;
  readonly preOnboardingQuestionsSection: Locator;

  // Form fields
  readonly yearsOfFarmingDropdown: Locator;
  readonly waterUseRightsCheckbox: Locator;
  readonly businessPlanSupportCheckbox: Locator;
  readonly equipmentAccessCheckbox: Locator;
  readonly taxClearanceCheckbox: Locator;
  readonly marketAccessCheckbox: Locator;
  readonly financialRecordsCheckbox: Locator;
  readonly mentorEngagedCheckbox: Locator;
  readonly laborLawCompliantCheckbox: Locator;

  // Submit
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page header
    this.onboardingHeading = page.getByRole('heading', { name: /Complete Onboarding Checklist/ });
    this.statusInProgress = page.getByText('In Progress').first();

    // Pre-Onboarding Checklist
    this.preOnboardingChecklistTitle = page.getByText('Pre-Onboarding Checklist');
    this.preOnboardingQuestionsSection = page.getByText('Pre-Onboarding Questions');

    // Form fields — scoped by their label text
    this.yearsOfFarmingDropdown = page.getByText('Years Of Farming Experience').locator('..').locator('..').locator('.ant-select');
    this.waterUseRightsCheckbox = page.getByText('Does this operation require Water Use Rights?').locator('..').locator('..').getByRole('checkbox');
    this.businessPlanSupportCheckbox = page.getByText('Business Plan Development Support required?').locator('..').locator('..').getByRole('checkbox');
    this.equipmentAccessCheckbox = page.getByText('Is there access to working Equipment and Mechanization?').locator('..').locator('..').getByRole('checkbox');
    this.taxClearanceCheckbox = page.getByText('Does the client have a Valid Tax Clearance certificate?').locator('..').locator('..').getByRole('checkbox');
    this.marketAccessCheckbox = page.getByText('Does the client have access to established markets?').locator('..').locator('..').getByRole('checkbox');
    this.financialRecordsCheckbox = page.getByText('Formal Financial Records or Statements maintained?').locator('..').locator('..').getByRole('checkbox');
    this.mentorEngagedCheckbox = page.getByText('Does the client have an actively engaged Mentor?').locator('..').locator('..').getByRole('checkbox');
    this.laborLawCompliantCheckbox = page.getByText('Is the client Compliant with all applicable Labor Laws?').locator('..').locator('..').getByRole('checkbox');

    // Submit
    this.submitButton = page.getByRole('button', { name: 'Submit' });
  }

  // --- Helpers ---

  async selectYearsOfFarming(value: string): Promise<void> {
    await this.yearsOfFarmingDropdown.click();
    const dropdown = this.page.locator('.ant-select-dropdown:visible');
    await dropdown.locator('.ant-select-item-option').filter({ hasText: value }).click();
  }

  async checkIfUnchecked(checkbox: Locator): Promise<void> {
    const isChecked = await checkbox.isChecked();
    if (!isChecked) {
      await checkbox.click();
    }
  }

  async fillChecklist(data: {
    yearsOfFarmingExperience: string;
    waterUseRights: boolean;
    businessPlanSupport: boolean;
    equipmentAccess: boolean;
    taxClearance: boolean;
    marketAccess: boolean;
    financialRecords: boolean;
    mentorEngaged: boolean;
    laborLawCompliant: boolean;
  }): Promise<void> {
    await this.selectYearsOfFarming(data.yearsOfFarmingExperience);

    const checkboxMap: [Locator, boolean][] = [
      [this.waterUseRightsCheckbox, data.waterUseRights],
      [this.businessPlanSupportCheckbox, data.businessPlanSupport],
      [this.equipmentAccessCheckbox, data.equipmentAccess],
      [this.taxClearanceCheckbox, data.taxClearance],
      [this.marketAccessCheckbox, data.marketAccess],
      [this.financialRecordsCheckbox, data.financialRecords],
      [this.mentorEngagedCheckbox, data.mentorEngaged],
      [this.laborLawCompliantCheckbox, data.laborLawCompliant],
    ];

    for (const [checkbox, shouldCheck] of checkboxMap) {
      const isChecked = await checkbox.isChecked();
      if (shouldCheck && !isChecked) {
        await checkbox.click();
      } else if (!shouldCheck && isChecked) {
        await checkbox.click();
      }
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
