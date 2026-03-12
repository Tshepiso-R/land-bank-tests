# LandBank CRM - Playwright Test Automation

End-to-end test automation for the LandBank CRM application built on the Shesha framework.

## Tech Stack

- [Playwright](https://playwright.dev/) - Browser automation
- [TypeScript](https://www.typescriptlang.org/) - Type-safe test code
- [Allure](https://docs.qameta.io/allure/) - Test reporting

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium
```

## Running Tests

```bash
# Run all tests (chromium)
npm run test:chromium

# Run smoke tests only
npx playwright test tests/smoke.spec.ts --project=chromium

# Run with headed browser (visible)
npx playwright test tests/smoke.spec.ts --project=chromium --headed

# Run on a specific browser
npm run test:firefox
npm run test:webkit

# Run all browsers
npm test
```

## Environment Configuration

Tests target the QA environment by default. Override with `TEST_ENV`:

```bash
TEST_ENV=staging npx playwright test --project=chromium
```

| Environment | URL |
|-------------|-----|
| qa (default) | `https://landbankcrm-adminportal-qa.shesha.app` |
| staging | `https://landbankcrm-adminportal-staging.shesha.app` |
| prod | `https://landbankcrm-adminportal.shesha.app` |

## Credentials

Set via environment variables (never hardcoded):

```bash
export CRM_USERNAME=your_username
export CRM_PASSWORD=your_password
```

## Test Suites

| Suite | File | Description |
|-------|------|-------------|
| Smoke | `tests/smoke.spec.ts` | Full happy-path: login, create lead, pre-screen, convert, fill opportunity details, initiate loan |
| Login | `tests/login.spec.ts` | Authentication flows |
| Home | `tests/home.spec.ts` | Dashboard verification |
| Create Lead | `tests/create-lead.spec.ts` | Lead creation with validation |
| Pre-Screening | `tests/pre-screening.spec.ts` | Pre-screening questionnaire |
| Loan Details | `tests/loan-details.spec.ts` | Opportunity lifecycle: client info, loan info, farms, initiation |

## Project Structure

```
tests/
  smoke.spec.ts                    # End-to-end happy path
  create-lead.spec.ts              # Lead creation tests
  pre-screening.spec.ts            # Pre-screening tests
  loan-details.spec.ts             # Loan application tests
  login.spec.ts                    # Auth tests
  home.spec.ts                     # Dashboard tests
  utils/
    login.ts                       # Shared login helper
    testData.ts                    # All test input values
    locators/
      leadLocators.ts              # Lead page locators & actions
      loanLocators.ts              # Opportunity/loan locators & actions
      preScreeningLocators.ts      # Pre-screening locators
config/
  env.ts                           # Environment configuration
playwright.config.ts               # Playwright configuration
.github/workflows/
  playwright-tests.yml             # CI pipeline
```

## Reporting

```bash
# Open Playwright HTML report
npm run report:open

# Generate Allure report
npm run allure:generate

# Open Allure report
npm run allure:open
```

## CI/CD

Tests run automatically via GitHub Actions (`.github/workflows/playwright-tests.yml`):

- **Push/PR to main**: Chromium only
- **Scheduled (daily 02:00 SAST)**: Chromium + Firefox + WebKit
- **Manual**: Trigger from GitHub UI

Reports are deployed to GitHub Pages after each run on main.

## Configuration

| Setting | Local | CI |
|---------|-------|----|
| Retries | 0 | 2 |
| Fail-fast | First failure | Run all |
| Workers | 4 | 4 |
| Browsers | Chromium | Chromium (all on schedule) |
| Headless | Yes | Yes |
