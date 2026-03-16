# LandBank CRM — Playwright Test Automation

End-to-end test automation for the LandBank CRM application built on the Shesha framework, covering Individual and Entity loan origination workflows from lead creation through onboarding completion.

## Links

| Resource | URL |
|----------|-----|
| CRM Application (QA) | https://landbankcrm-adminportal-qa.shesha.app |
| CRM Application (Staging) | https://landbankcrm-adminportal-staging.shesha.app |
| CRM Application (Prod) | https://landbankcrm-adminportal.shesha.app |
| GitHub Repository | https://github.com/Tshepiso-R/land-bank-tests |
| Allure Report (GitHub Pages) | https://tshepiso-r.github.io/land-bank-tests |
| CI Pipeline | https://github.com/Tshepiso-R/land-bank-tests/actions |

## Tech Stack

- [Playwright](https://playwright.dev/) — Browser automation
- [TypeScript](https://www.typescriptlang.org/) — Type-safe test code
- [Allure](https://docs.qameta.io/allure/) — Test reporting with historical trends

## Test Suites

| File | Tests | Type | Description |
|------|-------|------|-------------|
| `smoke.spec.ts` | 24 | Happy path (serial) | **Individual Loan Workflow — End to End** — Lead creation, pre-screening, conversion, opportunity details with married workflow (spouse info), loan initiation, verification approval (client + spouse), onboarding checklist completion. |
| `entity-smoke.spec.ts` | 19 | Happy path (serial) | **Entity Loan Workflow — End to End** — Entity lead creation, pre-screening, conversion, entity info (directors, signatories), loan initiation, verification approval (directors + signatory + CIPC), onboarding checklist completion. |
| `validation-and-edge-cases.spec.ts` | 38 | Negative & edge (parallel) | Married workflow regression, required field validation, email/mobile format validation, Entity lead validation, director/signatory edge cases, Entity information conditional logic. |
| `ui-baseline-monitor.spec.ts` | 22 | UI regression (serial) | **UI Baseline Monitor** — Snapshots DOM structure across 22 pages/dialogs and detects unintended UI changes. Covers dashboard, leads, opportunities, entity flows, verification, and onboarding. |

**Total: 103 tests** (81 functional + 22 baseline monitors)

### Validation & Edge Cases Breakdown

| Group | Tests | Coverage |
|-------|-------|----------|
| Individual — Married Workflow | 6 | Marital Regime dropdown visibility, all 3 regime options, Spouse Information for Community of Property, hide spouse fields on switch to Single |
| Individual — Lead Required Fields | 9 | One test per required field: Title, First Name, Last Name, Mobile, Email, Client Type, Province, Preferred Communication, Lead Channel |
| Individual — Format Validation | 7 | 4 invalid email formats, 3 invalid mobile formats |
| Entity — Lead Validation | 9 | Entity Name required, 4 invalid emails, 3 invalid mobiles, all-empty field validation |
| Entity — Director & Signatory | 5 | Empty director save, invalid SA ID save, married director, empty signatory save, entity opportunity navigation |
| Entity — Information Edge Cases | 2 | All Entity client type options available, Entity Name conditionally shown |

## Project Structure

```
tests/
  smoke.spec.ts                          # Individual workflow (24 serial tests)
  entity-smoke.spec.ts                   # Entity workflow (19 serial tests)
  validation-and-edge-cases.spec.ts      # Negative & edge cases (38 parallel tests)
  ui-baseline-monitor.spec.ts            # UI baseline regression (22 serial tests)
  utils/
    login.ts                             # Shared login helper
    testData.ts                          # All test input values and constants
    testHelpers.ts                       # Shared utilities (auth context, dialog, entity flow)
    locators/
      leadLocators.ts                    # Lead creation page — locators and actions
      loanLocators.ts                    # Opportunity/loan page — locators and actions
      entityLocators.ts                  # Entity-specific — locators and actions
      verificationLocators.ts            # Verification inbox — locators and actions
      onboardingLocators.ts              # Onboarding checklist — locators and actions
      preScreeningLocators.ts            # Pre-screening questionnaire — locators
    ui-baseline/
      snapshotPage.ts                    # DOM snapshot extraction with dynamic content filters
      compareSnapshots.ts                # Baseline diff comparison
      baselineStore.ts                   # JSON baseline read/write
baselines/                               # UI baseline JSON snapshots (auto-generated)
scripts/
  format-failures.js                     # Extract failures from Playwright JSON report
  analyze-failures.js                    # AI-powered failure analysis via Claude API
config/
  env.ts                                 # Environment URL configuration
playwright.config.ts                     # Playwright configuration
.github/workflows/
  playwright-tests.yml                   # CI pipeline — regression tests + AI failure analysis
  ui-baseline-monitor.yml                # CI pipeline — UI baseline monitor (daily + manual)
```

### Architecture

- **One locator file per module** — All selectors live in `utils/locators/`, never in spec files.
- **All test data in `testData.ts`** — No hardcoded names, emails, IDs, or amounts in spec files.
- **Shared helpers in `testHelpers.ts`** — Common patterns extracted to avoid repetition:
  - `createAuthenticatedContext(browser)` — Creates a logged-in page with all locator instances.
  - `dismissOpenDialog(page, dialog)` — Safely closes open dialogs between test iterations.
  - `createEntityOpportunityInEditMode(ctx)` — Full entity lead-to-opportunity setup in one call.
  - `deleteTableRow(page, filterText)` — Cleans up table rows with confirmation handling.
- **Data-driven tests** — Repeated scenarios (invalid emails, invalid mobiles, required fields) use `for...of` loops instead of separate test functions.

## Prerequisites

- Node.js 22+
- npm 9+

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps chromium
```

## Running Tests

```bash
# Run all active test suites (Chromium only)
npx playwright test --project=chromium

# Run individual suites
npx playwright test tests/smoke.spec.ts --project=chromium
npx playwright test tests/entity-smoke.spec.ts --project=chromium
npx playwright test tests/validation-and-edge-cases.spec.ts --project=chromium

# Run UI baseline monitor
npx playwright test tests/ui-baseline-monitor.spec.ts --project=chromium

# Update UI baselines (after intentional UI changes)
UPDATE_BASELINES=true npx playwright test tests/ui-baseline-monitor.spec.ts --project=chromium

# Run across all browsers
npx playwright test --project=chromium --project=firefox --project=webkit

# Run with headed browser (visible)
npx playwright test --headed --project=chromium

# Run a specific test by name
npx playwright test -g "should create a new lead" --project=chromium

# npm scripts
npm run test:chromium      # Chromium only
npm run test:firefox       # Firefox only
npm run test:webkit        # WebKit only
npm test                   # All browsers
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

Set via environment variables — never hardcoded:

```bash
export CRM_USERNAME=your_username
export CRM_PASSWORD=your_password
```

| Variable | Default | Description |
|----------|---------|-------------|
| `CRM_USERNAME` | `admin` | Login username |
| `CRM_PASSWORD` | `123qwe` | Login password |
| `TEST_ENV` | `qa` | Target environment |

## CI/CD

Two workflows run via GitHub Actions:

### Regression Tests (`playwright-tests.yml`)

| Trigger | Tests | Browsers |
|---------|-------|----------|
| Push to `main` | `smoke.spec.ts` + `entity-smoke.spec.ts` | Chromium |
| Pull request to `main` | `smoke.spec.ts` + `entity-smoke.spec.ts` | Chromium |
| Daily schedule (02:00 SAST) | All test files | Chromium, Firefox, WebKit |
| Manual dispatch | All test files | Chromium, Firefox, WebKit |

When tests fail after retries, an AI-powered analysis runs automatically — it extracts failure details, sends them to the Claude API for root cause analysis, and posts the results to the GitHub Actions step summary.

**Required secret**: `ANTHROPIC_API_KEY` — needed for AI failure analysis.

### UI Baseline Monitor (`ui-baseline-monitor.yml`)

| Trigger | Behavior |
|---------|----------|
| Daily schedule (03:00 SAST) | Compare current UI against baselines, fail on unexpected changes |
| Manual dispatch (`update_baselines=false`) | Same as daily — compare mode |
| Manual dispatch (`update_baselines=true`) | Regenerate all baselines and commit to repo |

Monitors 22 pages across the entire CRM workflow. Dynamic content (record data, status-dependent buttons, pagination) is filtered out to avoid false positives.

### Reports

- **Allure report** — Published to GitHub Pages on `main` branch pushes. Historical trends preserved across runs via `actions/cache`.
- **Playwright HTML report** — Uploaded as build artifact (30-day retention).
- **AI failure analysis** — Posted to GitHub Actions step summary when tests fail. Also uploaded as artifact.

```bash
# Open Playwright HTML report locally
npm run report:open

# Generate and open Allure report locally
npm run allure:generate
npm run allure:open
```

## Configuration

| Setting | Local | CI |
|---------|-------|----|
| Retries | 0 | 2 |
| Fail-fast | First failure | Run all |
| Workers | 4 | 4 |
| Browsers | Chromium | Chromium (all on schedule) |
| Headless | Yes | Yes |
| Test timeout | 120s | 120s |
| Expect timeout | 30s | 30s |

## Key Conventions

- **No hardcoded waits** — Tests use `expect().toBeVisible()`, `waitForURL()`, and `waitForResponse()` instead of `waitForTimeout()`.
- **No CSS class selectors** — Locators use `data-testid`, `id`, ARIA roles, labels, or visible text (in that priority order).
- **Unique test data** — Each test run generates unique first names via `uniqueFirstName()` (timestamp-based) to avoid data collisions.
- **Serial vs parallel** — Happy-path suites run serially (shared browser session). Validation tests run in parallel (independent browser contexts per group).
- **Married workflow** — Individual flow handles Marital Status, Marital Regime, and Spouse Information (including spouse verification approval). Entity directors support married status in director data.

## Known Application Behaviors

The following behaviors are documented by edge-case tests:

- **No client-side validation for directors** — Director dialog saves with empty fields or invalid SA ID numbers without showing validation errors.
- **No client-side validation for signatories** — Signatory dialog saves with empty fields without showing validation errors.
- **Global search bar on Leads table does not filter results** — Filtering is done via column-level filter inputs instead.
