// Reads formatted test failures and calls Claude API to analyze root causes and suggest fixes.
// Requires ANTHROPIC_API_KEY environment variable.
const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.log('> **Skipped**: `ANTHROPIC_API_KEY` not set.');
  process.exit(0);
}

const failureReport = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'failure-report.json'), 'utf8'));

if (!failureReport.failures.length) {
  console.log('No failures to analyze.');
  process.exit(0);
}

// Collect relevant source code for context
function readFileContext(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

// Map spec files to their locator imports
const specToLocators = {
  'smoke.spec.ts': ['tests/utils/locators/leadLocators.ts', 'tests/utils/locators/loanLocators.ts', 'tests/utils/locators/verificationLocators.ts', 'tests/utils/locators/onboardingLocators.ts'],
  'entity-smoke.spec.ts': ['tests/utils/locators/leadLocators.ts', 'tests/utils/locators/loanLocators.ts', 'tests/utils/locators/entityLocators.ts', 'tests/utils/locators/verificationLocators.ts', 'tests/utils/locators/onboardingLocators.ts'],
  'validation-and-edge-cases.spec.ts': ['tests/utils/locators/leadLocators.ts', 'tests/utils/locators/loanLocators.ts', 'tests/utils/locators/entityLocators.ts', 'tests/utils/testHelpers.ts'],
};

// Build context from failing specs
const relevantFiles = new Set();
for (const failure of failureReport.failures) {
  const specFile = failure.file;
  relevantFiles.add(specFile);
  const baseName = path.basename(specFile);
  const locators = specToLocators[baseName] || [];
  locators.forEach(l => relevantFiles.add(l));
}

let sourceContext = '';
for (const file of relevantFiles) {
  const content = readFileContext(file);
  if (content) {
    // Truncate large files to keep prompt manageable
    const truncated = content.length > 3000 ? content.substring(0, 3000) + '\n... (truncated)' : content;
    sourceContext += `\n### ${file}\n\`\`\`typescript\n${truncated}\n\`\`\`\n`;
  }
}

const prompt = `You are a Playwright test automation expert. Analyze these test failures for the LandBank CRM test suite.

## Environment
- App: LandBank CRM (Shesha framework, Ant Design components)
- URL: https://landbankcrm-adminportal-qa.shesha.app
- Playwright with TypeScript, Allure reporting
- Tests had ${failureReport.summary.total} total, ${failureReport.summary.passed} passed, ${failureReport.summary.failed} failed (after ${failureReport.failures[0]?.retries || 0} retries each)

## Failures
${failureReport.failures.map((f, i) => `
### ${i + 1}. ${f.title}
- **File**: ${f.file}:${f.line}
- **Project**: ${f.project}
- **Retries**: ${f.retries}
- **Error**: \`\`\`\n${f.error}\n\`\`\`
${f.snippet ? `- **Code snippet**: \`\`\`\n${f.snippet}\n\`\`\`` : ''}
`).join('\n')}

## Source Code
${sourceContext}

## Instructions
For each failure provide:
1. **Root cause** — locator broken, timing issue, app/data change, environment issue
2. **Suggested fix** — specific code change with snippet
3. **Severity** — CRITICAL (blocks workflow), HIGH (key feature), MEDIUM (minor)
4. **Category** — App bug vs Test maintenance

Keep it concise. Use markdown formatting.`;

async function analyze() {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.log(`> **AI analysis failed**: ${response.status} — ${err.substring(0, 200)}`);
    process.exit(1);
  }

  const data = await response.json();
  const analysis = data.content?.[0]?.text || 'No analysis returned.';
  console.log(analysis);
}

analyze().catch(err => {
  console.log(`> **AI analysis error**: ${err.message}`);
  process.exit(1);
});
