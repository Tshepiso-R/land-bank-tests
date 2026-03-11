# CLAUDE.md – LandBank CRM Playwright Automation Rules

This file defines how Claude Code must behave when working on this project.
Read and follow all rules before writing any code.

---

## 1. Explore Before You Code
- ALWAYS navigate the real app before writing any test or locator
- NEVER guess a selector — inspect the real DOM first
- If a page requires a previous step to complete first, navigate through it manually to reach the target page
- Re-explore any page that has changed before updating its tests

---

## 2. Locator Strategy (in priority order)
Always pick locators in this order — stop at the first one that works:

1. `data-testid` attribute
2. `id` attribute
3. ARIA role + name (e.g. `getByRole('button', { name: 'Submit' })`)
4. Label text (e.g. `getByLabel('First Name')`)
5. Placeholder text
6. Visible text (e.g. `getByText`, `text=`)

- NEVER use CSS classes as locators (they change with styling updates)
- NEVER use XPath unless there is absolutely no alternative
- NEVER use positional locators like `nth(0)` unless the element has no other unique identifier

---

## 3. File Structure
Always maintain this structure — do not deviate:

```
tests/
  create-lead.spec.ts
  pre-screening.spec.ts
  loan-details.spec.ts
  consent.spec.ts
  verification-review.spec.ts
  onboarding-checklist.spec.ts
  utils/
    login.ts            ← shared login helper only
    testData.ts         ← all test input values
    locators/
      leadLocators.ts
      preScreeningLocators.ts
      loanLocators.ts
      consentLocators.ts
      verificationLocators.ts
      onboardingLocators.ts
```

- One spec file per module
- One locator file per module
- No selectors inside spec files — all selectors go in locators files
- No test data hardcoded inside spec files — all data goes in testData.ts

---

## 4. Test Structure
- Use `test.describe` to group tests by feature (e.g. `Create a Lead`)
- Name every test as a plain sentence describing what it does and what is expected, e.g:
  - `should create a lead with all valid fields`
  - `should show validation error when first name is missing`
  - `should disqualify lead when applicant is blacklisted`
- Use `test.beforeEach` for login and navigation shared across tests in the same describe block
- Every test must be independently runnable — no test should depend on another test's state

---

## 5. Data-Driven Negative Tests
- NEVER write separate tests for the same negative scenario with different inputs
- Use `test.each` for any scenario that repeats the same steps with different data
- Example: testing each required field missing = one `test.each`, not one test per field

---

## 6. Waiting and Async
- NEVER use `page.waitForTimeout()` or any hardcoded sleep
- Always wait for a specific condition:
  - `await expect(locator).toBeVisible()`
  - `await expect(locator).toContainText()`
  - `await page.waitForURL()`
  - `await page.waitForResponse()`

---

## 7. Assertions
- Every test must have at least one assertion
- Assert the outcome, not just the action (e.g. assert the record appears, not just that you clicked Save)
- For negative tests always assert BOTH:
  - The error message is shown
  - The unwanted action did NOT happen (e.g. no record was created)
- For happy path tests always assert:
  - The success state is visible
  - The data was saved correctly

---

## 8. Test Data
- All test data lives in `utils/testData.ts`
- Never hardcode names, emails, ID numbers, or amounts inside spec files
- Use realistic but fake SA data (valid SA ID number format, valid mobile format)
- Keep a separate data set for happy path and negative tests

---

## 9. Authentication
- Use the shared `login.ts` helper for all tests — never repeat login steps inside a spec file
- Store credentials as environment variables only — never hardcode them
- Read credentials like this:
  ```typescript
  process.env.CRM_USERNAME
  process.env.CRM_PASSWORD
  ```

---

## 10. When the UI Changes
- If a selector no longer works, re-explore that page before fixing it
- Update the relevant locator file only — do not scatter fixes across spec files
- Do not delete passing tests — fix the locator instead

---

## 11. What NOT to Do
- Do NOT use `page.waitForTimeout()`
- Do NOT hardcode selectors in spec files
- Do NOT hardcode credentials anywhere
- Do NOT write one test per missing field — use `test.each`
- Do NOT skip the exploration step
- Do NOT use CSS classes as locators
- Do NOT create new files outside the defined structure without a clear reason
